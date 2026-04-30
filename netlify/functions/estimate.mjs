import {
  BUS_STOPS, haversineDistance, findNearestStopIndex, jsonResponse,
} from './shared.mjs';
import { fetchActiveBuses } from './kurura.mjs';
import { calculateRouteDistance } from './route-distance.mjs';
import { getWaypointsForGoogle } from './route-waypoints.mjs';

// メモリ削減: デフォルト1024MB→128MB（Compute GB-Hrs を1/8に削減）
export const config = { memory: 128 };

// バスの平均移動速度(km/h) - フォールバック計算用
const AVG_BUS_SPEED_KMH = 30;

// Google Directions API で渋滞考慮ルーティング (実際のバスルート上を強制経由)
//
// 経由点としてバス停＋信号交差点＋国道152号沿いの点を渡すことで、
// Googleが「最適ルート」を勝手に選ぶのではなく実際のバス経路に沿った
// 走行時間（渋滞考慮）を取得する。
// 距離はピンクの線（事前生成済みポリライン）と一致させるため、
// Googleの距離ではなくrouteDistanceの結果を使う。
async function estimateViaGoogleTraffic(bus, destLat, destLng, dwellSecondsTotal) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  // 1. ピンクのルート上の経由点を取得
  const wp = getWaypointsForGoogle(bus.direction, bus.lat, bus.lng, destLat, destLng);
  if (!wp) return null;
  if (wp.busPassed) return { busPassed: true };

  // 2. ピンクの線に沿った距離(km)を取得
  const distResult = calculateRouteDistance(bus.lat, bus.lng, destLat, destLng, bus.direction);
  const distanceKm = distResult ? distResult.distanceKm : null;

  // 3. Google Directions API 呼び出し (渋滞考慮)
  let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${bus.lat},${bus.lng}&destination=${destLat},${destLng}&departure_time=now&traffic_model=best_guess&key=${apiKey}`;
  if (wp.waypoints.length > 0) {
    const wpStr = wp.waypoints.map(p => encodeURIComponent(p.loc)).join('|');
    url += `&waypoints=${wpStr}`;
  }

  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 'OK' || !data.routes?.length) return null;

  const route = data.routes[0];
  let duration = 0;
  let trafficDuration = 0;
  for (const leg of route.legs) {
    duration += leg.duration.value;
    if (leg.duration_in_traffic) {
      trafficDuration += leg.duration_in_traffic.value;
    }
  }
  // 渋滞考慮の所要時間があればそちらを優先
  const effectiveDuration = trafficDuration > 0 ? trafficDuration : duration;
  const totalSeconds = effectiveDuration + dwellSecondsTotal;

  return {
    duration_minutes: Math.max(0, Math.round(totalSeconds / 60)),
    distance_km: distanceKm != null ? Math.round(distanceKm * 10) / 10 : Math.round(route.legs.reduce((s, l) => s + l.distance.value, 0) / 100) / 10,
    source: 'google-traffic-on-fixed-route',
    traffic_aware: trafficDuration > 0,
    bus_passed: false,
  };
}

// 固定ルート(ピンクの線)沿いの距離 + 固定速度 (Google API失敗時のフォールバック)
function estimateAlongFixedRoute(busLat, busLng, destLat, destLng, direction, dwellSecondsTotal) {
  const result = calculateRouteDistance(busLat, busLng, destLat, destLng, direction);
  if (!result) return null;
  const { distanceKm, busPassed } = result;
  const travelMinutes = (distanceKm / AVG_BUS_SPEED_KMH) * 60;
  const totalMinutes = travelMinutes + dwellSecondsTotal / 60;
  return {
    duration_minutes: Math.max(0, Math.round(totalMinutes)),
    distance_km: Math.round(distanceKm * 10) / 10,
    source: 'fixed-route',
    traffic_aware: false,
    bus_passed: busPassed,
  };
}

// 最終フォールバック (ポリラインデータも無い場合)
function fallbackEstimate(busLat, busLng, destLat, destLng, waypoints, dwellSecondsTotal) {
  const points = [[busLat, busLng]];
  if (waypoints) for (const s of waypoints) points.push([s.lat, s.lng]);
  points.push([destLat, destLng]);
  let dist = 0;
  for (let i = 0; i < points.length - 1; i++) {
    dist += haversineDistance(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
  }
  const roadDist = dist * 1.3;
  const minutes = Math.round((roadDist / AVG_BUS_SPEED_KMH) * 60) + Math.round(dwellSecondsTotal / 60);
  return {
    duration_minutes: minutes,
    distance_km: Math.round(roadDist * 10) / 10,
    source: 'fallback',
    traffic_aware: false,
    bus_passed: false,
  };
}

export const handler = async (event) => {
  const params = event.queryStringParameters || {};
  const stops = BUS_STOPS;

  let targetLat, targetLng, targetName, targetStopIdx;

  if (params.stopIndex != null) {
    const idx = parseInt(params.stopIndex, 10);
    if (idx < 0 || idx >= stops.length) {
      return jsonResponse({ error: 'バス停が見つかりません' }, 400);
    }
    targetLat = stops[idx].lat;
    targetLng = stops[idx].lng;
    targetName = stops[idx].name;
    targetStopIdx = idx;
  } else if (params.lat && params.lng) {
    targetLat = parseFloat(params.lat);
    targetLng = parseFloat(params.lng);
    targetName = '現在地付近';
    targetStopIdx = findNearestStopIndex(targetLat, targetLng, stops);
  } else {
    return jsonResponse({ error: 'stopIndex または lat/lng を指定してください' }, 400);
  }

  // くるらからバス位置をリアルタイム取得（対象便のみ）
  let buses = [];
  try {
    buses = await fetchActiveBuses();
  } catch (e) {
    // スクレイピング失敗
  }

  if (buses.length === 0) {
    return jsonResponse({
      target: targetName,
      isRunning: false,
      message: '現在バスは運行していません',
      estimates: [],
    });
  }

  // 各バスの到着予測を計算
  const estimates = [];
  for (const bus of buses) {
    const busNearest = findNearestStopIndex(bus.lat, bus.lng, stops);
    const numStops = Math.abs(targetStopIdx - busNearest);

    // 中間バス停の停車時間を合計
    let waypoints;
    if (busNearest < targetStopIdx) {
      waypoints = stops.slice(busNearest, targetStopIdx + 1);
    } else if (busNearest > targetStopIdx) {
      waypoints = stops.slice(targetStopIdx, busNearest + 1).reverse();
    } else {
      waypoints = [];
    }
    let dwellSecondsTotal = 0;
    for (const wp of waypoints) dwellSecondsTotal += wp.dwellTime || 0;

    // 1. Google Directions API + 渋滞考慮 (実際のバスルート強制経由) を最優先
    let routing = null;
    try {
      routing = await estimateViaGoogleTraffic(bus, targetLat, targetLng, dwellSecondsTotal);
    } catch (_) {
      routing = null;
    }
    // 2. Google失敗時はピンクの線+固定速度
    if (!routing) {
      routing = estimateAlongFixedRoute(
        bus.lat, bus.lng, targetLat, targetLng, bus.direction, dwellSecondsTotal
      );
    }
    // 3. 最終フォールバック
    if (!routing) {
      routing = fallbackEstimate(
        bus.lat, bus.lng, targetLat, targetLng, waypoints, dwellSecondsTotal
      );
    }

    estimates.push({
      route: bus.route,
      busLat: bus.lat,
      busLng: bus.lng,
      estimatedMinutes: routing.duration_minutes,
      distanceKm: routing.distance_km,
      numStops,
      source: routing.source,
      trafficAware: routing.traffic_aware,
      busPassed: routing.bus_passed || false,
      timestamp: bus.timestamp,
    });
  }

  estimates.sort((a, b) => a.estimatedMinutes - b.estimatedMinutes);

  return jsonResponse({
    target: targetName,
    targetLat,
    targetLng,
    isRunning: true,
    estimates,
  });
};
