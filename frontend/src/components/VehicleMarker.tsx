import { memo, useMemo } from 'react';
import L from 'leaflet';
import { Marker, Tooltip } from 'react-leaflet';

const iconCache = new Map<string, L.DivIcon>();

function getIcon(selected: boolean, stale: boolean): L.DivIcon {
  const key = `${selected}-${stale}`;
  let icon = iconCache.get(key);
  if (!icon) {
    icon = L.divIcon({
      className: 'veh-icon',
      html: `<div class="veh-marker${selected ? ' is-selected' : ''}${stale ? ' is-stale' : ''}"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    iconCache.set(key, icon);
  }
  return icon;
}

interface Props {
  id: string;
  latitude: number;
  longitude: number;
  selected: boolean;
  stale: boolean;
  onSelect: (id: string) => void;
}

function VehicleMarker({ id, latitude, longitude, selected, stale, onSelect }: Props) {
  // react-leaflet compares `position` by reference, so keep it stable between unrelated renders.
  const position = useMemo<[number, number]>(() => [latitude, longitude], [latitude, longitude]);
  const handlers = useMemo(() => ({ click: () => onSelect(id) }), [id, onSelect]);

  return (
    <Marker
      position={position}
      icon={getIcon(selected, stale)}
      eventHandlers={handlers}
      zIndexOffset={selected ? 1000 : 0}
      keyboard
    >
      <Tooltip direction="top" offset={[0, -10]}>
        {id}
      </Tooltip>
    </Marker>
  );
}

export default memo(VehicleMarker);
