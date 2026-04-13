import { jsonResponse } from './shared.mjs';

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

    // GPS 座標を抽出 (var gps = [lat, lng])
    const gpsMatch = mapHtml.match(/var\s+gps\s*=\s*\[([0-9.]+),\s*([0-9.]+)\]/);
    if (gpsMatch) {
      const lat = parseFloat(gpsMatch[1]);
      const lng = parseFloat(gpsMatch[2]);

      // デフォルト位置（飯田駅）でなければバスが走っている
      if (!(Math.abs(lat - 35.514751) < 0.0001 && Math.abs(lng - 137.816897) < 0.0001)) {
        buses.push({
          route: 'E1',
          lat,
          lng,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return jsonResponse({
      lastUpdated: new Date().toISOString(),
      buses,
      isRunning: buses.length > 0,
    });
  } catch (e) {
    return jsonResponse({
      lastUpdated: new Date().toISOString(),
      buses: [],
      isRunning: false,
      error: e.message,
    });
  }
};
