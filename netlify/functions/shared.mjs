// 共通データ・ユーティリティ

export const BUS_STOPS = [
  { name: "飯田駅前", lat: 35.51475, lng: 137.82098, order: 0 },
  { name: "本町1丁目", lat: 35.51320, lng: 137.82200, order: 1 },
  { name: "本町2丁目", lat: 35.51180, lng: 137.82250, order: 2 },
  { name: "本町3丁目", lat: 35.51050, lng: 137.82310, order: 3 },
  { name: "中央通り3丁目", lat: 35.50920, lng: 137.82380, order: 4 },
  { name: "中央通り2丁目", lat: 35.50780, lng: 137.82450, order: 5 },
  { name: "中央通り1丁目", lat: 35.50640, lng: 137.82520, order: 6 },
  { name: "飯田インター前", lat: 35.50300, lng: 137.82800, order: 7 },
  { name: "座光寺", lat: 35.49500, lng: 137.84200, order: 8 },
  { name: "上郷", lat: 35.48800, lng: 137.85500, order: 9 },
  { name: "天竜峡", lat: 35.45600, lng: 137.86400, order: 10 },
  { name: "川路", lat: 35.44200, lng: 137.86800, order: 11 },
  { name: "時又", lat: 35.43500, lng: 137.87200, order: 12 },
  { name: "駄科", lat: 35.42800, lng: 137.87600, order: 13 },
  { name: "毛賀", lat: 35.42000, lng: 137.88000, order: 14 },
  { name: "鼎", lat: 35.41200, lng: 137.88500, order: 15 },
  { name: "下山", lat: 35.40500, lng: 137.89000, order: 16 },
  { name: "三穂", lat: 35.39500, lng: 137.89500, order: 17 },
  { name: "喬木村役場前", lat: 35.38500, lng: 137.90000, order: 18 },
  { name: "富田", lat: 35.37500, lng: 137.90500, order: 19 },
  { name: "程野", lat: 35.36500, lng: 137.91000, order: 20 },
  { name: "為栗", lat: 35.35500, lng: 137.92000, order: 21 },
  { name: "下平", lat: 35.34500, lng: 137.93000, order: 22 },
  { name: "平岡", lat: 35.33500, lng: 137.94000, order: 23 },
  { name: "遠山口", lat: 35.32500, lng: 137.95000, order: 24 },
  { name: "木沢", lat: 35.31500, lng: 137.96000, order: 25 },
  { name: "和田（遠山郷）", lat: 35.33110, lng: 137.96920, order: 26 },
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

export function jsonResponse(data, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(data),
  };
}
