import { API_BASE_URL } from '../config';
import type { Geofence, HistoryPoint, NearbyVehicle } from '../types/fleet';

export class ApiError extends Error {}

export const isAbortError = (e: unknown) => e instanceof DOMException && e.name === 'AbortError';

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

async function getJson(path: string, signal?: AbortSignal): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { signal, headers: { Accept: 'application/json' } });
  } catch (e) {
    if (isAbortError(e)) throw e;
    throw new ApiError(`Cannot reach the backend at ${API_BASE_URL}. Check that it is running and CORS allows this origin.`);
  }
  if (!res.ok) {
    throw new ApiError(`The backend responded with ${res.status}${res.statusText ? ` ${res.statusText}` : ''}.`);
  }
  try {
    return await res.json();
  } catch {
    throw new ApiError('The backend returned a response that is not valid JSON.');
  }
}

export async function getGeofences(signal?: AbortSignal): Promise<Geofence[]> {
  const data = await getJson('/geofences/', signal);
  if (!isRecord(data) || !Array.isArray(data.geofences)) {
    throw new ApiError('Unexpected geofence response shape.');
  }
  return data.geofences.flatMap((g): Geofence[] => {
    if (!isRecord(g) || !isNum(g.id) || !isNum(g.latitude) || !isNum(g.longitude) || !isNum(g.radius_m)) return [];
    return [
      {
        id: g.id,
        name: typeof g.name === 'string' ? g.name : `Geofence ${g.id}`,
        latitude: g.latitude,
        longitude: g.longitude,
        radius_m: g.radius_m,
        is_active: g.is_active !== false,
      },
    ];
  });
}

export async function getHistory(vehicleId: string, limit: number, signal?: AbortSignal): Promise<HistoryPoint[]> {
  const data = await getJson(`/vehicles/${encodeURIComponent(vehicleId)}/history?limit=${limit}`, signal);
  if (!isRecord(data) || !Array.isArray(data.history)) {
    throw new ApiError('Unexpected history response shape.');
  }
  const points = data.history.flatMap((p, index): { point: HistoryPoint; index: number }[] => {
    if (!isRecord(p) || !isNum(p.latitude) || !isNum(p.longitude)) return [];
    return [
      {
        index,
        point: {
          latitude: p.latitude,
          longitude: p.longitude,
          speed: isNum(p.speed) ? p.speed : null,
          timestamp: typeof p.timestamp === 'string' ? p.timestamp : String(p.timestamp ?? ''),
        },
      },
    ];
  });
  // Chronological order; fall back to response order when a timestamp is unparsable.
  points.sort((a, b) => {
    const ta = Date.parse(a.point.timestamp);
    const tb = Date.parse(b.point.timestamp);
    return Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb ? ta - tb : a.index - b.index;
  });
  return points.map((p) => p.point);
}

export async function getNearby(
  latitude: number,
  longitude: number,
  radiusKm: number,
  excludeVehicleId: string,
  signal?: AbortSignal,
): Promise<NearbyVehicle[]> {
  const qs = new URLSearchParams({
    longitude: String(longitude),
    latitude: String(latitude),
    radius_km: String(radiusKm),
  });
  const data = await getJson(`/vehicles/nearby?${qs.toString()}`, signal);
  if (!isRecord(data) || !Array.isArray(data.vehicles)) {
    throw new ApiError('Unexpected nearby-vehicles response shape.');
  }
  return data.vehicles
    .flatMap((v): NearbyVehicle[] =>
      isRecord(v) && typeof v.vehicle_id === 'string' && isNum(v.distance_km)
        ? [{ vehicle_id: v.vehicle_id, distance_km: v.distance_km }]
        : [],
    )
    .filter((v) => v.vehicle_id !== excludeVehicleId)
    .sort((a, b) => a.distance_km - b.distance_km);
}
