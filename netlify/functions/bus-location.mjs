import { jsonResponse, BUS_STOPS, findNearestStopIndex } from './shared.mjs';

// バスの進行方向を判定（最寄り停留所のorderで推定）
function detectDirection(lat, lng) {
  const idx = findNearestStopIndex(lat, lng, BUS_STOPS);
  const stop = BUS_STOPS[idx];
  // 飯田側（order小）にいるか和田側（order大）にいるかで大まかに判定
  // 厳密な方向は位置の変化で判定する必要があるが、まずは最寄り停留所を返す
  return { nearestStopIndex: idx, nearestStop: stop.name, order: stop.order };
}

export const handler = async () => {
  try {
    // くるらの location ページを取得
    const locationRes = await fetch(
      'https://bus-kurura.jp/IBNAVI_location.php?plant=1&route=E1',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'ja,en;q=0.9',
        },
      }
    );
    const locationCookies = locationRes.headers.get('set-cookie') || '';
    const cookie = locationCookies.split(';')[0];

    // map ページを取得
    const mapRes = await fetch(
      'https://bus-kurura.jp/IBNAVI_map.php?plant=1&route=E1',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'ja,en;q=0.9',
          'Cookie': cookie,
        },
      }
    );
    const mapHtml = await mapRes.text();

    const buses = [];
    const defaultLat = 35.514751;
    const defaultLng = 137.816897;

    // markersData から複数バスの座標を抽出
    const markersMatch = mapHtml.match(/markersData\s*=\s*\[([\s\S]*?)\]/);
    if (markersMatch) {
      const entries = markersMatch[1].matchAll(/\[\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\]/g);
      for (const m of entries) {
        const lat = parseFloat(m[1]);
        const lng = parseFloat(m[2]);
        if (!(Math.abs(lat - defaultLat) < 0.0001 && Math.abs(lng - defaultLng) < 0.0001)) {
          const dir = detectDirection(lat, lng);
          buses.push({
            route: 'E1',
            lat,
            lng,
            nearestStop: dir.nearestStop,
            nearestStopIndex: dir.nearestStopIndex,
            stopOrder: dir.order,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    // markersData がなければ var gps からフォールバック
    if (buses.length === 0) {
      const gpsMatch = mapHtml.match(/var\s+gps\s*=\s*\[([0-9.]+),\s*([0-9.]+)\]/);
      if (gpsMatch) {
        const lat = parseFloat(gpsMatch[1]);
        const lng = parseFloat(gpsMatch[2]);
        if (!(Math.abs(lat - defaultLat) < 0.0001 && Math.abs(lng - defaultLng) < 0.0001)) {
          const dir = detectDirection(lat, lng);
          buses.push({
            route: 'E1',
            lat,
            lng,
            nearestStop: dir.nearestStop,
            nearestStopIndex: dir.nearestStopIndex,
            stopOrder: dir.order,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    return jsonResponse({
      lastUpdated: new Date().toISOString(),
      buses,
      busCount: buses.length,
      isRunning: buses.length > 0,
    });
  } catch (e) {
    return jsonResponse({
      lastUpdated: new Date().toISOString(),
      buses: [],
      busCount: 0,
      isRunning: false,
      error: e.message,
    });
  }
};
