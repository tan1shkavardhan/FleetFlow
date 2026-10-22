import { Fragment, memo } from 'react';
import L from 'leaflet';
import { Circle, Marker, Popup } from 'react-leaflet';
import type { Geofence } from '../types/fleet';

const geofenceIcon = L.divIcon({
  className: 'veh-icon',
  html: '<div class="geo-marker"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const circleStyle = { color: '#38BDF8', weight: 1.5, fillColor: '#38BDF8', fillOpacity: 0.1 };

function GeofenceLayer({ geofences }: { geofences: Geofence[] }) {
  return (
    <>
      {geofences
        .filter((g) => g.is_active)
        .map((g) => {
          const popup = (
            <Popup>
              <strong>{g.name}</strong>
              <br />
              Status: {g.is_active ? 'active' : 'inactive'}
              <br />
              Radius: {g.radius_m} m
            </Popup>
          );
          const center: [number, number] = [g.latitude, g.longitude];
          return (
            <Fragment key={g.id}>
              <Circle center={center} radius={g.radius_m} pathOptions={circleStyle}>
                {popup}
              </Circle>
              <Marker position={center} icon={geofenceIcon}>
                {popup}
              </Marker>
            </Fragment>
          );
        })}
    </>
  );
}

export default memo(GeofenceLayer);
