// 実走ルート上の経由点シーケンス
// バス停 + 信号交差点 + 国道152号沿いの中継点 を順序通りに並べたもの。
// Google Directions API に渡すことで、Googleの「最適ルート」ではなく
// 実際のバス経路に沿った走行時間（渋滞考慮）を取得する。

import { haversineDistance } from './shared.js';

// to-wada (飯田駅前→かぐらの湯)
const WAYPOINTS_TO_WADA = [
  // 飯田市内
  { name: "飯田駅前", loc: "35.51904,137.82081", lat: 35.51904, lng: 137.82081, isStop: true, dwellTime: 0 },
  { name: "飯田市役所", loc: "35.51516,137.82223", lat: 35.51516, lng: 137.82223, isStop: true, dwellTime: 0 },
  { name: "中央広場", loc: "35.51539,137.82812", lat: 35.51539, lng: 137.82812, isStop: true, dwellTime: 0 },
  { name: "東中央通り", loc: "35.51231,137.83434", lat: 35.51231, lng: 137.83434, isStop: true, dwellTime: 0 },
  { name: "飯田橋", loc: "35.50848,137.83848", lat: 35.50848, lng: 137.83848, isStop: true, dwellTime: 0 },
  { name: "寺所入口", loc: "35.50522,137.85055", lat: 35.50522, lng: 137.85055, isStop: true, dwellTime: 0 },
  // 喬木エリア
  { name: "新井", loc: "35.50336,137.85876", lat: 35.50336, lng: 137.85876, isStop: true, dwellTime: 30 },
  { name: "弁天", loc: "35.50102,137.86141", lat: 35.50102, lng: 137.86141, isStop: true, dwellTime: 0 },
  { name: "北原", loc: "35.49428,137.86589", lat: 35.49428, lng: 137.86589, isStop: true, dwellTime: 0 },
  { name: "楽珍館前", loc: "35.48716,137.88679", lat: 35.48716, lng: 137.88679, isStop: true, dwellTime: 30 },
  { name: "富田辻", loc: "35.48516,137.88603", lat: 35.48516, lng: 137.88603, isStop: true, dwellTime: 0 },
  { name: "第二小学校入口", loc: "35.48415,137.88907", lat: 35.48415, lng: 137.88907, isStop: true, dwellTime: 0 },
  { name: "馬草田", loc: "35.48509,137.89389", lat: 35.48509, lng: 137.89389, isStop: true, dwellTime: 0 },
  { name: "一本木", loc: "35.483234,137.896659", lat: 35.483234, lng: 137.896659, isStop: true, dwellTime: 0 },
  { name: "大和知", loc: "35.48340,137.89968", lat: 35.48340, lng: 137.89968, isStop: true, dwellTime: 0 },
  { name: "久保の下", loc: "35.48555,137.90060", lat: 35.48555, lng: 137.90060, isStop: true, dwellTime: 0 },
  { name: "氏乗", loc: "35.48288,137.90785", lat: 35.48288, lng: 137.90785, isStop: true, dwellTime: 0 },
  { name: "近藤商店前", loc: "35.48157,137.91018", lat: 35.48157, lng: 137.91018, isStop: true, dwellTime: 0 },
  // 山間部
  { name: "小沢橋", loc: "35.44018,137.99171", lat: 35.44018, lng: 137.99171, isStop: true, dwellTime: 0 },
  { name: "程野", loc: "35.43849,137.99107", lat: 35.43849, lng: 137.99107, isStop: true, dwellTime: 0 },
  { name: "柄沢前", loc: "35.43564,137.98963", lat: 35.43564, lng: 137.98963, isStop: true, dwellTime: 0 },
  { name: "宮の前", loc: "35.43370,137.98880", lat: 35.43370, lng: 137.98880, isStop: true, dwellTime: 0 },
  { name: "東前", loc: "35.42463,137.98349", lat: 35.42463, lng: 137.98349, isStop: true, dwellTime: 0 },
  { name: "うとどち", loc: "35.42070,137.98064", lat: 35.42070, lng: 137.98064, isStop: true, dwellTime: 0 },
  { name: "行者", loc: "35.41258,137.97602", lat: 35.41258, lng: 137.97602, isStop: true, dwellTime: 0 },
  { name: "上中郷", loc: "35.40924,137.97514", lat: 35.40924, lng: 137.97514, isStop: true, dwellTime: 0 },
  { name: "新島", loc: "35.40771,137.97454", lat: 35.40771, lng: 137.97454, isStop: true, dwellTime: 0 },
  { name: "コミュニティ前", loc: "35.40153,137.97258", lat: 35.40153, lng: 137.97258, isStop: true, dwellTime: 0 },
  { name: "下中郷", loc: "35.39902,137.97133", lat: 35.39902, lng: 137.97133, isStop: true, dwellTime: 0 },
  { name: "黒川前", loc: "35.39533,137.96908", lat: 35.39533, lng: 137.96908, isStop: true, dwellTime: 0 },
  { name: "万場", loc: "35.38760,137.97020", lat: 35.38760, lng: 137.97020, isStop: true, dwellTime: 0 },
  { name: "上町", loc: "35.38415,137.96847", lat: 35.38415, lng: 137.96847, isStop: true, dwellTime: 0 },
  { name: "学校前", loc: "35.38204,137.96793", lat: 35.38204, lng: 137.96793, isStop: true, dwellTime: 30 },
  // 国道152号沿い (停留所削除区間)
  { name: "152号_診療所前付近", loc: "35.38081,137.96746", lat: 35.38081, lng: 137.96746, isStop: false },
  { name: "152号_中村入口付近", loc: "35.37068,137.96429", lat: 35.37068, lng: 137.96429, isStop: false },
  { name: "152号_八名瀬付近", loc: "35.35679,137.95838", lat: 35.35679, lng: 137.95838, isStop: false },
  { name: "152号_本谷口付近", loc: "35.34562,137.95237", lat: 35.34562, lng: 137.95237, isStop: false },
  { name: "152号_木沢付近", loc: "35.34005,137.95322", lat: 35.34005, lng: 137.95322, isStop: false },
  { name: "152号_大島付近", loc: "35.32552,137.94769", lat: 35.32552, lng: 137.94769, isStop: false },
  { name: "和田", loc: "35.32274,137.93444", lat: 35.32274, lng: 137.93444, isStop: true, dwellTime: 0 },
  { name: "地域交流センター", loc: "35.32283,137.93200", lat: 35.32283, lng: 137.93200, isStop: true, dwellTime: 0 },
  { name: "郵便局前", loc: "35.32109,137.92969", lat: 35.32109, lng: 137.92969, isStop: true, dwellTime: 0 },
  { name: "かぐらの湯", loc: "35.32109,137.92969", lat: 35.32109, lng: 137.92969, isStop: true, dwellTime: 0 },
];

