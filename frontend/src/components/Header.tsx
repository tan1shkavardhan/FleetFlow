import { Radar, Wifi, WifiOff } from 'lucide-react';
import { STALE_AFTER_MS } from '../config';
import type { ConnectionStatus } from '../types/fleet';
import { formatAgo, formatClock } from '../utils/format';

interface Props {
  status: ConnectionStatus;
  vehicleCount: number;
  lastMessageAt: number | null;
  now: number;
}

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connecting: 'Connecting',
  connected: 'Connected',
  reconnecting: 'Reconnecting',
};

export default function Header({ status, vehicleCount, lastMessageAt, now }: Props) {
  const connected = status === 'connected';
  const live = connected && lastMessageAt !== null && now - lastMessageAt <= STALE_AFTER_MS;

  return (
    <header className="header">
      <div className="brand">
        <Radar size={20} aria-hidden />
        <span className="brand-name">FleetFlow</span>
        <span className="brand-sub">Command Center</span>
      </div>
      <div className="header-stats">
        <span className={`badge ${connected ? 'badge-ok' : 'badge-warn'}`} role="status">
          {connected ? <Wifi size={13} aria-hidden /> : <WifiOff size={13} aria-hidden />}
          {STATUS_LABEL[status]}
        </span>
        <span className={`badge ${live ? 'badge-live' : 'badge-muted'}`}>
          <span className={`dot ${live ? 'dot-live' : ''}`} aria-hidden />
          {live ? 'Live' : 'No live data'}
        </span>
        <span className="stat">
          <span className="stat-label">Tracked</span>
          <span className="mono">{vehicleCount}</span>
        </span>
        <span className="stat">
          <span className="stat-label">Last update</span>
          <span className="mono">
            {lastMessageAt === null ? 'none yet' : `${formatClock(lastMessageAt)} (${formatAgo(lastMessageAt, now)})`}
          </span>
        </span>
      </div>
    </header>
  );
}
