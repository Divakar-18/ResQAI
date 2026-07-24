import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { updateOrgSettings, updateMyProfile } from "@/lib/settings.functions";


export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — ResQAI" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const [threshold, setThreshold] = useState<number>(80);
  const [discord, setDiscord] = useState<string>("");
  const [notifyEmail, setNotifyEmail] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  const settings = useQuery({
    queryKey: ["org-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("org_settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings.data && !loaded) {
      setThreshold(Number(settings.data.auto_execute_threshold ?? 80));
      setDiscord(settings.data.discord_webhook_url ?? "");
      setNotifyEmail(settings.data.notify_email ?? "");
      setLoaded(true);
    }
  }, [settings.data, loaded]);

  const save = useMutation({
    mutationFn: () => {
      const trimmedDiscord = discord.trim();
      if (trimmedDiscord && !/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\//.test(trimmedDiscord)) {
        throw new Error("Discord webhook URL must start with https://discord.com/api/webhooks/");
      }
      const trimmedEmail = notifyEmail.trim();
      if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        throw new Error("Notification email is not a valid address");
      }
      return updateOrgSettings({
        data: {
          auto_execute_threshold: threshold,
          discord_webhook_url: trimmedDiscord || null,
          notify_email: trimmedEmail || null,
        },
      });
    },
    onSuccess: () => { toast.success("Settings saved"); qc.invalidateQueries({ queryKey: ["org-settings"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  // Volunteer profile
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  const profile = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (profile.data && !profileLoaded) {
      setDisplayName(profile.data.display_name ?? "");
      setPhone(profile.data.phone ?? "");
      setSkillsText(((profile.data.skills as string[] | null) ?? []).join(", "));
      setIsAvailable(profile.data.is_available ?? true);
      setLat(profile.data.latitude != null ? String(profile.data.latitude) : "");
      setLng(profile.data.longitude != null ? String(profile.data.longitude) : "");
      setProfileLoaded(true);
    }
  }, [profile.data, profileLoaded]);

  const saveProfile = useMutation({
    mutationFn: () => {
      const parsedLat = lat.trim() ? Number(lat) : null;
      const parsedLng = lng.trim() ? Number(lng) : null;
      if (parsedLat != null && (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90)) throw new Error("Latitude must be between -90 and 90");
      if (parsedLng != null && (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180)) throw new Error("Longitude must be between -180 and 180");
      return updateMyProfile({
        data: {
          display_name: displayName.trim() || undefined,
          phone: phone.trim(),
          skills: skillsText.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20),
          is_available: isAvailable,
          latitude: parsedLat,
          longitude: parsedLng,
        },
      });
    },
    onSuccess: () => { toast.success("Profile updated"); qc.invalidateQueries({ queryKey: ["my-profile"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  function useMyLocation() {
    if (!navigator.geolocation) { toast.error("Geolocation unavailable"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude.toFixed(6)); setLng(pos.coords.longitude.toFixed(6)); toast.success("Location captured"); },
      (err) => toast.error(err.message),
    );
  }


  return (
    <AppShell active="/settings">
      <div className="border-b border-border/60 bg-surface-1/60 px-6 py-4">
        <p className="mono text-[10px] uppercase tracking-widest text-primary">Configuration</p>
        <h1 className="font-display text-2xl font-bold">Organization Settings</h1>
      </div>
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div className="glass rounded-xl p-6">
          <h2 className="font-display text-lg font-semibold">Workflow Automation</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            When the AI's confidence score meets or exceeds this threshold, the request is auto-approved and dispatched
            without human review. Lower values increase automation; higher values increase oversight.
          </p>
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <Label>Auto-execute threshold</Label>
              <span className="mono text-primary">{threshold}%</span>
            </div>
            <Slider value={[threshold]} min={50} max={100} step={1} onValueChange={(v) => setThreshold(v[0])} />
            <div className="mt-1 flex justify-between mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>50 · aggressive</span>
              <span>100 · conservative</span>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <h2 className="font-display text-lg font-semibold">Discord Alerts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Post critical and high-priority auto-dispatched requests to a Discord channel via a channel webhook URL.
            Create it in Discord under <em>Channel Settings → Integrations → Webhooks → New Webhook</em>.
          </p>
          <div className="mt-4 space-y-2">
            <Label htmlFor="discord">Discord webhook URL</Label>
            <Input
              id="discord"
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              placeholder="https://discord.com/api/webhooks/…"
              maxLength={500}
            />
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <h2 className="font-display text-lg font-semibold">Email Alerts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Send an email to a coordinator inbox whenever ResQAI auto-dispatches a critical or high-priority incident.
            Delivery uses Lovable's managed email service; a verified sender domain on this project is required for messages to leave the platform.
          </p>
          <div className="mt-4 space-y-2">
            <Label htmlFor="notify_email">Notification email</Label>
            <Input
              id="notify_email"
              type="email"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              placeholder="ops@your-ngo.org"
              maxLength={200}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save organization settings"}
          </Button>
        </div>

        <div className="glass rounded-xl p-6">
          <h2 className="font-display text-lg font-semibold">My Volunteer Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your skills, availability, and location power ResQAI's matching engine. Keep these accurate to receive the right assignments.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dn">Display name</Label>
              <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ph">Phone</Label>
              <Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} placeholder="+1 555 010 3344" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sk">Skills (comma-separated)</Label>
              <Input id="sk" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} placeholder="medical, search_rescue, driver, translator_es" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input id="lat" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="e.g. 12.9716" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input id="lng" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="e.g. 77.5946" />
            </div>
            <div className="md:col-span-2 flex items-center justify-between rounded border border-border/60 bg-surface-2/40 p-3">
              <div>
                <div className="text-sm font-medium">Available for dispatch</div>
                <div className="text-xs text-muted-foreground">Turn off to pause new assignments.</div>
              </div>
              <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={useMyLocation}>
              <MapPin className="mr-2 h-4 w-4" /> Use my current location
            </Button>
            <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
              {saveProfile.isPending ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
