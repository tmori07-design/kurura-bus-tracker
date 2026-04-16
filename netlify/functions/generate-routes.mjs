// 一時的な関数: 往路・復路のルートポリラインをGoogle Directions APIで1回だけ生成する
// 結果を public/routes.json に保存したら、この関数は削除する
import { BUS_STOPS } from './shared.mjs';

export const config = { memory: 128 };

const skippedToWada = ['地域交流センター', '郵便局前', 'かぐらの湯'];
const skippedToIida = [
  '丸五商店前', '上新町', '中学校前', '押出', '酒屋前',
  '大島', '観音前', '日影沢', '畑上', '小道木',
];
const iidaOnlyNames = ['知久町１丁目', '知久町３丁目', '飯田病院前'];

function getOrderedStops(direction) {
  if (direction === 'to-wada') {
    return BUS_STOPS
      .filter(s => s.order <= 68 && !iidaOnlyNames.includes(s.name) && !skippedToWada.includes(s.name))
      .sort((a, b) => a.order - b.order);
  } else {
    const wadaOnlyNames = ['飯田市役所'];
    const commonStops = BUS_STOPS
      .filter(s => s.order <= 68 && !wadaOnlyNames.includes(s.name) && !skippedToIida.includes(s.name))
      .sort((a, b) => b.order - a.order);

    const orderedStops = [];
    for (const s of commonStops) {
      orderedStops.push(s);
      if (s.name === '中央広場') {
        for (const name of iidaOnlyNames) {
          const stop = BUS_STOPS.find(st => st.name === name);
          if (stop) orderedStops.push(stop);
        }
      }
    }
    return orderedStops;
  }
}

async function fetchRoute(stops) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const origin = stops[0];
  const dest = stops[stops.length - 1];

  let mid = stops.slice(1, -1);
  if (mid.length > 23) {
    const step = mid.length / 23;
    mid = Array.from({ length: 23 }, (_, i) => mid[Math.floor(i * step)]);
  }

  const wp = mid.map(s => `${s.lat},${s.lng}`).join('|');
  const url = `https://maps.googleapis.com/maps/api/directions/json`
    + `?origin=${origin.lat},${origin.lng}`
    + `&destination=${dest.lat},${dest.lng}`
    + `&waypoints=${encodeURIComponent(wp)}`
    + `&key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' || !data.routes?.length) {
    return { error: data.status, errorMessage: data.error_message || '' };
  }
  return { polyline: data.routes[0].overview_polyline.points };
}

export const handler = async () => {
  const toWadaStops = getOrderedStops('to-wada');
  const toIidaStops = getOrderedStops('to-iida');

  const toWada = await fetchRoute(toWadaStops);
  const toIida = await fetchRoute(toIidaStops);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      'to-wada': toWada,
      'to-iida': toIida,
      stopsUsed: {
        'to-wada': toWadaStops.map(s => s.name),
        'to-iida': toIidaStops.map(s => s.name),
      },
    }, null, 2),
  };
};
