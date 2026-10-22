import { useEffect } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from 'react-leaflet';
import GeofenceLayer from '../components/GeofenceLayer';
import VehicleMarker from '../components/VehicleMarker';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, TILE_ATTRIBUTION, TILE_URL } from '../config';
import type { FocusTarget, Geofence, HistoryPoint, Vehicle } from '../types/fleet';
import { isStale } from '../utils/format';

function MapController({ focus, route }: { focus: FocusTarget | null; route: HistoryPoint[] | null }) {
  const map = useMap();

  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
  }, [focus, map]);

  useEffect(() => {
    if (route && route.length > 1) {
      map.fitBounds(L.latLngBounds(route.map((p) => [p.latitude, p.longitude] as [number, number])), {
        padding: [48, 48],
        maxZoom: 17,
      });
    }
  }, [route, map]);

  return null;
}

interface Props {
  vehicles: Vehicle[];
  geofences: Geofence[];
  selectedId: string | null;
  now: number;
  focus: FocusTarget | null;
  route: HistoryPoint[] | null;
  onSelectVehicle: (id: string) => void;
}

export default function FleetMap({ vehicles, geofences, selectedId, now, focus, route, onSelectVehicle }: Props) {
  const routePositions = route?.map((p) => [p.latitude, p.longitude] as [number, number]) ?? null;

  return (
    <MapContainer center={DEFAULT_MAP_CENTER} zoom={DEFAULT_MAP_ZOOM} className="map" preferCanvas>
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} />
      <GeofenceLayer geofences={geofences} />
      {routePositions && (
        <>
          <Polyline positions={routePositions} pathOptions={{ color: '#38BDF8', weight: 3, opacity: 0.9 }} />
          {routePositions.map((pos, i) => (
            <CircleMarker
              key={i}
              center={pos}
              radius={2.5}
              pathOptions={{ color: '#38BDF8', fillColor: '#0B1120', fillOpacity: 1, weight: 1.5 }}
            />
          ))}
        </>
      )}
      {vehicles.map((v) => (
        <VehicleMarker
          key={v.vehicle_id}
          id={v.vehicle_id}
          latitude={v.latitude}
          longitude={v.longitude}
          selected={v.vehicle_id === selectedId}
          stale={isStale(v, now)}
          onSelect={onSelectVehicle}
        />
      ))}
      <MapController focus={focus} route={route} />
    </MapContainer>
  );
}
