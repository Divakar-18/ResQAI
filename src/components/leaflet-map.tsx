import { lazy, Suspense, useEffect, useState } from "react";

const MapInner = lazy(() => import("./leaflet-map-inner"));

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  priority?: string | null;
};

export function LeafletMap(props: { markers: MapMarker[]; height?: number; center?: [number, number] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const height = props.height ?? 380;
  const fallback = (
    <div
      className="grid place-items-center rounded-lg border border-border bg-surface-1 text-xs text-muted-foreground mono"
      style={{ height }}
    >
      Loading tactical map…
    </div>
  );
  if (!mounted) return fallback;
  return (
    <Suspense fallback={fallback}>
      <MapInner {...props} />
    </Suspense>
  );
}
