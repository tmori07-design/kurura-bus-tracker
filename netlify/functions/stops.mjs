import { BUS_STOPS, jsonResponse } from './shared.mjs';

export const handler = async () => {
  return jsonResponse(BUS_STOPS);
};
