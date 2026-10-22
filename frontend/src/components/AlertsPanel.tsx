import { Info, LogIn, LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import type { FleetAlert } from '../types/fleet';
import { formatClock } from '../utils/format';

interface Described {
  icon: ReactNode;
  tone: 'enter' | 'exit';
  text: string;
  detail: string;
}

/** One case per alert kind. Add a 'delay' case here once the backend sends delay events. */
function describeAlert(alert: FleetAlert): Described {
  switch (alert.kind) {
    case 'geofence': {
      const entered = alert.event === 'ENTER';
      return {
        icon: entered ? <LogIn size={14} aria-hidden /> : <LogOut size={14} aria-hidden />,
        tone: entered ? 'enter' : 'exit',
        text: `${alert.vehicle_id} ${entered ? 'entered' : 'exited'} ${alert.geofence_name}`,
        detail: alert.distance_m === null ? alert.event : `${alert.event} · ${alert.distance_m} m from centre`,
      };
    }
  }
}

interface Props {
  alerts: FleetAlert[];
  /** Vehicle IDs whose current location is known. */
  knownVehicleIds: ReadonlySet<string>;
  onFocusVehicle: (vehicleId: string) => void;
}

export default function AlertsPanel({ alerts, knownVehicleIds, onFocusVehicle }: Props) {
  return (
    <section className="panel alerts" aria-label="Geofence alerts">
      <div className="panel-head">
        <h2>Alerts</h2>
        <span className="mono muted">{alerts.length}</span>
      </div>
      <div className="panel-body">
        {alerts.length === 0 ? (
          <p className="empty">No geofence events received yet. ENTER and EXIT events appear here as they arrive.</p>
        ) : (
          <ul className="list">
            {alerts.map((alert) => {
              const d = describeAlert(alert);
              const canFocus = knownVehicleIds.has(alert.vehicle_id);
              return (
                <li key={alert.id}>
                  <button
                    type="button"
                    className={`alert-row tone-${d.tone}`}
                    disabled={!canFocus}
                    title={canFocus ? 'Show vehicle on map' : 'Vehicle location not available'}
                    onClick={() => onFocusVehicle(alert.vehicle_id)}
                  >
                    <span className="alert-icon">{d.icon}</span>
                    <span className="alert-text">
                      <span>{d.text}</span>
                      <span className="muted small mono">{d.detail}</span>
                    </span>
                    <span className="mono muted small">{formatClock(alert.receivedAt)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="note">
        <Info size={13} aria-hidden /> Delay alerts are not available yet: the backend does not send them over the WebSocket.
      </p>
    </section>
  );
}
