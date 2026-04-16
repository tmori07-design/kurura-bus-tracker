import { jsonResponse } from './shared.mjs';

// メモリ削減: デフォルト1024MB→128MB（Compute GB-Hrs を1/8に削減）
export const config = { memory: 128 };

export const handler = async () => {
  const hasKey = !!process.env.GOOGLE_MAPS_API_KEY;
  return jsonResponse({
    hasGoogleMapsKey: hasKey,
    routingSource: hasKey ? 'google' : 'osrm',
  });
};
