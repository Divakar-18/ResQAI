import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LocationPickerProps } from "./location-picker";

const pinIcon = L.divIcon({
  className: "resqai-pin",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:oklch(0.65 0.22 25);box-shadow:0 0 0 4px oklch(0.65 0.22 25 / 0.25),0 0 12px oklch(0.65 0.22 25 / 0.7);border:2px solid white"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function ClickHandler({ onChange }: { onChange: LocationPickerProps["onChange"] }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ value }: { value: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (value) map.setView([value.lat, value.lng], Math.max(map.getZoom(), 14));
  }, [value, map]);
  return null;
}

export default function LocationPickerInternal({ value, onChange }: LocationPickerProps) {
  const center = useMemo<[number, number]>(
    () => (value ? [value.lat, value.lng] : [20.5937, 78.9629]),
    [value],
  );
  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <MapContainer
        center={center}
        zoom={value ? 14 : 4}
        scrollWheelZoom
        style={{ height: 260, width: "100%", background: "oklch(0.16 0.02 260)" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        <Recenter value={value} />
        {value && <Marker position={[value.lat, value.lng]} icon={pinIcon} />}
      </MapContainer>
    </div>
  );
}
