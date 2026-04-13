import { jsonResponse } from './shared.mjs';

export const handler = async () => {
  const hasKey = !!process.env.GOOGLE_MAPS_API_KEY;
  return jsonResponse({
    hasGoogleMapsKey: hasKey,
    routingSource: hasKey ? 'google' : 'osrm',
  });
};
