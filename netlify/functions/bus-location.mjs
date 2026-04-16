import { jsonResponse, BUS_STOPS, findNearestStopIndex } from './shared.mjs';
import { fetchActiveBuses } from './kurura.mjs';

function detectDirection(lat, lng) {
  const idx = findNearestStopIndex(lat, lng, BUS_STOPS);
  const stop = BUS_STOPS[idx];
  return { nearestStopIndex: idx, nearestStop: stop.name, order: stop.order };
}

export const handler = async () => {
  try {
    const active = await fetchActiveBuses();
    const buses = active.map(b => {
      const d = detectDirection(b.lat, b.lng);
      return {
        ...b,
        nearestStop: d.nearestStop,
        nearestStopIndex: d.nearestStopIndex,
        stopOrder: d.order,
      };
    });

    return jsonResponse({
      lastUpdated: new Date().toISOString(),
      buses,
      busCount: buses.length,
      isRunning: buses.length > 0,
    }, 200, 10); // 10秒CDNキャッシュ
  } catch (e) {
    return jsonResponse({
      lastUpdated: new Date().toISOString(),
      buses: [],
      busCount: 0,
      isRunning: false,
      error: e.message,
    }, 200, 0); // エラー時はキャッシュしない
  }
};
