import { STALE_AFTER_MS } from '../config';
import type { Vehicle } from '../types/fleet';

export const isStale = (v: Vehicle, now: number) => now - v.lastUpdate > STALE_AFTER_MS;

export const formatCoord = (n: number) => n.toFixed(5);

export const formatSpeed = (s: number | null) => (s === null ? '—' : String(Math.round(s * 10) / 10));

export function formatClock(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour12: false });
}

export function formatTimestamp(value: string | number): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString([], { hour12: false });
}

export function formatAgo(ms: number, now: number): string {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}
