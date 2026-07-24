import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import type { MapMarker } from "./leaflet-map";

const priorityColor: Record<string, string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#eab308",
  low: "#10b981",
};

export default function MapInner({
  markers,
  height = 380,
  center,
}: {
  markers: MapMarker[];
  height?: number;
  center?: [number, number];
}) {
  const c: [number, number] =
    center ??
    (markers.length > 0 ? [markers[0].lat, markers[0].lng] : [20.5937, 78.9629]);
  return (
    <div style={{ height }} className="overflow-hidden rounded-lg border border-border">
      <MapContainer center={c} zoom={markers.length ? 6 : 4} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m) => {
          const color = priorityColor[m.priority ?? "medium"] ?? "#eab308";
          return (
            <CircleMarker
              key={m.id}
              center={[m.lat, m.lng]}
              radius={8}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.7, weight: 2 }}
            >
              {m.label ? <Popup>{m.label}</Popup> : null}
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
