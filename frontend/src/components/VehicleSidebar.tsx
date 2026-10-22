import { memo, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { ConnectionStatus, Vehicle } from '../types/fleet';
import { formatCoord, formatSpeed, isStale } from '../utils/format';

interface RowProps {
  vehicle: Vehicle;
  selected: boolean;
  stale: boolean;
  onSelect: (id: string) => void;
}

const VehicleRow = memo(function VehicleRow({ vehicle, selected, stale, onSelect }: RowProps) {
  return (
    <li>
      <button
        type="button"
        className={`vehicle-row ${selected ? 'is-selected' : ''}`}
        aria-pressed={selected}
        onClick={() => onSelect(vehicle.vehicle_id)}
      >
        <span className="vehicle-row-top">
          <span className="vehicle-id">
            <span className={`dot ${stale ? 'dot-stale' : 'dot-live'}`} aria-hidden />
            {vehicle.vehicle_id}
          </span>
          <span className="mono">{formatSpeed(vehicle.speed)}</span>
        </span>
        <span className="mono muted small">
          {formatCoord(vehicle.latitude)}, {formatCoord(vehicle.longitude)}
          {stale && ' · stale'}
        </span>
      </button>
    </li>
  );
});

interface Props {
  vehicles: Vehicle[];
  selectedId: string | null;
  now: number;
  status: ConnectionStatus;
  onSelect: (id: string) => void;
}

export default function VehicleSidebar({ vehicles, selectedId, now, status, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? vehicles.filter((v) => v.vehicle_id.toLowerCase().includes(q)) : vehicles;
  }, [vehicles, query]);

  return (
    <section className="panel sidebar" aria-label="Vehicles">
      <div className="panel-head">
        <h2>Vehicles</h2>
        <span className="mono muted">{vehicles.length}</span>
      </div>
      <label className="search">
        <Search size={14} aria-hidden />
        <input
          type="search"
          placeholder="Search vehicle ID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search vehicles"
        />
      </label>
      <div className="panel-body">
        {vehicles.length === 0 ? (
          <p className="empty">
            {status === 'connected'
              ? 'Connected. Waiting for the first telemetry message from the backend.'
              : 'Not connected to the backend yet. Vehicles appear once telemetry arrives.'}
          </p>
        ) : filtered.length === 0 ? (
          <p className="empty">No vehicle IDs match “{query}”.</p>
        ) : (
          <ul className="list">
            {filtered.map((v) => (
              <VehicleRow
                key={v.vehicle_id}
                vehicle={v}
                selected={v.vehicle_id === selectedId}
                stale={isStale(v, now)}
                onSelect={onSelect}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
