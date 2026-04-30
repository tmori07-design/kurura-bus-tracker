// 一時的: Google Directions API の渋滞データ取得テスト

import { jsonResponse } from './shared.mjs';
export const config = { memory: 256 };

async function tryUrl(label, url, apiKey) {
  const res = await fetch(url + `&key=${apiKey}`);
  const data = await res.json();
  if (data.status !== 'OK') {
    return { label, status: data.status, error: data.error_message };
  }
  const route = data.routes[0];
  return {
    label,
    legCount: route.legs.length,
    legs: route.legs.map(l => ({
      start: l.start_address?.split(',')[0],
      end: l.end_address?.split(',')[0],
      duration: l.duration?.value,
      duration_in_traffic: l.duration_in_traffic?.value || null,
    })),
  };
}

export const handler = async () => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return jsonResponse({ error: 'no key' }, 500);

  const origin = '35.51904,137.82081'; // 飯田駅前
  const destination = '35.32109,137.92969'; // かぐらの湯
  const base = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&departure_time=now&traffic_model=best_guess`;

  // テスト1: 経由点なし
  const test1 = await tryUrl('1: no waypoints', base, apiKey);

  // テスト2: stopover 経由点 (デフォルト)
  const test2 = await tryUrl('2: stopover waypoints', base + `&waypoints=35.51539,137.82812|35.50848,137.83848`, apiKey);

  // テスト3: via: 経由点 (リテラルcolon)
  const test3 = await tryUrl('3: via: waypoints (literal colon)', base + `&waypoints=via:35.51539,137.82812|via:35.50848,137.83848`, apiKey);

  // テスト4: via: 経由点 全URLエンコード
  const wp4 = encodeURIComponent('via:35.51539,137.82812|via:35.50848,137.83848');
  const test4 = await tryUrl('4: via: waypoints (full encode)', base + `&waypoints=${wp4}`, apiKey);

  // テスト5: 場所名(via:)を含む混在
  const wp5 = `via:35.51539,137.82812|via:${encodeURIComponent('中央交差点 飯田市')}|via:35.50848,137.83848`;
  const test5 = await tryUrl('5: lat/lng + place name (via:)', base + `&waypoints=${wp5}`, apiKey);

  // テスト6: 場所名のみ via:
  const wp6 = `via:${encodeURIComponent('中央交差点 飯田市')}`;
  const test6 = await tryUrl('6: place name only (via:)', base + `&waypoints=${wp6}`, apiKey);

  return jsonResponse({ test1, test2, test3, test4, test5, test6 });
};
