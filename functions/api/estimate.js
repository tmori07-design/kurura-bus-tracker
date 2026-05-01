// /api/estimate - 到着予測 (実際のバスルート + 渋滞考慮) (Cloudflare Pages Functions)

import {
  BUS_STOPS, haversineDistance, findNearestStopIndex, jsonResponse,
} from '../_shared/shared.js';
import { fetchActiveBuses } from '../_shared/kurura.js';
import { calculateRouteDistance } from '../_shared/route-distance.js';
import { getWaypointsForGoogle, getJourneyInfo } from '../_shared/route-waypoints.js';

const AVG_BUS_SPEED_KMH = 30;

// Google Directions API + 渋滞考慮 (実際のバスルート上を強制経由)
async function estimateViaGoogleTraffic(bus, destLat, destLng, dwellSecondsTotal, apiKey) {
  if (!apiKey) return null;

  const wp = getWaypointsForGoogle(bus.direction, bus.lat, bus.lng, destLat, destLng);
  if (!wp) return null;
  if (wp.busPassed) return { busPassed: true };

  const distResult = calculateRouteDistance(bus.lat, bus.lng, destLat, destLng, bus.direction);
  const distanceKm = distResult ? distResult.distanceKm : null;

  let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${bus.lat},${bus.lng}&destination=${destLat},${destLng}&departure_time=now&traffic_model=best_guess&key=${apiKey}`;
  if (wp.waypoints.length > 0) {
    const wpStr = wp.waypoints.map(p => 'via:' + encodeURIComponent(p.loc)).join('|');
    url += `&waypoints=${wpStr}`;
  }

  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 'OK' || !data.routes?.length) return null;

  const route = data.routes[0];
  let totalDuration = 0;
  let hasAnyTraffic = false;
  for (const leg of route.legs) {
    const dur = leg.duration?.value || 0;
    const traf = leg.duration_in_traffic?.value;
    if (traf != null) {
      totalDuration += traf;
      hasAnyTraffic = true;
    } else {
      totalDuration += dur;
    }
  }
  const totalSeconds = totalDuration + dwellSecondsTotal;

  return {
    duration_minutes: Math.max(0, Math.round(totalSeconds / 60)),
    distance_km: distanceKm != null ? Math.round(distanceKm * 10) / 10 : Math.round(route.legs.reduce((s, l) => s + l.distance.value, 0) / 100) / 10,
    source: 'google-traffic-on-fixed-route',
    traffic_aware: hasAnyTraffic,
    bus_passed: false,
  };
}

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

function fallbackEstimate(busLat, busLng, destLat, destLng, dwellSecondsTotal) {
  const dist = haversineDistance(busLat, busLng, destLat, destLng);
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

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams);
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

  let buses = [];
  try {
    buses = await fetchActiveBuses();
  } catch (e) {}

  if (buses.length === 0) {
    return jsonResponse({
      target: targetName,
      isRunning: false,
      message: '現在バスは運行していません',
      estimates: [],
    });
  }

  const apiKey = env.GOOGLE_MAPS_API_KEY;
  const estimates = [];
  for (const bus of buses) {
    const journey = getJourneyInfo(bus.direction, bus.lat, bus.lng, targetLat, targetLng);
    const dwellSecondsTotal = journey?.dwellSeconds || 0;
    const numStops = journey?.numStops || 0;
    const busAlreadyPassed = journey?.busPassed || false;

    let routing = null;
    try {
      routing = await estimateViaGoogleTraffic(bus, targetLat, targetLng, dwellSecondsTotal, apiKey);
    } catch (_) {
      routing = null;
    }
    if (!routing) {
      routing = estimateAlongFixedRoute(
        bus.lat, bus.lng, targetLat, targetLng, bus.direction, dwellSecondsTotal
      );
    }
    if (!routing) {
      routing = fallbackEstimate(
        bus.lat, bus.lng, targetLat, targetLng, dwellSecondsTotal
      );
    }
    if (busAlreadyPassed) routing.bus_passed = true;

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
}
