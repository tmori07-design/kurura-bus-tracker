// くるら(bus-kurura.jp) スクレイピング共通モジュール (Cloudflare版)

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const BASE = 'https://bus-kurura.jp';

async function newSession() {
  const res = await fetch(`${BASE}/IBNAVI_strains.php?plant=1&route=E1`, {
    headers: { 'User-Agent': UA },
  });
  const setCookie = res.headers.get('set-cookie') || '';
  const cookie = setCookie.split(';')[0];
  const html = await res.text();
  return { cookie, strainsHtml: html };
}

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

// 対象便のみを抽出:
//   7:00 飯田駅前→和田       arrow=7_1, timetableCD=71016
//   16:24 かぐらの湯→飯田駅前 arrow=7_2, timetableCD=72016
export function isTargetDeparture(r) {
  if (r.arrow === '7_1' && r.timetableCD === '71016') return true;
  if (r.arrow === '7_2' && r.timetableCD === '72016') return true;
  return false;
}

async function fetchBusGps(bus) {
  const { cookie } = await newSession();

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
  const defaultLat = 35.514751, defaultLng = 137.816897;
  if (Math.abs(lat - defaultLat) < 0.0001 && Math.abs(lng - defaultLng) < 0.0001) {
    return null;
  }
  return { lat, lng };
}

// --- インメモリキャッシュ ---
// Cloudflare Workers は短時間で同じインスタンスが再利用されることがある。
// 10秒間キャッシュすることで、くるらへの重複リクエストを防ぐ。
let busCache = { data: null, expiry: 0 };
const CACHE_TTL_MS = 10_000;

export async function fetchActiveBuses() {
  const now = Date.now();
  if (busCache.data && now < busCache.expiry) {
    return busCache.data;
  }

  const { strainsHtml } = await newSession();
  const running = parseRunningBuses(strainsHtml).filter(isTargetDeparture);

  const out = [];
  for (const r of running) {
    try {
      const gps = await fetchBusGps(r);
      if (!gps) continue;
      const direction = r.arrow === '7_1' ? 'to-wada' : 'to-iida';
      out.push({
        route: 'E1',
        vehicleNum: r.vehiclenum,
        timetableCD: r.timetableCD,
        mintime: r.mintime,
        direction,
        lat: gps.lat,
        lng: gps.lng,
        timestamp: new Date().toISOString(),
      });
    } catch (_) {}
  }

  busCache = { data: out, expiry: now + CACHE_TTL_MS };
  return out;
}
