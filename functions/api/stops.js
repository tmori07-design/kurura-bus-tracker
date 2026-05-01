// /api/stops - バス停一覧を返す (Cloudflare Pages Functions)

import { BUS_STOPS, jsonResponse } from '../_shared/shared.js';

export async function onRequestGet() {
  return jsonResponse(BUS_STOPS, 200, 3600); // 1時間キャッシュ (静的データ)
}
