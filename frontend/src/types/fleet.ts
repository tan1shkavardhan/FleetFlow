export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting';

export interface Vehicle {
  vehicle_id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  /** Browser time (ms) when the latest update was received. */
  lastUpdate: number;
}

export interface Geofence {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius_m: number;
  is_active: boolean;
}

export type GeofenceEventType = 'ENTER' | 'EXIT';

export interface GeofenceAlert {
  kind: 'geofence';
  id: string;
  event: GeofenceEventType;
  vehicle_id: string;
  geofence_id: number;
  geofence_name: string;
  distance_m: number | null;
  receivedAt: number;
}

/**
 * Union of every alert the UI can show. When the backend starts sending delay
 * events, add a `DelayAlert` (kind: 'delay') here, parse it in the WebSocket
 * hook, and add a case to `describeAlert` in AlertsPanel.tsx.
 */
export type FleetAlert = GeofenceAlert;

export interface HistoryPoint {
  latitude: number;
  longitude: number;
  speed: number | null;
  timestamp: string;
}

export interface NearbyVehicle {
  vehicle_id: string;
  distance_km: number;
}

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

export interface FocusTarget {
  lat: number;
  lng: number;
  key: number;
}
