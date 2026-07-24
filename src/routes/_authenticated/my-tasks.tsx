import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PriorityBadge, StatusBadge } from "@/components/priority-badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { updateRequestStatus } from "@/lib/requests.functions";
import { useRequestsRealtime } from "@/hooks/use-requests-realtime";

export const Route = createFileRoute("/_authenticated/my-tasks")({
  head: () => ({ meta: [{ title: "My Tasks — ResQAI" }, { name: "robots", content: "noindex" }] }),
  component: MyTasksPage,
});

type Row = Database["public"]["Tables"]["requests"]["Row"];

function MyTasksPage() {
  const qc = useQueryClient();
  const [uid, setUid] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean>(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUid(data.user.id);
      supabase.from("profiles").select("is_available").eq("id", data.user.id).maybeSingle().then(({ data: p }) => {
        if (p) setAvailable(!!p.is_available);
      });
    });
  }, []);

  const tasks = useQuery({
    queryKey: ["my-tasks", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("assigned_volunteer_id", uid!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Row[];
    },
    refetchInterval: 20_000,
  });
  useRequestsRealtime([["my-tasks", uid]]);

  const setStatus = useMutation({
    mutationFn: (input: { request_id: string; status: Row["status"] }) => updateRequestStatus({ data: input }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["my-tasks"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  async function toggleAvailable(v: boolean) {
    if (!uid) return;
    setAvailable(v);
    const { error } = await supabase.from("profiles").update({ is_available: v }).eq("id", uid);
    if (error) toast.error(error.message);
  }

  const rows = tasks.data ?? [];
  const active = rows.filter((r) => !["completed", "cancelled", "rejected"].includes(r.status));
  const done = rows.filter((r) => ["completed", "cancelled", "rejected"].includes(r.status));

  return (
    <AppShell active="/my-tasks">
      <div className="border-b border-border/60 bg-surface-1/60 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="mono text-[10px] uppercase tracking-widest text-primary">Volunteer Console</p>
            <h1 className="font-display text-2xl font-bold">My Tasks</h1>
          </div>
          <label className="flex items-center gap-3 rounded-md border border-border bg-surface-2/60 px-3 py-2">
            <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Availability</span>
            <Switch checked={available} onCheckedChange={toggleAvailable} />
            <span className={`mono text-xs ${available ? "text-success" : "text-muted-foreground"}`}>{available ? "ON DUTY" : "OFF"}</span>
          </label>
        </div>
      </div>

      <div className="space-y-8 p-6">
        <Section title={`Active · ${active.length}`}>
          {active.length === 0 ? <Empty text="No active tasks right now." /> : active.map((r) => (
            <TaskCard key={r.id} row={r} onUpdate={(s) => setStatus.mutate({ request_id: r.id, status: s })} pending={setStatus.isPending} />
          ))}
        </Section>
        <Section title={`Closed · ${done.length}`}>
          {done.length === 0 ? <Empty text="Nothing closed yet." /> : done.map((r) => (
            <TaskCard key={r.id} row={r} onUpdate={() => {}} pending={false} readonly />
          ))}
        </Section>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 mono text-[10px] uppercase tracking-widest text-muted-foreground">{title}</h2>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="glass col-span-full rounded-xl p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function TaskCard({ row, onUpdate, pending, readonly }: { row: Row; onUpdate: (s: Row["status"]) => void; pending: boolean; readonly?: boolean }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="mono text-xs text-primary">{row.request_code}</span>
        <div className="flex gap-2">
          <PriorityBadge priority={row.priority} />
          <StatusBadge status={row.status} />
        </div>
      </div>
      <div className="text-sm font-semibold">{row.intent?.replaceAll("_", " ") ?? "Request"}</div>
      <div className="mt-1 text-xs text-muted-foreground">{row.location_text}</div>
      <p className="mt-2 text-sm text-foreground/90 line-clamp-3">{row.description}</p>
      {!readonly && (
        <div className="mt-3 flex flex-wrap gap-2">
          {row.status !== "in_progress" && (
            <Button size="sm" variant="outline" disabled={pending} onClick={() => onUpdate("in_progress")}>
              Start
            </Button>
          )}
          <Button size="sm" disabled={pending} onClick={() => onUpdate("completed")}>
            Mark complete
          </Button>
        </div>
      )}
    </div>
  );
}
