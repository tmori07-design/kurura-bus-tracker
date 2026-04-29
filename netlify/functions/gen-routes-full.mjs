// 一時的: 往復両方のポリラインを再生成（一本木の座標修正を反映）
// 使用後に削除予定

import { jsonResponse } from './shared.mjs';

export const config = { memory: 256 };

// to-wada (飯田駅前→かぐらの湯)
const TO_WADA = [
  // 1: 飯田駅前 → 行者
  { name: "飯田駅前", loc: "35.51904,137.82081" },
  { name: "飯田市役所", loc: "35.51516,137.82223" },
  { name: "中央広場", loc: "35.51539,137.82812" },
  { name: "東中央通り", loc: "35.51231,137.83434" },
  { name: "飯田橋", loc: "35.50848,137.83848" },
  { name: "寺所入口", loc: "35.50522,137.85055" },
  { name: "新井", loc: "35.50336,137.85876" },
  { name: "弁天", loc: "35.50102,137.86141" },
  { name: "北原", loc: "35.49428,137.86589" },
  { name: "楽珍館前", loc: "35.48716,137.88679" },
  { name: "富田辻", loc: "35.48516,137.88603" },
  { name: "第二小学校入口", loc: "35.48415,137.88907" },
  { name: "馬草田", loc: "35.48509,137.89389" },
  { name: "一本木", loc: "35.483234,137.896659" },  // 修正済み座標
  { name: "大和知", loc: "35.48340,137.89968" },
  { name: "久保の下", loc: "35.48555,137.90060" },
  { name: "氏乗", loc: "35.48288,137.90785" },
  { name: "近藤商店前", loc: "35.48157,137.91018" },
  { name: "小沢橋", loc: "35.44018,137.99171" },
  { name: "程野", loc: "35.43849,137.99107" },
  { name: "柄沢前", loc: "35.43564,137.98963" },
  { name: "宮の前", loc: "35.43370,137.98880" },
  { name: "東前", loc: "35.42463,137.98349" },
  { name: "うとどち", loc: "35.42070,137.98064" },
  { name: "行者", loc: "35.41258,137.97602" },
  // 2: 行者 → 学校前
  { name: "上中郷", loc: "35.40924,137.97514" },
  { name: "新島", loc: "35.40771,137.97454" },
  { name: "コミュニティ前", loc: "35.40153,137.97258" },
  { name: "下中郷", loc: "35.39902,137.97133" },
  { name: "黒川前", loc: "35.39533,137.96908" },
  { name: "万場", loc: "35.38760,137.97020" },
  { name: "上町", loc: "35.38415,137.96847" },
  { name: "学校前", loc: "35.38204,137.96793" },
  // 3: 学校前 → かぐらの湯 (国道152号沿い)
  { name: "152号_診療所前付近", loc: "35.38081,137.96746" },
  { name: "152号_中村入口付近", loc: "35.37068,137.96429" },
  { name: "152号_八名瀬付近", loc: "35.35679,137.95838" },
  { name: "152号_本谷口付近", loc: "35.34562,137.95237" },
  { name: "152号_木沢付近", loc: "35.34005,137.95322" },
  { name: "152号_大島付近", loc: "35.32552,137.94769" },
  { name: "和田", loc: "35.32274,137.93444" },
  { name: "地域交流センター", loc: "35.32283,137.93200" },
  { name: "郵便局前", loc: "35.32109,137.92969" },
  { name: "かぐらの湯", loc: "35.32109,137.92969" },
];

