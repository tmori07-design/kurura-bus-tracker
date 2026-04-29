import {
  BUS_STOPS, haversineDistance, findNearestStopIndex, jsonResponse,
} from './shared.mjs';
import { fetchActiveBuses } from './kurura.mjs';
import { calculateRouteDistance } from './route-distance.mjs';

// メモリ削減: デフォルト1024MB→128MB（Compute GB-Hrs を1/8に削減）
export const config = { memory: 128 };

// バスの平均移動速度(km/h)
// NAVITIME時刻表より逆算: かぐらの湯⇄飯田駅前は約45km・約68〜90分 → 30〜40km/h
// 山道・狭隘区間を含むため保守的に30km/hを採用
const AVG_BUS_SPEED_KMH = 30;

// 固定ルート（実際にバスが通る道）に沿った距離・時間計算
// バスは渋滞によらず必ず同じ道を通るため、Google Mapsの最適ルートには依存しない
function estimateAlongFixedRoute(busLat, busLng, destLat, destLng, direction, waypoints) {
  const result = calculateRouteDistance(busLat, busLng, destLat, destLng, direction);
  if (!result) return null;

  const { distanceKm, busPassed } = result;

  // 走行時間 = 距離 ÷ 平均速度
  const travelMinutes = (distanceKm / AVG_BUS_SPEED_KMH) * 60;

  // 中間バス停の停車時間を合計
  let dwellSeconds = 0;
  if (waypoints) {
    for (const wp of waypoints) {
      dwellSeconds += wp.dwellTime || 0;
    }
  }
  const totalMinutes = travelMinutes + dwellSeconds / 60;

  return {
    duration_minutes: Math.max(0, Math.round(totalMinutes)),
    distance_km: Math.round(distanceKm * 10) / 10,
    source: 'fixed-route',
    traffic_aware: false,
    bus_passed: busPassed,
  };
}

// フォールバック計算（ポリラインデータが無い場合のみ使用）
function fallbackEstimate(busLat, busLng, destLat, destLng, waypoints) {
  const points = [[busLat, busLng]];
  if (waypoints) {
    for (const s of waypoints) points.push([s.lat, s.lng]);
  }
  points.push([destLat, destLng]);

  let dist = 0;
  for (let i = 0; i < points.length - 1; i++) {
    dist += haversineDistance(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
  }
  const roadDist = dist * 1.3;
  let dwellTotal = 0;
  if (waypoints) {
    for (const wp of waypoints) dwellTotal += wp.dwellTime || 0;
  }
  const minutes = Math.round((roadDist / AVG_BUS_SPEED_KMH) * 60) + Math.round(dwellTotal / 60);

  return {
    duration_minutes: minutes,
    distance_km: Math.round(roadDist * 10) / 10,
    source: 'fallback',
    traffic_aware: false,
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

    let waypoints;
    if (busNearest < targetStopIdx) {
      waypoints = stops.slice(busNearest, targetStopIdx + 1);
    } else if (busNearest > targetStopIdx) {
      waypoints = stops.slice(targetStopIdx, busNearest + 1).reverse();
    } else {
      waypoints = [];
    }

    // 固定ルート（実際にバスが通る道）に沿って距離・時間を計算
    let routing = estimateAlongFixedRoute(
      bus.lat, bus.lng, targetLat, targetLng, bus.direction, waypoints
    );
    // 万が一ポリラインが見つからない場合のみフォールバック
    if (!routing) {
      routing = fallbackEstimate(bus.lat, bus.lng, targetLat, targetLng, waypoints);
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
