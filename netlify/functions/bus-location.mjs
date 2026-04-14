import { jsonResponse, BUS_STOPS, findNearestStopIndex } from './shared.mjs';

// バスの進行方向を判定（最寄り停留所のorderで推定）
function detectDirection(lat, lng) {
  const idx = findNearestStopIndex(lat, lng, BUS_STOPS);
  const stop = BUS_STOPS[idx];
  return { nearestStopIndex: idx, nearestStop: stop.name, order: stop.order };
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const BASE = 'https://bus-kurura.jp';

// 新しいセッションCookieを取得
async function newSession() {
  const res = await fetch(`${BASE}/IBNAVI_strains.php?plant=1&route=E1`, {
    headers: { 'User-Agent': UA },
  });
  const setCookie = res.headers.get('set-cookie') || '';
  const cookie = setCookie.split(';')[0];
  const html = await res.text();
  return { cookie, strainsHtml: html };
}

// strains.php から運行中バス一覧を抽出
// href パターン:
// IBNAVI_location.php?plant=1&route=E1&arrow=7_1&timetableCD=71016&vehiclenum=15&mintime=...&maxtime=...&page=1
function parseRunningBuses(html) {
  const buses = [];
  const re = /arrow=(7_[12])&timetableCD=(\d+)&vehiclenum=(\d+)&mintime=([^&]+)&maxtime=([^&"]+)/g;
  const seen = new Set();
  let m;
  while ((m = re.exec(html)) !== null) {
    const arrow = m[1];
    const timetableCD = m[2];
    const vehiclenum = m[3];
    const mintime = decodeURIComponent(m[4].replace(/\+/g, ' '));
    const maxtime = decodeURIComponent(m[5].replace(/\+/g, ' '));
    const key = `${vehiclenum}-${timetableCD}`;
    if (seen.has(key)) continue;
    seen.add(key);
    buses.push({ arrow, timetableCD, vehiclenum, mintime, maxtime });
  }
  return buses;
}

// 1台のバスのGPSを取得（session POST → map.php）
async function fetchBusGps(bus) {
  // 各バス用に新しいセッション
  const { cookie } = await newSession();

  // session.php に POST（clickspan フローを再現）
  const form = new URLSearchParams();
  form.append('VeNum', bus.vehiclenum);
  form.append('timetableCD', bus.timetableCD);
  form.append('mintime', bus.mintime);
  form.append('maxtime', bus.maxtime);

  await fetch(`${BASE}/IBNAVI_session.php`, {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      'Cookie': cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': `${BASE}/IBNAVI_location.php?plant=1&route=E1`,
    },
    body: form.toString(),
  });

  // map.php で GPS を取得
  const mapRes = await fetch(`${BASE}/IBNAVI_map.php?plant=1&route=E1&arrow=`, {
    headers: {
      'User-Agent': UA,
      'Cookie': cookie,
    },
  });
  const mapHtml = await mapRes.text();

  const gpsMatch = mapHtml.match(/var\s+gps\s*=\s*\[([0-9.]+)\s*,\s*([0-9.]+)\]/);
  if (!gpsMatch) return null;
  const lat = parseFloat(gpsMatch[1]);
  const lng = parseFloat(gpsMatch[2]);
  if (!isFinite(lat) || !isFinite(lng)) return null;
  // 会社駐車場のデフォルト座標は除外
  const defaultLat = 35.514751, defaultLng = 137.816897;
  if (Math.abs(lat - defaultLat) < 0.0001 && Math.abs(lng - defaultLng) < 0.0001) {
    return null;
  }
  return { lat, lng };
}

export const handler = async () => {
  try {
    const { strainsHtml } = await newSession();
    const running = parseRunningBuses(strainsHtml);

    const buses = [];
    for (const r of running) {
      try {
        const gps = await fetchBusGps(r);
        if (!gps) continue;
        const dir = detectDirection(gps.lat, gps.lng);
        // arrow=7_1 は飯田→和田、7_2 は和田→飯田
        const direction = r.arrow === '7_1' ? 'to-wada' : 'to-iida';
        buses.push({
          route: 'E1',
          vehicleNum: r.vehiclenum,
          direction,
          lat: gps.lat,
          lng: gps.lng,
          nearestStop: dir.nearestStop,
          nearestStopIndex: dir.nearestStopIndex,
          stopOrder: dir.order,
          timestamp: new Date().toISOString(),
        });
      } catch (_) {
        // 1台失敗しても他を続ける
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
