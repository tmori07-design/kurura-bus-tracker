import {
  BUS_STOPS, haversineDistance, findNearestStopIndex, jsonResponse,
} from './shared.mjs';
import { fetchActiveBuses } from './kurura.mjs';

// Google Maps Directions API で渋滞考慮ルーティング
async function routeViaGoogleMaps(busLat, busLng, destLat, destLng, waypoints) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${busLat},${busLng}&destination=${destLat},${destLng}&departure_time=now&traffic_model=best_guess&key=${apiKey}`;

  // 中間バス停をwaypointsとして追加
  if (waypoints && waypoints.length > 2) {
    let mid = waypoints.slice(1, -1);
    if (mid.length > 23) {
      const step = mid.length / 23;
      mid = Array.from({ length: 23 }, (_, i) => mid[Math.floor(i * step)]);
    }
    const wp = mid.map(s => `${s.lat},${s.lng}`).join('|');
    url += `&waypoints=${encodeURIComponent(wp)}`;
  }

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' || !data.routes?.length) return null;

  const route = data.routes[0];
  let duration = 0;
  let distance = 0;
  let trafficDuration = 0;

  for (const leg of route.legs) {
    duration += leg.duration.value;
    distance += leg.distance.value;
    if (leg.duration_in_traffic) {
      trafficDuration += leg.duration_in_traffic.value;
    }
  }

  // 渋滞考慮の所要時間があればそちらを使用
  const effectiveDuration = trafficDuration > 0 ? trafficDuration : duration;

  // バス停ごとの停車時間を加算
  let dwellTotal = 0;
  if (waypoints) {
    for (const wp of waypoints) {
      dwellTotal += wp.dwellTime || 0;
    }
  }
  const totalDuration = effectiveDuration + dwellTotal;

  return {
    duration_minutes: Math.round(totalDuration / 60),
    distance_km: Math.round(distance / 1000 * 10) / 10,
    source: 'google',
    traffic_aware: trafficDuration > 0,
  };
}

// OSRM で道路ルーティング
async function routeViaOSRM(busLat, busLng, destLat, destLng, waypoints) {
  const coords = [`${busLng},${busLat}`];

  if (waypoints && waypoints.length > 2) {
    let mid = waypoints.slice(1, -1);
    if (mid.length > 15) {
      const step = mid.length / 15;
      mid = Array.from({ length: 15 }, (_, i) => mid[Math.floor(i * step)]);
    }
    for (const s of mid) {
      coords.push(`${s.lng},${s.lat}`);
    }
  }

  coords.push(`${destLng},${destLat}`);
  const url = `https://router.project-osrm.org/route/v1/driving/${coords.join(';')}?overview=false`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'KururaTracker/1.0' },
  });
  const data = await res.json();

  if (data.code !== 'Ok' || !data.routes?.length) return null;

  let duration = data.routes[0].duration;
  const distance = data.routes[0].distance;

  // バス停ごとの停車時間を加算
  if (waypoints) {
    for (const wp of waypoints) {
      duration += wp.dwellTime || 0;
    }
  }

  return {
    duration_minutes: Math.round(duration / 60),
    distance_km: Math.round(distance / 1000 * 10) / 10,
    source: 'osrm',
    traffic_aware: false,
  };
}

// フォールバック計算
function fallbackEstimate(busLat, busLng, destLat, destLng, waypoints, numStops) {
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
  const minutes = Math.round((roadDist / 25) * 60) + Math.round(dwellTotal / 60);

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

    let routing;
    // Google Maps（渋滞対応）→ OSRM → フォールバック
    try {
      routing = await routeViaGoogleMaps(bus.lat, bus.lng, targetLat, targetLng, waypoints);
    } catch (e) {
      routing = null;
    }
    if (!routing) {
      try {
        routing = await routeViaOSRM(bus.lat, bus.lng, targetLat, targetLng, waypoints);
      } catch (e) {
        routing = null;
      }
    }
    if (!routing) {
      routing = fallbackEstimate(bus.lat, bus.lng, targetLat, targetLng, waypoints, numStops);
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
