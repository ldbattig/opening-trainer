import type { LichessOpeningResponse } from "../types";
import { moveListToCoordinateNotation } from "./boardUtils";
import { fetchJson } from "./httpUtils";

// API cache
const apiCache: Record<string, LichessOpeningResponse> = {};

// API request queue to ensure sequential calls
let apiRequestQueue: Promise<unknown> = Promise.resolve();

/**
 * Queue an API request to ensure sequential execution
 */
function queueApiRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  const request = apiRequestQueue.then(requestFn);
  apiRequestQueue = request.catch(() => {}); // Prevent queue from breaking on errors
  return request;
}

/**
 * Fetch opening data from Lichess API and cache it
 * @param moveList - array of {from, to} moves
 * @param moves - number of variations to return
 * @returns LichessOpeningResponse
 */
export async function fetchOpeningData(moveList: { from: string; to: string }[], moves: number = 10): Promise<LichessOpeningResponse> {
  const coordMoves = moveListToCoordinateNotation(moveList);
  const playParam = coordMoves.join(',');
  const cacheKey = `${playParam}|${moves}`;
  if (apiCache[cacheKey]) {
    return apiCache[cacheKey];
  }
  const url = `https://explorer.lichess.ovh/masters?play=${playParam}&moves=${moves}&topGames=0`;
  const data = await fetchJson<LichessOpeningResponse>(url);
  apiCache[cacheKey] = data;
  return data;
}

/**
 * Fetch opening data with 429 error handling (rate limiting)
 * @param moveList - array of {from, to} moves
 * @param moves - number of variations to return
 * @returns LichessOpeningResponse or null if rate limited
 */
export async function fetchOpeningDataWith429(moveList: { from: string; to: string }[], moves: number = 10): Promise<LichessOpeningResponse | null> {
  try {
    return await fetchOpeningData(moveList, moves);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('429')) {
      throw new Error('RATE_LIMITED');
    }
    throw e;
  }
}

/**
 * Queue an API request for opening data
 */
export function queueOpeningDataRequest(moveList: { from: string; to: string }[], moves: number = 10): Promise<LichessOpeningResponse | null> {
  return queueApiRequest(() => fetchOpeningDataWith429(moveList, moves));
} 