// 共通データ・ユーティリティ

// 遠山郷線（E1）飯田駅前→和田 方面の全停留所
// 座標はジオコーディング＋ルート沿い補間による推定値
// dwellTime: 30 = 乗降が多い停留所、0 = 通過が多い停留所
export const BUS_STOPS = [
  // --- 飯田市中心部 ---
  { name: "飯田駅前", lat: 35.51957, lng: 137.82124, order: 0, dwellTime: 0 },
  { name: "中央通り３丁目", lat: 35.51794, lng: 137.82406, order: 1, dwellTime: 0 },
  { name: "飯田市役所", lat: 35.51550, lng: 137.82140, order: 2, dwellTime: 0 },
  { name: "中央広場", lat: 35.51450, lng: 137.82250, order: 3, dwellTime: 0 },
  { name: "東中央通り", lat: 35.51350, lng: 137.82350, order: 4, dwellTime: 0 },
  { name: "飯田橋", lat: 35.51200, lng: 137.82500, order: 5, dwellTime: 0 },
  { name: "城下", lat: 35.51000, lng: 137.82650, order: 6, dwellTime: 0 },
  // --- 鼎エリア ---
  { name: "下山東", lat: 35.50800, lng: 137.82800, order: 7, dwellTime: 0 },
  { name: "鼎駅前", lat: 35.50670, lng: 137.82797, order: 8, dwellTime: 0 },
  { name: "鼎公民館前", lat: 35.50521, lng: 137.82695, order: 9, dwellTime: 0 },
  { name: "下農入口", lat: 35.50350, lng: 137.82900, order: 10, dwellTime: 0 },
  { name: "OIDE長姫高校前", lat: 35.50200, lng: 137.83100, order: 11, dwellTime: 0 },
  // --- 市立病院エリア ---
  { name: "常盤台", lat: 35.50050, lng: 137.83300, order: 12, dwellTime: 0 },
  { name: "常盤台東", lat: 35.49950, lng: 137.83500, order: 13, dwellTime: 0 },
  { name: "市立病院", lat: 35.49931, lng: 137.83610, order: 14, dwellTime: 0 },
  { name: "永代橋南", lat: 35.49700, lng: 137.84000, order: 15, dwellTime: 0 },
  // --- 喬木エリア ---
  { name: "寺所入口", lat: 35.49300, lng: 137.85000, order: 16, dwellTime: 0 },
  { name: "新井", lat: 35.49000, lng: 137.85600, order: 17, dwellTime: 30 },
  { name: "弁天", lat: 35.48700, lng: 137.86200, order: 18, dwellTime: 0 },
  { name: "北原", lat: 35.48400, lng: 137.87000, order: 19, dwellTime: 0 },
  { name: "楽珍館前", lat: 35.48100, lng: 137.87800, order: 20, dwellTime: 30 },
  { name: "富田辻", lat: 35.47894, lng: 137.92479, order: 21, dwellTime: 0 },
  { name: "第二小学校入口", lat: 35.47850, lng: 137.89200, order: 22, dwellTime: 0 },
  { name: "馬草田", lat: 35.47800, lng: 137.89500, order: 23, dwellTime: 0 },
  { name: "一本木", lat: 35.47850, lng: 137.89800, order: 24, dwellTime: 0 },
  { name: "大和知", lat: 35.47800, lng: 137.90100, order: 25, dwellTime: 0 },
  { name: "久保の下", lat: 35.47850, lng: 137.90400, order: 26, dwellTime: 0 },
  { name: "氏乗", lat: 35.47795, lng: 137.89059, order: 27, dwellTime: 0 },
  { name: "近藤商店前", lat: 35.47600, lng: 137.91000, order: 28, dwellTime: 0 },
  // --- 遠山入口（山間部）---
  { name: "小沢橋", lat: 35.44500, lng: 137.94500, order: 29, dwellTime: 0 },
  { name: "程野", lat: 35.44200, lng: 137.94800, order: 30, dwellTime: 0 },
  { name: "柄沢前", lat: 35.43900, lng: 137.95000, order: 31, dwellTime: 0 },
  { name: "宮の前", lat: 35.43600, lng: 137.95200, order: 32, dwellTime: 0 },
  { name: "東前", lat: 35.43300, lng: 137.95400, order: 33, dwellTime: 0 },
  { name: "うとどち", lat: 35.43000, lng: 137.95600, order: 34, dwellTime: 0 },
  { name: "行者", lat: 35.42700, lng: 137.95800, order: 35, dwellTime: 0 },
  { name: "上中郷", lat: 35.42400, lng: 137.96000, order: 36, dwellTime: 0 },
  { name: "新島", lat: 35.42100, lng: 137.96100, order: 37, dwellTime: 0 },
  { name: "コミュニティ前", lat: 35.41800, lng: 137.96200, order: 38, dwellTime: 0 },
  { name: "下中郷", lat: 35.41500, lng: 137.96300, order: 39, dwellTime: 0 },
  { name: "黒川前", lat: 35.41200, lng: 137.96400, order: 40, dwellTime: 0 },
  { name: "万場", lat: 35.40900, lng: 137.96500, order: 41, dwellTime: 0 },
  { name: "上町", lat: 35.40600, lng: 137.96600, order: 42, dwellTime: 0 },
  { name: "学校前", lat: 35.40300, lng: 137.96600, order: 43, dwellTime: 30 },
  { name: "診療所前", lat: 35.40000, lng: 137.96650, order: 44, dwellTime: 0 },
  { name: "住宅前", lat: 35.39700, lng: 137.96700, order: 45, dwellTime: 0 },
  { name: "赤沢", lat: 35.39400, lng: 137.96750, order: 46, dwellTime: 0 },
  { name: "中村入口", lat: 35.39100, lng: 137.96800, order: 47, dwellTime: 0 },
  // --- 遠山南部 ---
  { name: "八日市場", lat: 35.37167, lng: 137.96603, order: 48, dwellTime: 0 },
  { name: "八名瀬", lat: 35.38500, lng: 137.96850, order: 49, dwellTime: 0 },
  { name: "上島", lat: 35.38200, lng: 137.96900, order: 50, dwellTime: 0 },
  { name: "上沢", lat: 35.37900, lng: 137.96900, order: 51, dwellTime: 0 },
  { name: "本谷口", lat: 35.37600, lng: 137.96850, order: 52, dwellTime: 0 },
  { name: "木沢", lat: 35.37300, lng: 137.96800, order: 53, dwellTime: 0 },
  { name: "川合前", lat: 35.37000, lng: 137.96750, order: 54, dwellTime: 0 },
  { name: "小道木", lat: 35.36700, lng: 137.96700, order: 55, dwellTime: 0 },
  { name: "畑上", lat: 35.36400, lng: 137.96650, order: 56, dwellTime: 0 },
  { name: "日影沢", lat: 35.36100, lng: 137.96600, order: 57, dwellTime: 0 },
  { name: "観音前", lat: 35.35800, lng: 137.96550, order: 58, dwellTime: 0 },
  { name: "大島", lat: 35.35500, lng: 137.96500, order: 59, dwellTime: 0 },
  { name: "酒屋前", lat: 35.35200, lng: 137.96500, order: 60, dwellTime: 0 },
  { name: "押出", lat: 35.34900, lng: 137.96500, order: 61, dwellTime: 0 },
  { name: "中学校前", lat: 35.34600, lng: 137.96550, order: 62, dwellTime: 0 },
  { name: "上新町", lat: 35.34300, lng: 137.96600, order: 63, dwellTime: 0 },
  { name: "丸五商店前", lat: 35.34000, lng: 137.96600, order: 64, dwellTime: 0 },
  // --- 和田周辺 ---
  { name: "和田", lat: 35.33036, lng: 137.96636, order: 65, dwellTime: 0 },
  { name: "地域交流センター", lat: 35.32800, lng: 137.96200, order: 66, dwellTime: 0 },
  { name: "郵便局前", lat: 35.32500, lng: 137.95500, order: 67, dwellTime: 0 },
  { name: "かぐらの湯", lat: 35.32180, lng: 137.93097, order: 68, dwellTime: 0 },
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