// to-iida (かぐらの湯→飯田駅前)
const TO_IIDA = [
  // 1: かぐらの湯 → 行者
  { name: "かぐらの湯", loc: "35.32109,137.92969" },
  { name: "郵便局前", loc: "35.32109,137.92969" },
  { name: "地域交流センター", loc: "35.32283,137.93200" },
  { name: "和田", loc: "35.32274,137.93444" },
  { name: "152号_大島付近", loc: "35.32552,137.94769" },
  { name: "152号_木沢付近", loc: "35.34005,137.95322" },
  { name: "152号_本谷口付近", loc: "35.34562,137.95237" },
  { name: "152号_八名瀬付近", loc: "35.35679,137.95838" },
  { name: "152号_中村入口付近", loc: "35.37068,137.96429" },
  { name: "152号_診療所前付近", loc: "35.38081,137.96746" },
  { name: "学校前", loc: "35.38204,137.96793" },
  { name: "上町", loc: "35.38415,137.96847" },
  { name: "万場", loc: "35.38760,137.97020" },
  { name: "黒川前", loc: "35.39533,137.96908" },
  { name: "下中郷", loc: "35.39902,137.97133" },
  { name: "コミュニティ前", loc: "35.40153,137.97258" },
  { name: "新島", loc: "35.40771,137.97454" },
  { name: "上中郷", loc: "35.40924,137.97514" },
  { name: "行者", loc: "35.41258,137.97602" },
  // 2: 行者 → 中央広場
  { name: "うとどち", loc: "35.42070,137.98064" },
  { name: "東前", loc: "35.42463,137.98349" },
  { name: "宮の前", loc: "35.43370,137.98880" },
  { name: "柄沢前", loc: "35.43564,137.98963" },
  { name: "程野", loc: "35.43849,137.99107" },
  { name: "小沢橋", loc: "35.44018,137.99171" },
  { name: "近藤商店前", loc: "35.48157,137.91018" },
  { name: "氏乗", loc: "35.48288,137.90785" },
  { name: "久保の下", loc: "35.48555,137.90060" },
  { name: "大和知", loc: "35.48340,137.89968" },
  { name: "一本木", loc: "35.483234,137.896659" },  // 修正済み座標
  { name: "馬草田", loc: "35.48509,137.89389" },
  { name: "第二小学校入口", loc: "35.48415,137.88907" },
  { name: "富田辻", loc: "35.48516,137.88603" },
  { name: "楽珍館前", loc: "35.48716,137.88679" },
  { name: "北原", loc: "35.49428,137.86589" },
  { name: "弁天", loc: "35.50102,137.86141" },
  { name: "新井", loc: "35.50336,137.85876" },
  { name: "寺所入口", loc: "35.50522,137.85055" },
  { name: "飯田橋", loc: "35.50848,137.83848" },
  { name: "東中央通り", loc: "35.51231,137.83434" },
  { name: "中央広場", loc: "35.51539,137.82812" },
  // 3: 中央広場 → 飯田駅前 (信号交差点を経由)
  { name: "中央交差点信号", loc: "中央交差点 飯田市" },
  { name: "銀座4,5丁目信号", loc: "銀座 飯田市" },
  { name: "知久町１丁目", loc: "35.51414,137.82529" },
  { name: "知久町３丁目", loc: "35.51543,137.82274" },
  { name: "飯田病院前", loc: "35.51738,137.81917" },
  { name: "元町交差点", loc: "元町交差点 飯田市" },
  { name: "飯田駅南交差点", loc: "飯田駅南交差点 飯田市" },
  { name: "飯田駅前", loc: "35.51904,137.82081" },
];

const SEGMENT_BREAKS = {
  'to-wada': ["行者", "学校前"],
  'to-iida': ["行者", "中央広場"],
};

async function fetchSegment(apiKey, points) {
  const origin = points[0];
  const destination = points[points.length - 1];
  const waypoints = points.slice(1, -1);

  const wp = waypoints.map(p => encodeURIComponent(p.loc)).join('|');
  let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin.loc)}&destination=${encodeURIComponent(destination.loc)}&key=${apiKey}`;
  if (wp) url += `&waypoints=${wp}`;

  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 'OK' || !data.routes?.length) {
    return { error: data.status, message: data.error_message };
  }
  return {
    polyline: data.routes[0].overview_polyline.points,
    distance_m: data.routes[0].legs.reduce((s, l) => s + l.distance.value, 0),
  };
}

function splitIntoSegments(points, breakNames) {
  const segments = [];
  let current = [];
  for (const p of points) {
    current.push(p);
    if (breakNames.includes(p.name)) {
      segments.push(current);
      current = [p];
    }
  }
  if (current.length > 1) segments.push(current);
  return segments;
}

export const handler = async () => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return jsonResponse({ error: 'GOOGLE_MAPS_API_KEY not set' }, 500);

  const result = { polylines: {}, details: {} };

  for (const [direction, points] of Object.entries({ 'to-wada': TO_WADA, 'to-iida': TO_IIDA })) {
    const segments = splitIntoSegments(points, SEGMENT_BREAKS[direction]);
    const polylines = [];
    const details = [];
    for (const seg of segments) {
      const r = await fetchSegment(apiKey, seg);
      polylines.push(r.polyline || null);
      details.push({
        from: seg[0].name,
        to: seg[seg.length - 1].name,
        waypointCount: seg.length - 2,
        distance_m: r.distance_m,
        error: r.error,
      });
    }
    result.polylines[direction] = polylines;
    result.details[direction] = details;
  }

  return jsonResponse(result);
};
