import { useEffect, useState } from 'react';
import { MAX_ALERTS } from '../config';
import type { ConnectionStatus, FleetAlert, Vehicle } from '../types/fleet';

type ParsedMessage =
  | { kind: 'location'; vehicle: Omit<Vehicle, 'lastUpdate'> }
  | { kind: 'alert'; alert: Omit<FleetAlert, 'id' | 'receivedAt'> };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Distinguishes geofence events from location messages; returns null for anything invalid. */
function parseMessage(raw: unknown): ParsedMessage | null {
  if (typeof raw !== 'string') return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(data)) return null;

  if (data.type === 'geofence_alert') {
    if (
      (data.event !== 'ENTER' && data.event !== 'EXIT') ||
      typeof data.vehicle_id !== 'string' ||
      !data.vehicle_id ||
      !isNum(data.geofence_id)
    ) {
      return null;
    }
    return {
      kind: 'alert',
      alert: {
        kind: 'geofence',
        event: data.event,
        vehicle_id: data.vehicle_id,
        geofence_id: data.geofence_id,
        geofence_name: typeof data.geofence_name === 'string' ? data.geofence_name : `Geofence ${data.geofence_id}`,
        distance_m: isNum(data.distance_m) ? data.distance_m : null,
      },
    };
  }

  // Other typed messages (e.g. future delay events) are not location updates.
  if (data.type !== undefined) return null;

  if (typeof data.vehicle_id === 'string' && data.vehicle_id && isNum(data.latitude) && isNum(data.longitude)) {
    return {
      kind: 'location',
      vehicle: {
        vehicle_id: data.vehicle_id,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: isNum(data.speed) ? data.speed : null,
      },
    };
  }
  return null;
}

const FLUSH_INTERVAL_MS = 250;

export function useVehicleWebSocket(url: string) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [vehicles, setVehicles] = useState<Record<string, Vehicle>>({});
  const [alerts, setAlerts] = useState<FleetAlert[]>([]);
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null);

  useEffect(() => {
    let disposed = false;
    let socket: WebSocket | null = null;
    let retryTimer: number | undefined;
    let attempt = 0;
    let alertSeq = 0;
    let lastSeen: number | null = null;
    // Updates arrive ~100/s with 100 vehicles; batch them into one render per flush.
    const pending = new Map<string, Vehicle>();

    const flush = () => {
      if (pending.size > 0) {
        const batch = Array.from(pending.values());
        pending.clear();
        setVehicles((prev) => {
          const next = { ...prev };
          for (const v of batch) next[v.vehicle_id] = v;
          return next;
        });
      }
      if (lastSeen !== null) setLastMessageAt(lastSeen);
    };
    const flushTimer = window.setInterval(flush, FLUSH_INTERVAL_MS);

    const handleMessage = (raw: unknown) => {
      const parsed = parseMessage(raw);
      if (!parsed) {
        console.warn('Ignored malformed or unsupported WebSocket message', raw);
        return;
      }
      const receivedAt = Date.now();
      lastSeen = receivedAt;
      if (parsed.kind === 'location') {
        pending.set(parsed.vehicle.vehicle_id, { ...parsed.vehicle, lastUpdate: receivedAt });
      } else {
        const alert: FleetAlert = { ...parsed.alert, id: `${receivedAt}-${alertSeq++}`, receivedAt };
        setAlerts((prev) => [alert, ...prev].slice(0, MAX_ALERTS));
      }
    };

    const scheduleRetry = () => {
      if (disposed) return;
      setStatus('reconnecting');
      const delay = Math.min(1000 * 2 ** attempt, 10_000);
      attempt += 1;
      retryTimer = window.setTimeout(connect, delay);
    };

    function connect() {
      if (disposed) return;
      setStatus(attempt === 0 ? 'connecting' : 'reconnecting');
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch (e) {
        console.error('Invalid WebSocket URL', e);
        scheduleRetry();
        return;
      }
      socket = ws;
      ws.onopen = () => {
        attempt = 0;
        setStatus('connected');
      };
      ws.onmessage = (event) => handleMessage(event.data);
      ws.onerror = () => {
        /* onclose always follows; reconnect is handled there */
      };
      ws.onclose = () => {
        if (socket === ws) socket = null;
        scheduleRetry();
      };
    }

    connect();

    return () => {
      disposed = true;
      window.clearInterval(flushTimer);
      window.clearTimeout(retryTimer);
      if (socket) {
        socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
        socket.close();
        socket = null;
      }
    };
  }, [url]);

  return { status, vehicles, alerts, lastMessageAt };
}
