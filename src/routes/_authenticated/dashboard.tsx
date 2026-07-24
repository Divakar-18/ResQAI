import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, AlertOctagon, CheckCircle2, LogOut, Radio, Users } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PriorityBadge, StatusBadge } from "@/components/priority-badge";
import { LeafletMap, type MapMarker } from "@/components/leaflet-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useRequestsRealtime } from "@/hooks/use-requests-realtime";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Command Center — ResQAI" }, { name: "robots", content: "noindex" }] }),
  component: DashboardPage,
});

type Row = Database["public"]["Tables"]["requests"]["Row"];

function DashboardPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  const list = useQuery({
    queryKey: ["requests-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Row[];
    },
    refetchInterval: 15_000,
  });
  useRequestsRealtime([["requests-all"]]);

  const rows = list.data ?? [];

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "critical" && r.priority !== "critical") return false;
      if (filter === "active" && ["completed", "rejected", "cancelled"].includes(r.status)) return false;
      if (filter === "review" && r.status !== "awaiting_review") return false;
      if (q && !`${r.request_code} ${r.location_text} ${r.description}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [rows, filter, q]);

  const stats = useMemo(() => {
    const active = rows.filter((r) => !["completed", "rejected", "cancelled"].includes(r.status)).length;
    const critical = rows.filter((r) => r.priority === "critical" && !["completed", "cancelled"].includes(r.status)).length;
    const review = rows.filter((r) => r.status === "awaiting_review").length;
    const completed = rows.filter((r) => r.status === "completed").length;
    const dayAgo = Date.now() - 86400_000;
    const today = rows.filter((r) => new Date(r.created_at).getTime() >= dayAgo).length;
    const confidenceValues = rows.map((r) => r.confidence).filter((v): v is number => v != null);
    const avgConfidence = confidenceValues.length
      ? Math.round(confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length)
      : 0;
    const responded = rows.filter((r) => r.assigned_at);
    const responseTimes = responded
      .map((r) => (new Date(r.assigned_at!).getTime() - new Date(r.created_at).getTime()) / 1000)
      .filter((s) => s >= 0 && s < 86400);
    const avgResponseSec = responseTimes.length
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;
    const autoAttempts = rows.filter((r) => r.auto_executed).length;
    const autoSuccess = rows.filter((r) => r.auto_executed && r.assigned_volunteer_id).length;
    const execSuccessRate = autoAttempts ? Math.round((autoSuccess / autoAttempts) * 100) : 0;
    return { active, critical, review, completed, today, avgConfidence, avgResponseSec, execSuccessRate };
  }, [rows]);

  const markers: MapMarker[] = filtered
    .filter((r): r is Row & { latitude: number; longitude: number } => r.latitude != null && r.longitude != null)
    .map((r) => ({
      id: r.id,
      lat: r.latitude,
      lng: r.longitude,
      label: `${r.request_code} — ${r.intent ?? "unclassified"}`,
      priority: r.priority,
    }));

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell active="/dashboard">
      <div className="border-b border-border/60 bg-surface-1/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="mono text-[10px] uppercase tracking-widest text-primary">Live Feed</p>
            <h1 className="font-display text-2xl font-bold">Command Center</h1>
          </div>
          <div className="flex items-center gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search code, location, keyword…" className="w-72" />
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-border/60 bg-border/60 md:grid-cols-4 lg:grid-cols-7">
          <Stat icon={Activity} label="Active" value={stats.active} tone="info" />
          <Stat icon={AlertOctagon} label="Critical" value={stats.critical} tone="critical" />
          <Stat icon={Radio} label="Review" value={stats.review} tone="medium" />
          <Stat icon={CheckCircle2} label="Completed" value={stats.completed} tone="success" />
          <Stat icon={Activity} label="Today" value={stats.today} tone="info" />
          <Stat icon={CheckCircle2} label="Avg Conf" value={`${stats.avgConfidence}%`} tone="success" />
          <Stat icon={Radio} label="Avg Response" value={formatSec(stats.avgResponseSec)} tone="medium" />
        </div>
      </div>


      <div className="grid gap-4 p-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex flex-wrap gap-2">
            {[
              { k: "all", l: "All" },
              { k: "active", l: "Active" },
              { k: "critical", l: "Critical" },
              { k: "review", l: "Awaiting Review" },
            ].map((f) => (
              <button
                key={f.k}
                onClick={() => setFilter(f.k)}
                className={`rounded-md px-3 py-1.5 text-xs mono uppercase tracking-widest ring-1 transition ${
                  filter === f.k ? "bg-primary/15 text-primary ring-primary/40" : "text-muted-foreground ring-border hover:text-foreground"
                }`}
              >
                {f.l}
              </button>
            ))}
          </div>
          <div className="glass overflow-hidden rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-surface-2/50 text-left mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Intent</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Conf</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Age</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No requests match this filter.</td>
                  </tr>
                )}
                {filtered.map((r, i) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i, 10) * 0.02 }}
                    className="border-t border-border/40 hover:bg-surface-2/30"
                  >
                    <td className="px-4 py-3 mono text-primary">{r.request_code}</td>
                    <td className="px-4 py-3">{r.intent?.replaceAll("_", " ") ?? "—"}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={r.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 mono text-xs">{r.confidence != null ? `${r.confidence}%` : "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[220px] truncate">{r.location_text}</td>
                    <td className="px-4 py-3 mono text-[10px] text-muted-foreground">{timeAgo(r.created_at)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <div className="glass rounded-xl p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Geo Distribution</div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <LeafletMap markers={markers} height={280} />
          </div>
          <div className="glass rounded-xl p-4">
            <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Priority mix</div>
            <div className="mt-3 space-y-2">
              {(["critical", "high", "medium", "low"] as const).map((p) => {
                const count = rows.filter((r) => r.priority === p).length;
                const total = Math.max(rows.length, 1);
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={p}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <PriorityBadge priority={p} />
                      <span className="mono text-muted-foreground">{count} · {pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div className={`h-full bg-${p}`} style={{ width: `${pct}%`, backgroundColor: `var(--${p})` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Activity; label: string; value: number | string; tone: "info" | "critical" | "medium" | "success" }) {
  const color = { info: "text-info", critical: "text-critical", medium: "text-medium", success: "text-success" }[tone];
  return (
    <div className="bg-background/60 p-5">
      <div className="flex items-center justify-between">
        <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}

function formatSec(s: number) {
  if (!s) return "—";
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  return `${(s / 3600).toFixed(1)}h`;
}


function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
