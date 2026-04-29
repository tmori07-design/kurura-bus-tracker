// 共通データ・ユーティリティ

// 遠山郷線（E1）飯田駅前→和田 方面の全停留所
// 座標は信南交通公式サイトのマップデータから取得
// dwellTime: 30 = 乗降が多い停留所、0 = 通過が多い停留所
export const BUS_STOPS = [
  // --- 飯田市中心部 ---
  { name: "飯田駅前", lat: 35.51904, lng: 137.82081, order: 0, dwellTime: 0 },
  { name: "飯田市役所", lat: 35.51516, lng: 137.82223, order: 2, dwellTime: 0 },
  { name: "中央広場", lat: 35.51539, lng: 137.82812, order: 3, dwellTime: 0 },
  { name: "東中央通り", lat: 35.51231, lng: 137.83434, order: 4, dwellTime: 0 },
  { name: "飯田橋", lat: 35.50848, lng: 137.83848, order: 5, dwellTime: 0 },
  // --- 喬木エリア ---
  { name: "寺所入口", lat: 35.50522, lng: 137.85055, order: 16, dwellTime: 0 },
  { name: "新井", lat: 35.50336, lng: 137.85876, order: 17, dwellTime: 30 },
  { name: "弁天", lat: 35.50102, lng: 137.86141, order: 18, dwellTime: 0 },
  { name: "北原", lat: 35.49428, lng: 137.86589, order: 19, dwellTime: 0 },
  { name: "楽珍館前", lat: 35.48716, lng: 137.88679, order: 20, dwellTime: 30 },
  { name: "富田辻", lat: 35.48516, lng: 137.88603, order: 21, dwellTime: 0 },
  { name: "第二小学校入口", lat: 35.48415, lng: 137.88907, order: 22, dwellTime: 0 },
  { name: "馬草田", lat: 35.48509, lng: 137.89389, order: 23, dwellTime: 0 },
  { name: "一本木", lat: 35.483234, lng: 137.896659, order: 24, dwellTime: 0 },
  { name: "大和知", lat: 35.48340, lng: 137.89968, order: 25, dwellTime: 0 },
  { name: "久保の下", lat: 35.48555, lng: 137.90060, order: 26, dwellTime: 0 },
  { name: "氏乗", lat: 35.48288, lng: 137.90785, order: 27, dwellTime: 0 },
  { name: "近藤商店前", lat: 35.48157, lng: 137.91018, order: 28, dwellTime: 0 },
  // --- 遠山入口（山間部）---
  { name: "小沢橋", lat: 35.44018, lng: 137.99171, order: 29, dwellTime: 0 },
  { name: "程野", lat: 35.43849, lng: 137.99107, order: 30, dwellTime: 0 },
  { name: "柄沢前", lat: 35.43564, lng: 137.98963, order: 31, dwellTime: 0 },
  { name: "宮の前", lat: 35.43370, lng: 137.98880, order: 32, dwellTime: 0 },
  { name: "東前", lat: 35.42463, lng: 137.98349, order: 33, dwellTime: 0 },
  { name: "うとどち", lat: 35.42070, lng: 137.98064, order: 34, dwellTime: 0 },
  { name: "行者", lat: 35.41258, lng: 137.97602, order: 35, dwellTime: 0 },
  { name: "上中郷", lat: 35.40924, lng: 137.97514, order: 36, dwellTime: 0 },
  { name: "新島", lat: 35.40771, lng: 137.97454, order: 37, dwellTime: 0 },
  { name: "コミュニティ前", lat: 35.40153, lng: 137.97258, order: 38, dwellTime: 0 },
  { name: "下中郷", lat: 35.39902, lng: 137.97133, order: 39, dwellTime: 0 },
  { name: "黒川前", lat: 35.39533, lng: 137.96908, order: 40, dwellTime: 0 },
  { name: "万場", lat: 35.38760, lng: 137.97020, order: 41, dwellTime: 0 },
  { name: "上町", lat: 35.38415, lng: 137.96847, order: 42, dwellTime: 0 },
  { name: "学校前", lat: 35.38204, lng: 137.96793, order: 43, dwellTime: 30 },
  // 学校前〜和田間の停留所は利用者がいないため省略
  // --- 和田周辺 ---
  { name: "和田", lat: 35.32274, lng: 137.93444, order: 65, dwellTime: 0 },
  { name: "地域交流センター", lat: 35.32283, lng: 137.93200, order: 66, dwellTime: 0 },
  { name: "郵便局前", lat: 35.32109, lng: 137.92969, order: 67, dwellTime: 0 },
  { name: "かぐらの湯", lat: 35.32109, lng: 137.92969, order: 68, dwellTime: 0 },
  // --- 和田→飯田方面のみの停留所 ---
  { name: "知久町１丁目", lat: 35.51414, lng: 137.82529, order: 69, dwellTime: 30 },
  { name: "知久町３丁目", lat: 35.51543, lng: 137.82274, order: 70, dwellTime: 30 },
  { name: "飯田病院前", lat: 35.51738, lng: 137.81917, order: 71, dwellTime: 0 },
];

export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestStopIndex(lat, lng, stops) {
  let minDist = Infinity;
  let nearest = 0;
  for (let i = 0; i < stops.length; i++) {
    const d = haversineDistance(lat, lng, stops[i].lat, stops[i].lng);
    if (d < minDist) {
      minDist = d;
      nearest = i;
    }
  }
  return nearest;
}

export function jsonResponse(data, status = 200, cacheSeconds = 0) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  };
  // CDNエッジキャッシュ: 指定秒数だけNetlify CDNがレスポンスを保持し、
  // その間の同一リクエストはFunctionを起動せずCDNから直接返す
  if (cacheSeconds > 0) {
    headers['Cache-Control'] = `public, s-maxage=${cacheSeconds}, max-age=${cacheSeconds}`;
    headers['Netlify-CDN-Cache-Control'] = `public, max-age=${cacheSeconds}`;
  }
  return {
    statusCode: status,
    headers,
    body: JSON.stringify(data),
  };
}
