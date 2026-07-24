import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Crosshair, Loader2, ShieldCheck } from "lucide-react";
import { z } from "zod";

import { TopNav } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker } from "@/components/location-picker";
import { submitRequest } from "@/lib/classify.functions";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report an Emergency — ResQAI" },
      { name: "description", content: "Submit an emergency report to ResQAI. Anonymous option available. AI triages your report in seconds and dispatches the right team." },
      { property: "og:title", content: "Report an Emergency — ResQAI" },
      { property: "og:description", content: "One page, no signup. Get a tracking code and reach the right responders instantly." },
    ],
  }),
  component: ReportPage,
});

const formSchema = z.object({
  citizen_name: z.string().trim().min(1, "Please enter your name (or 'Anonymous')").max(120),
  citizen_phone: z.string().trim().max(40).optional(),
  citizen_email: z.string().trim().email().max(200).optional().or(z.literal("")),
  location_text: z.string().trim().min(2, "Location is required").max(300),
  description: z.string().trim().min(10, "Please describe the emergency in at least 10 characters").max(2000),
});

function ReportPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    citizen_name: "",
    citizen_phone: "",
    citizen_email: "",
    location_text: "",
    description: "",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  async function applyCoords(next: { lat: number; lng: number }) {
    setCoords(next);
    // Live reverse geocoding via OpenStreetMap Nominatim
    if (!form.location_text.trim()) {
      setGeocoding(true);
      const { reverseGeocode } = await import("@/lib/reverse-geocode");
      const label = await reverseGeocode(next.lat, next.lng);
      setGeocoding(false);
      if (label) setForm((f) => (f.location_text.trim() ? f : { ...f, location_text: label }));
    }
  }

  const submit = useMutation({
    mutationFn: async (payload: typeof form) => {
      const parsed = formSchema.parse(payload);
      return submitRequest({
        data: {
          ...parsed,
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
        },
      });
    },
    onSuccess: (res) => {
      toast.success(`Report submitted — code ${res.request_code}`);
      navigate({ to: "/track/$code", params: { code: res.request_code } });
    },
    onError: (err: unknown) => {
      const msg = err instanceof z.ZodError ? err.issues[0]?.message : err instanceof Error ? err.message : "Submission failed";
      toast.error(msg ?? "Submission failed");
    },
  });

  function detectLocation() {
    if (!("geolocation" in navigator)) return toast.error("Geolocation not supported");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void applyCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("GPS coordinates captured");
      },
      () => {
        setLocating(false);
        toast.error("Could not access location");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }


  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-destructive/15 ring-1 ring-destructive/40">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Report an Emergency</h1>
            <p className="text-sm text-muted-foreground">Your report is triaged by AI in seconds and routed to the right responders.</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate(form);
          }}
          className="glass space-y-5 rounded-2xl p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="citizen_name">Your name *</Label>
              <Input
                id="citizen_name"
                value={form.citizen_name}
                onChange={(e) => setForm((f) => ({ ...f, citizen_name: e.target.value }))}
                placeholder="Anonymous"
                maxLength={120}
                required
              />
            </div>
            <div>
              <Label htmlFor="citizen_phone">Phone (optional)</Label>
              <Input
                id="citizen_phone"
                value={form.citizen_phone}
                onChange={(e) => setForm((f) => ({ ...f, citizen_phone: e.target.value }))}
                placeholder="+91 …"
                maxLength={40}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="citizen_email">Email (optional)</Label>
            <Input
              id="citizen_email"
              type="email"
              value={form.citizen_email}
              onChange={(e) => setForm((f) => ({ ...f, citizen_email: e.target.value }))}
              placeholder="you@example.com"
              maxLength={200}
            />
          </div>

          <div>
            <Label htmlFor="location_text">Location *</Label>
            <div className="flex gap-2">
              <Input
                id="location_text"
                value={form.location_text}
                onChange={(e) => setForm((f) => ({ ...f, location_text: e.target.value }))}
                placeholder="Neighborhood, landmark, city"
                required
                maxLength={300}
              />
              <Button type="button" variant="outline" onClick={detectLocation} disabled={locating}>
                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
              </Button>
            </div>
            {coords && (
              <p className="mt-1 mono text-[10px] text-success">
                GPS lock: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                {geocoding && <span className="ml-2 text-muted-foreground">· resolving address…</span>}
              </p>
            )}
            <div className="mt-3">
              <p className="mb-2 mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Tap the map to pin the exact spot
              </p>
              <LocationPicker value={coords} onChange={(c) => void applyCoords(c)} />
            </div>

          </div>

          <div>
            <Label htmlFor="description">What's happening? *</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe the emergency clearly. Who is affected, how urgent, any injuries or hazards."
              rows={6}
              maxLength={2000}
              required
            />
            <p className="mt-1 mono text-[10px] text-muted-foreground">{form.description.length}/2000</p>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-success" />
              Encrypted in transit · No account required
            </div>
            <Button type="submit" disabled={submit.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Dispatch Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
