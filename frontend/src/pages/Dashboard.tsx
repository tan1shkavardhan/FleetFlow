import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AlertsPanel from '../components/AlertsPanel';
import Header from '../components/Header';
import VehicleDetails from '../components/VehicleDetails';
import VehicleSidebar from '../components/VehicleSidebar';
import { HISTORY_LIMIT, NEARBY_RADIUS_KM, WS_URL } from '../config';
import { useNow } from '../hooks/useNow';
import { useVehicleWebSocket } from '../hooks/useVehicleWebSocket';
import FleetMap from '../map/FleetMap';
import { getGeofences, getHistory, getNearby, isAbortError } from '../services/api';
import type { AsyncState, FocusTarget, Geofence, HistoryPoint, NearbyVehicle } from '../types/fleet';

const IDLE = { status: 'idle' } as const;
const messageOf = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

export default function Dashboard() {
  const { status, vehicles, alerts, lastMessageAt } = useVehicleWebSocket(WS_URL);
  const now = useNow(1000);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<FocusTarget | null>(null);
  const [geofences, setGeofences] = useState<AsyncState<Geofence[]>>({ status: 'loading' });
  const [geofenceReload, setGeofenceReload] = useState(0);
  const [nearby, setNearby] = useState<AsyncState<NearbyVehicle[]>>(IDLE);
  const [history, setHistory] = useState<AsyncState<HistoryPoint[]>>(IDLE);
  const [showRoute, setShowRoute] = useState(false);

  const vehiclesRef = useRef(vehicles);
  vehiclesRef.current = vehicles;
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selectedId;
  const nearbyAbort = useRef<AbortController | null>(null);
  const historyAbort = useRef<AbortController | null>(null);

  // Geofences come from the backend; nothing is hardcoded.
  useEffect(() => {
    const controller = new AbortController();
    setGeofences({ status: 'loading' });
    getGeofences(controller.signal)
      .then((data) => setGeofences({ status: 'success', data }))
      .catch((e) => {
        if (!isAbortError(e)) setGeofences({ status: 'error', message: messageOf(e) });
      });
    return () => controller.abort();
  }, [geofenceReload]);

  useEffect(
    () => () => {
      nearbyAbort.current?.abort();
      historyAbort.current?.abort();
    },
    [],
  );

  const focusOn = useCallback((id: string) => {
    const v = vehiclesRef.current[id];
    if (v) setFocus({ lat: v.latitude, lng: v.longitude, key: Date.now() });
  }, []);

  const selectVehicle = useCallback(
    (id: string) => {
      if (id !== selectedRef.current) {
        nearbyAbort.current?.abort();
        historyAbort.current?.abort();
        setSelectedId(id);
        setNearby(IDLE);
        setHistory(IDLE);
        setShowRoute(false);
      }
      focusOn(id);
    },
    [focusOn],
  );

  const findNearby = useCallback(() => {
    const id = selectedRef.current;
    const v = id ? vehiclesRef.current[id] : undefined;
    if (!id || !v) return;
    nearbyAbort.current?.abort();
    const controller = new AbortController();
    nearbyAbort.current = controller;
    setNearby({ status: 'loading' });
    getNearby(v.latitude, v.longitude, NEARBY_RADIUS_KM, id, controller.signal)
      .then((data) => setNearby({ status: 'success', data }))
      .catch((e) => {
        if (!isAbortError(e)) setNearby({ status: 'error', message: messageOf(e) });
      });
  }, []);

  const viewHistory = useCallback(() => {
    const id = selectedRef.current;
    if (!id) return;
    historyAbort.current?.abort();
    const controller = new AbortController();
    historyAbort.current = controller;
    setHistory({ status: 'loading' });
    getHistory(id, HISTORY_LIMIT, controller.signal)
      .then((data) => {
        setHistory({ status: 'success', data });
        setShowRoute(true);
      })
      .catch((e) => {
        if (!isAbortError(e)) setHistory({ status: 'error', message: messageOf(e) });
      });
  }, []);

  const toggleRoute = useCallback(() => setShowRoute((s) => !s), []);

  const vehicleList = useMemo(
    () => Object.values(vehicles).sort((a, b) => a.vehicle_id.localeCompare(b.vehicle_id, undefined, { numeric: true })),
    [vehicles],
  );
  const knownIds = useMemo(() => new Set(Object.keys(vehicles)), [vehicles]);

  const geofenceList = geofences.status === 'success' ? geofences.data : [];
  const route = showRoute && history.status === 'success' ? history.data : null;

  return (
    <div className="app">
      <Header status={status} vehicleCount={vehicleList.length} lastMessageAt={lastMessageAt} now={now} />
      <main className="workspace">
        <div className="col col-left">
          <VehicleSidebar vehicles={vehicleList} selectedId={selectedId} now={now} status={status} onSelect={selectVehicle} />
        </div>

        <section className="map-panel" aria-label="Live map">
          <FleetMap
            vehicles={vehicleList}
            geofences={geofenceList}
            selectedId={selectedId}
            now={now}
            focus={focus}
            route={route}
            onSelectVehicle={selectVehicle}
          />
          <div className="map-overlay">
            {geofences.status === 'loading' && <span className="chip">Loading geofences…</span>}
            {geofences.status === 'error' && (
              <span className="chip chip-error" role="alert">
                Geofences unavailable: {geofences.message}
                <button type="button" className="link" onClick={() => setGeofenceReload((n) => n + 1)}>
                  Retry
                </button>
              </span>
            )}
            {geofences.status === 'success' && (
              <span className="chip">
                {geofenceList.filter((g) => g.is_active).length === 0
                  ? 'No active geofences configured'
                  : `${geofenceList.filter((g) => g.is_active).length} active geofence${
                      geofenceList.filter((g) => g.is_active).length === 1 ? '' : 's'
                    }`}
              </span>
            )}
            {vehicleList.length === 0 && (
              <span className="chip">
                {status === 'connected' ? 'Waiting for vehicle telemetry…' : 'Waiting for connection to the backend…'}
              </span>
            )}
          </div>
        </section>

        <div className="col col-right">
          <VehicleDetails
            selectedId={selectedId}
            vehicle={selectedId ? vehicles[selectedId] : undefined}
            now={now}
            nearby={nearby}
            history={history}
            showRoute={showRoute}
            onFindNearby={findNearby}
            onViewHistory={viewHistory}
            onToggleRoute={toggleRoute}
            onSelectNearby={selectVehicle}
          />
          <AlertsPanel alerts={alerts} knownVehicleIds={knownIds} onFocusVehicle={selectVehicle} />
        </div>
      </main>
    </div>
  );
}
