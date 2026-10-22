export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/+$/, '');
export const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://127.0.0.1:8000/ws/vehicles';

/** A vehicle with no update for this long is shown as stale (not "delayed"). */
export const STALE_AFTER_MS = 15_000;
export const HISTORY_LIMIT = 100;
export const NEARBY_RADIUS_KM = 5;
export const MAX_ALERTS = 100;

/** Initial view only; the map re-centres on the selected vehicle. */
export const DEFAULT_MAP_CENTER: [number, number] = [22.7196, 75.8577];
export const DEFAULT_MAP_ZOOM = 12;

export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';
