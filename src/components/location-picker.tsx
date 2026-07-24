import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";

const InternalPicker = lazy(() => import("./location-picker.internal"));

export interface LocationPickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
}

export function LocationPicker(props: LocationPickerProps) {
  return (
    <ClientOnly
      fallback={
        <div className="h-56 w-full animate-pulse rounded-lg border border-border/60 bg-surface-1/60" />
      }
    >
      <Suspense
        fallback={
          <div className="h-56 w-full animate-pulse rounded-lg border border-border/60 bg-surface-1/60" />
        }
      >
        <InternalPicker {...props} />
      </Suspense>
    </ClientOnly>
  );
}
