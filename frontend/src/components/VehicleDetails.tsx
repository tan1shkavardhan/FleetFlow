import { Crosshair, History, Loader2 } from 'lucide-react';
import { HISTORY_LIMIT, NEARBY_RADIUS_KM } from '../config';
import type { AsyncState, HistoryPoint, NearbyVehicle, Vehicle } from '../types/fleet';
import { formatAgo, formatClock, formatCoord, formatSpeed, formatTimestamp, isStale } from '../utils/format';

interface Props {
  selectedId: string | null;
  vehicle?: Vehicle;
  now: number;
  nearby: AsyncState<NearbyVehicle[]>;
  history: AsyncState<HistoryPoint[]>;
  showRoute: boolean;
  onFindNearby: () => void;
  onViewHistory: () => void;
  onToggleRoute: () => void;
  onSelectNearby: (id: string) => void;
}

export default function VehicleDetails({
  selectedId,
  vehicle,
  now,
  nearby,
  history,
  showRoute,
  onFindNearby,
  onViewHistory,
  onToggleRoute,
  onSelectNearby,
}: Props) {
  if (!selectedId) {
    return (
      <section className="panel details" aria-label="Selected vehicle">
        <div className="panel-head">
          <h2>Selected vehicle</h2>
        </div>
        <p className="empty">Select a vehicle from the list or the map to see its telemetry, nearby vehicles and history.</p>
      </section>
    );
  }

  const stale = vehicle ? isStale(vehicle, now) : false;

  return (
    <section className="panel details" aria-label="Selected vehicle">
      <div className="panel-head">
        <h2>{selectedId}</h2>
        {vehicle && (
          <span className={`badge ${stale ? 'badge-muted' : 'badge-live'}`}>
            <span className={`dot ${stale ? 'dot-stale' : 'dot-live'}`} aria-hidden />
            {stale ? 'Stale' : 'Live'}
          </span>
        )}
      </div>

      {vehicle ? (
        <dl className="kv">
          <dt>Latitude</dt>
          <dd className="mono">{formatCoord(vehicle.latitude)}</dd>
          <dt>Longitude</dt>
          <dd className="mono">{formatCoord(vehicle.longitude)}</dd>
          <dt>Speed</dt>
          <dd className="mono">{formatSpeed(vehicle.speed)}</dd>
          <dt>Last update</dt>
          <dd className="mono">
            {formatClock(vehicle.lastUpdate)} ({formatAgo(vehicle.lastUpdate, now)})
          </dd>
        </dl>
      ) : (
        <p className="empty">No live telemetry received for this vehicle in this session.</p>
      )}

      <div className="actions">
        <button type="button" className="btn" onClick={onFindNearby} disabled={!vehicle || nearby.status === 'loading'}>
          {nearby.status === 'loading' ? <Loader2 size={14} className="spin" aria-hidden /> : <Crosshair size={14} aria-hidden />}
          Find nearby vehicles
        </button>
        <button type="button" className="btn" onClick={onViewHistory} disabled={history.status === 'loading'}>
          {history.status === 'loading' ? <Loader2 size={14} className="spin" aria-hidden /> : <History size={14} aria-hidden />}
          View history
        </button>
      </div>

      {nearby.status === 'error' && <p className="error">{nearby.message}</p>}
      {nearby.status === 'success' && (
        <div className="result">
          <h3>Within {NEARBY_RADIUS_KM} km</h3>
          {nearby.data.length === 0 ? (
            <p className="empty">No other vehicles within {NEARBY_RADIUS_KM} km.</p>
          ) : (
            <ul className="list">
              {nearby.data.map((n) => (
                <li key={n.vehicle_id}>
                  <button type="button" className="vehicle-row" onClick={() => onSelectNearby(n.vehicle_id)}>
                    <span className="vehicle-row-top">
                      <span className="vehicle-id">{n.vehicle_id}</span>
                      <span className="mono">{n.distance_km.toFixed(2)} km</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {history.status === 'error' && <p className="error">{history.message}</p>}
      {history.status === 'success' && (
        <div className="result">
          <div className="result-head">
            <h3>History</h3>
            {history.data.length > 1 && (
              <button type="button" className="btn btn-small" onClick={onToggleRoute}>
                {showRoute ? 'Hide route' : 'Show route'}
              </button>
            )}
          </div>
          {history.data.length === 0 ? (
            <p className="empty">The backend returned no history records for this vehicle.</p>
          ) : (
            <>
              <p className="muted small">
                {history.data.length} record{history.data.length === 1 ? '' : 's'} (limit {HISTORY_LIMIT}), so this may not
                be the complete route.
                <br />
                <span className="mono">
                  {formatTimestamp(history.data[0].timestamp)} → {formatTimestamp(history.data[history.data.length - 1].timestamp)}
                </span>
              </p>
              <ul className="history-list">
                {history.data.map((p, i) => (
                  <li key={i} className="mono small">
                    <span>{formatTimestamp(p.timestamp)}</span>
                    <span>{formatSpeed(p.speed)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
