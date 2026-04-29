// 一時的なルート生成関数: 飯田病院前→飯田駅前の正確なルートを取得
// 使用後に削除予定
//
// 実際のバスルート: 飯田病院前角の信号を左折 → 元町の信号直進 → 飯田駅南信号左折

import { jsonResponse } from './shared.mjs';

export const config = { memory: 256 };

export const handler = async () => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: 'GOOGLE_MAPS_API_KEY not set' }, 500);
  }

  // 飯田病院前
  const origin = '35.51738,137.81917';
  // 飯田駅前
  const destination = '35.51904,137.82081';
  // 中継: 元町交差点と飯田駅南交差点
  const waypoints = ['元町交差点 飯田市', '飯田駅南交差点 飯田市'];

  const wp = waypoints.map(encodeURIComponent).join('|');
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=${wp}&key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' || !data.routes?.length) {
    return jsonResponse({
      error: data.status,
      message: data.error_message,
      raw: data,
    }, 400);
  }

  const route = data.routes[0];
  return jsonResponse({
    polyline: route.overview_polyline.points,
    legs: route.legs.map(l => ({
      start_address: l.start_address,
      end_address: l.end_address,
      distance: l.distance.text,
      duration: l.duration.text,
      start_location: l.start_location,
      end_location: l.end_location,
    })),
    waypoint_order: route.waypoint_order,
  });
};
