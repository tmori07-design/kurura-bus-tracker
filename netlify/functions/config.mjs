import { jsonResponse } from './shared.mjs';

export const handler = async () => {
  return jsonResponse({
    hasGoogleMapsKey: false,
    routingSource: 'osrm',
  });
};
