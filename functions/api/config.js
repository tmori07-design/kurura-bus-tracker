// /api/config - 設定情報を返す (Cloudflare Pages Functions)

import { jsonResponse } from '../_shared/shared.js';

export async function onRequestGet({ env }) {
  const hasKey = !!env.GOOGLE_MAPS_API_KEY;
  return jsonResponse({
    hasGoogleMapsKey: hasKey,
    routingSource: hasKey ? 'google' : 'osrm',
  });
}
