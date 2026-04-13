// 共通データ・ユーティリティ

// 遠山郷線（E1）飯田駅前→和田 方面の全停留所
// 座標は信南交通公式サイトのマップデータから取得
// dwellTime: 30 = 乗降が多い停留所、0 = 通過が多い停留所
export const BUS_STOPS = [
  // --- 飯田市中心部 ---
  { name: "飯田駅前", lat: 35.51904, lng: 137.82081, order: 0, dwellTime: 0 },
  { name: "中央通り３丁目", lat: 35.51750, lng: 137.82422, order: 1, dwellTime: 0 },
  { name: "飯田市役所", lat: 35.51516, lng: 137.82223, order: 2, dwellTime: 0 },
  { name: "中央広場", lat: 35.51539, lng: 137.82812, order: 3, dwellTime: 0 },
  { name: "東中央通り", lat: 35.51231, lng: 137.83434, order: 4, dwellTime: 0 },
  { name: "飯田橋", lat: 35.50848, lng: 137.83848, order: 5, dwellTime: 0 },
  { name: "城下", lat: 35.50971, lng: 137.83500, order: 6, dwellTime: 0 },
  // --- 鼎エリア ---
  { name: "下山東", lat: 35.50718, lng: 137.83403, order: 7, dwellTime: 0 },
  { name: "鼎駅前", lat: 35.50683, lng: 137.82810, order: 8, dwellTime: 0 },
  { name: "鼎公民館前", lat: 35.50531, lng: 137.82651, order: 9, dwellTime: 0 },
  { name: "下農入口", lat: 35.50222, lng: 137.82791, order: 10, dwellTime: 0 },
  { name: "OIDE長姫高校前", lat: 35.50247, lng: 137.83172, order: 11, dwellTime: 0 },
  // --- 市立病院エリア ---
  { name: "常盤台", lat: 35.50195, lng: 137.83737, order: 12, dwellTime: 0 },
  { name: "常盤台東", lat: 35.50089, lng: 137.83862, order: 13, dwellTime: 0 },
  { name: "市立病院", lat: 35.49954, lng: 137.83515, order: 14, dwellTime: 0 },
  { name: "永代橋南", lat: 35.50548, lng: 137.84393, order: 15, dwellTime: 0 },
  // --- 喬木エリア ---
  { name: "寺所入口", lat: 35.50522, lng: 137.85055, order: 16, dwellTime: 0 },
  { name: "新井", lat: 35.50336, lng: 137.85876, order: 17, dwellTime: 30 },
  { name: "弁天", lat: 35.50102, lng: 137.86141, order: 18, dwellTime: 0 },
  { name: "北原", lat: 35.49428, lng: 137.86589, order: 19, dwellTime: 0 },
  { name: "楽珍館前", lat: 35.48716, lng: 137.88679, order: 20, dwellTime: 30 },
  { name: "富田辻", lat: 35.48516, lng: 137.88603, order: 21, dwellTime: 0 },
  { name: "第二小学校入口", lat: 35.48415, lng: 137.88907, order: 22, dwellTime: 0 },
  { name: "馬草田", lat: 35.48509, lng: 137.89389, order: 23, dwellTime: 0 },
  { name: "一本木", lat: 35.48420, lng: 137.89680, order: 24, dwellTime: 0 },
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
  { name: "診療所前", lat: 35.38081, lng: 137.96746, order: 44, dwellTime: 0 },
  { name: "住宅前", lat: 35.37667, lng: 137.96565, order: 45, dwellTime: 0 },
  { name: "赤沢", lat: 35.37414, lng: 137.96463, order: 46, dwellTime: 0 },
  { name: "中村入口", lat: 35.37068, lng: 137.96429, order: 47, dwellTime: 0 },
  // --- 遠山南部 ---
  { name: "八日市場", lat: 35.36688, lng: 137.96062, order: 48, dwellTime: 0 },
  { name: "八名瀬", lat: 35.35679, lng: 137.95838, order: 49, dwellTime: 0 },
  { name: "上島", lat: 35.35381, lng: 137.95712, order: 50, dwellTime: 0 },
  { name: "上沢", lat: 35.35027, lng: 137.95585, order: 51, dwellTime: 0 },
  { name: "本谷口", lat: 35.34562, lng: 137.95237, order: 52, dwellTime: 0 },
  { name: "木沢", lat: 35.34005, lng: 137.95322, order: 53, dwellTime: 0 },
  { name: "川合前", lat: 35.33975, lng: 137.95083, order: 54, dwellTime: 0 },
  { name: "小道木", lat: 35.33579, lng: 137.95303, order: 55, dwellTime: 0 },
  { name: "畑上", lat: 35.33176, lng: 137.95437, order: 56, dwellTime: 0 },
  { name: "日影沢", lat: 35.32980, lng: 137.95251, order: 57, dwellTime: 0 },
  { name: "観音前", lat: 35.32872, lng: 137.95139, order: 58, dwellTime: 0 },
  { name: "大島", lat: 35.32552, lng: 137.94769, order: 59, dwellTime: 0 },
  { name: "酒屋前", lat: 35.32636, lng: 137.94003, order: 60, dwellTime: 0 },
  { name: "押出", lat: 35.32636, lng: 137.93769, order: 61, dwellTime: 0 },
  { name: "中学校前", lat: 35.32481, lng: 137.93629, order: 62, dwellTime: 0 },
  { name: "上新町", lat: 35.32324, lng: 137.93551, order: 63, dwellTime: 0 },
  { name: "丸五商店前", lat: 35.32113, lng: 137.93462, order: 64, dwellTime: 0 },
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