// to-iida (かぐらの湯→飯田駅前)
const WAYPOINTS_TO_IIDA = [
  { name: "かぐらの湯", loc: "35.32109,137.92969", lat: 35.32109, lng: 137.92969, isStop: true, dwellTime: 0 },
  { name: "郵便局前", loc: "35.32109,137.92969", lat: 35.32109, lng: 137.92969, isStop: true, dwellTime: 0 },
  { name: "地域交流センター", loc: "35.32283,137.93200", lat: 35.32283, lng: 137.93200, isStop: true, dwellTime: 0 },
  { name: "和田", loc: "35.32274,137.93444", lat: 35.32274, lng: 137.93444, isStop: true, dwellTime: 0 },
  // 国道152号沿い (停留所削除区間)
  { name: "152号_大島付近", loc: "35.32552,137.94769", lat: 35.32552, lng: 137.94769, isStop: false },
  { name: "152号_木沢付近", loc: "35.34005,137.95322", lat: 35.34005, lng: 137.95322, isStop: false },
  { name: "152号_本谷口付近", loc: "35.34562,137.95237", lat: 35.34562, lng: 137.95237, isStop: false },
  { name: "152号_八名瀬付近", loc: "35.35679,137.95838", lat: 35.35679, lng: 137.95838, isStop: false },
  { name: "152号_中村入口付近", loc: "35.37068,137.96429", lat: 35.37068, lng: 137.96429, isStop: false },
  { name: "152号_診療所前付近", loc: "35.38081,137.96746", lat: 35.38081, lng: 137.96746, isStop: false },
  { name: "学校前", loc: "35.38204,137.96793", lat: 35.38204, lng: 137.96793, isStop: true, dwellTime: 30 },
  { name: "上町", loc: "35.38415,137.96847", lat: 35.38415, lng: 137.96847, isStop: true, dwellTime: 0 },
  { name: "万場", loc: "35.38760,137.97020", lat: 35.38760, lng: 137.97020, isStop: true, dwellTime: 0 },
  { name: "黒川前", loc: "35.39533,137.96908", lat: 35.39533, lng: 137.96908, isStop: true, dwellTime: 0 },
  { name: "下中郷", loc: "35.39902,137.97133", lat: 35.39902, lng: 137.97133, isStop: true, dwellTime: 0 },
  { name: "コミュニティ前", loc: "35.40153,137.97258", lat: 35.40153, lng: 137.97258, isStop: true, dwellTime: 0 },
  { name: "新島", loc: "35.40771,137.97454", lat: 35.40771, lng: 137.97454, isStop: true, dwellTime: 0 },
  { name: "上中郷", loc: "35.40924,137.97514", lat: 35.40924, lng: 137.97514, isStop: true, dwellTime: 0 },
  { name: "行者", loc: "35.41258,137.97602", lat: 35.41258, lng: 137.97602, isStop: true, dwellTime: 0 },
  { name: "うとどち", loc: "35.42070,137.98064", lat: 35.42070, lng: 137.98064, isStop: true, dwellTime: 0 },
  { name: "東前", loc: "35.42463,137.98349", lat: 35.42463, lng: 137.98349, isStop: true, dwellTime: 0 },
  { name: "宮の前", loc: "35.43370,137.98880", lat: 35.43370, lng: 137.98880, isStop: true, dwellTime: 0 },
  { name: "柄沢前", loc: "35.43564,137.98963", lat: 35.43564, lng: 137.98963, isStop: true, dwellTime: 0 },
  { name: "程野", loc: "35.43849,137.99107", lat: 35.43849, lng: 137.99107, isStop: true, dwellTime: 0 },
  { name: "小沢橋", loc: "35.44018,137.99171", lat: 35.44018, lng: 137.99171, isStop: true, dwellTime: 0 },
  { name: "近藤商店前", loc: "35.48157,137.91018", lat: 35.48157, lng: 137.91018, isStop: true, dwellTime: 0 },
  { name: "氏乗", loc: "35.48288,137.90785", lat: 35.48288, lng: 137.90785, isStop: true, dwellTime: 0 },
  { name: "久保の下", loc: "35.48555,137.90060", lat: 35.48555, lng: 137.90060, isStop: true, dwellTime: 0 },
  { name: "大和知", loc: "35.48340,137.89968", lat: 35.48340, lng: 137.89968, isStop: true, dwellTime: 0 },
  { name: "一本木", loc: "35.483234,137.896659", lat: 35.483234, lng: 137.896659, isStop: true, dwellTime: 0 },
  { name: "馬草田", loc: "35.48509,137.89389", lat: 35.48509, lng: 137.89389, isStop: true, dwellTime: 0 },
  { name: "第二小学校入口", loc: "35.48415,137.88907", lat: 35.48415, lng: 137.88907, isStop: true, dwellTime: 0 },
  { name: "富田辻", loc: "35.48516,137.88603", lat: 35.48516, lng: 137.88603, isStop: true, dwellTime: 0 },
  { name: "楽珍館前", loc: "35.48716,137.88679", lat: 35.48716, lng: 137.88679, isStop: true, dwellTime: 30 },
  { name: "北原", loc: "35.49428,137.86589", lat: 35.49428, lng: 137.86589, isStop: true, dwellTime: 0 },
  { name: "弁天", loc: "35.50102,137.86141", lat: 35.50102, lng: 137.86141, isStop: true, dwellTime: 0 },
  { name: "新井", loc: "35.50336,137.85876", lat: 35.50336, lng: 137.85876, isStop: true, dwellTime: 30 },
  { name: "寺所入口", loc: "35.50522,137.85055", lat: 35.50522, lng: 137.85055, isStop: true, dwellTime: 0 },
  { name: "飯田橋", loc: "35.50848,137.83848", lat: 35.50848, lng: 137.83848, isStop: true, dwellTime: 0 },
  { name: "東中央通り", loc: "35.51231,137.83434", lat: 35.51231, lng: 137.83434, isStop: true, dwellTime: 0 },
  { name: "中央広場", loc: "35.51539,137.82812", lat: 35.51539, lng: 137.82812, isStop: true, dwellTime: 0 },
  // 飯田市内 信号交差点 (実際の経路を強制するため必須)
  { name: "中央交差点信号", loc: "中央交差点 飯田市", isStop: false },
  { name: "銀座4,5丁目信号", loc: "銀座 飯田市", isStop: false },
  { name: "知久町１丁目", loc: "35.51414,137.82529", lat: 35.51414, lng: 137.82529, isStop: true, dwellTime: 30 },
  { name: "知久町３丁目", loc: "35.51543,137.82274", lat: 35.51543, lng: 137.82274, isStop: true, dwellTime: 30 },
  { name: "飯田病院前", loc: "35.51738,137.81917", lat: 35.51738, lng: 137.81917, isStop: true, dwellTime: 0 },
  { name: "元町交差点", loc: "元町交差点 飯田市", isStop: false },
  { name: "飯田駅南交差点", loc: "飯田駅南交差点 飯田市", isStop: false },
  { name: "飯田駅前", loc: "35.51904,137.82081", lat: 35.51904, lng: 137.82081, isStop: true, dwellTime: 0 },
];

