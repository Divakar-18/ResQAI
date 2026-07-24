// Live OpenStreetMap Nominatim reverse geocoding (browser-side).
// Nominatim policy: identify with a UA/Referer (browsers add Referer automatically)
// and cap to <= 1 req/sec; the debounce in call sites handles that.
export async function reverseGeocode(lat: number, lng: number, signal?: AbortSignal): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=17&addressdetails=1`;
    const res = await fetch(url, {
      signal,
      headers: { "Accept-Language": navigator.language || "en" },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { display_name?: string };
    return j.display_name ?? null;
  } catch {
    return null;
  }
}