const WAYPOINTS = {
  'to-wada': WAYPOINTS_TO_WADA,
  'to-iida': WAYPOINTS_TO_IIDA,
};

// 指定座標に最も近い経由点インデックスを返す（座標を持つ点のみ対象）
function findClosestIdx(lat, lng, sequence) {
  let minDist = Infinity;
  let bestIdx = 0;
  for (let i = 0; i < sequence.length; i++) {
    const p = sequence[i];
    if (p.lat == null || p.lng == null) continue; // 信号交差点等の名前のみは除外
    const d = haversineDistance(lat, lng, p.lat, p.lng);
    if (d < minDist) {
      minDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

// バス位置と目的地の間の経由点を返す（進行方向順）
//
// 返り値: {
//   waypoints: [{ name, loc }, ...],   // origin/destinationを除く中間経由点
//   busPassed: boolean                 // バスが目的地を通過済みか
// } | null
//
// 23点を超える場合は信号交差点を優先的に残しつつバス停をサンプリング
export function getWaypointsForGoogle(direction, busLat, busLng, destLat, destLng) {
  const sequence = WAYPOINTS[direction];
  if (!sequence) return null;

  const busIdx = findClosestIdx(busLat, busLng, sequence);
  const destIdx = findClosestIdx(destLat, destLng, sequence);

  if (destIdx <= busIdx) {
    return { waypoints: [], busPassed: true };
  }

  // バスとデスティネーションの間の経由点（両端は除外）
  let intermediates = sequence.slice(busIdx + 1, destIdx);

  // 23点制限への対応: 信号交差点(isStop=false)は必ず残し、停留所をサンプリング
  if (intermediates.length > 23) {
    const must = intermediates.filter(p => !p.isStop);
    const stops = intermediates.filter(p => p.isStop);
    const remain = 23 - must.length;
    let sampled;
    if (remain <= 0) {
      sampled = must.slice(0, 23);
    } else if (stops.length <= remain) {
      sampled = [...must, ...stops];
    } else {
      const step = stops.length / remain;
      const picked = Array.from({ length: remain }, (_, i) => stops[Math.floor(i * step)]);
      sampled = [...must, ...picked];
    }
    // シーケンス順に並べ直す
    sampled.sort((a, b) => sequence.indexOf(a) - sequence.indexOf(b));
    intermediates = sampled;
  }

  return {
    waypoints: intermediates.map(p => ({ name: p.name, loc: p.loc })),
    busPassed: false,
  };
}

// 進行方向順での「バス → 目的地」間の中間停留所情報を返す
//
// 返り値: {
//   dwellSeconds: number,  // 中間停留所の合計停車時間
//   numStops: number,      // 中間停留所の数
//   busPassed: boolean,    // バスがすでに目的地を通過済みか
// } | null
//
// バグ修正の目的:
//   従来は BUS_STOPS 配列のインデックス順で計算していたが、to-iida 方向では
//   知久町・飯田病院前(配列の最後)が訪問順では最後に来るため、
//   配列スライスでは「全停留所」を巻き込んで停車時間を二重計上していた。
export function getJourneyInfo(direction, busLat, busLng, destLat, destLng) {
  const sequence = WAYPOINTS[direction];
  if (!sequence) return null;

  const busIdx = findClosestIdx(busLat, busLng, sequence);
  const destIdx = findClosestIdx(destLat, destLng, sequence);

  if (destIdx <= busIdx) {
    return { dwellSeconds: 0, numStops: 0, busPassed: true };
  }

  // バスとデスティネーションの間の経由点 (両端は除外)
  const intermediates = sequence.slice(busIdx + 1, destIdx);

  let dwellSeconds = 0;
  let numStops = 0;
  for (const p of intermediates) {
    if (!p.isStop) continue; // 信号交差点や152号中継点は除外
    dwellSeconds += p.dwellTime || 0;
    numStops += 1;
  }

  return { dwellSeconds, numStops, busPassed: false };
}
