import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bot, Check, ChevronRight, Sparkles, X } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { PriorityBadge } from "@/components/priority-badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { reviewDecision } from "@/lib/requests.functions";
import { getVolunteerMatches } from "@/lib/matching.functions";
import { useRequestsRealtime } from "@/hooks/use-requests-realtime";

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({ meta: [{ title: "AI Review Queue — ResQAI" }, { name: "robots", content: "noindex" }] }),
  component: ReviewPage,
});

type Row = Database["public"]["Tables"]["requests"]["Row"];

function ReviewPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["review-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("status", "awaiting_review")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Row[];
    },
    refetchInterval: 15_000,
  });
  useRequestsRealtime([["review-queue"], ["requests-all"]]);

  const decide = useMutation({
    mutationFn: (input: { request_id: string; decision: "approve" | "reject"; volunteer_id?: string }) =>
      reviewDecision({ data: input }),
    onSuccess: () => {
      toast.success("Decision recorded");
      qc.invalidateQueries({ queryKey: ["review-queue"] });
      qc.invalidateQueries({ queryKey: ["requests-all"] });
      setSelected(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const matches = useQuery({
    queryKey: ["volunteer-matches", selected],
    queryFn: () => getVolunteerMatches({ data: { request_id: selected! } }),
    enabled: !!selected,
    staleTime: 30_000,
  });


  const rows = q.data ?? [];
  const current = rows.find((r) => r.id === selected) ?? rows[0];

  return (
    <AppShell active="/review">
      <div className="border-b border-border/60 bg-surface-1/60 px-6 py-4">
        <p className="mono text-[10px] uppercase tracking-widest text-primary">Human In The Loop</p>
        <h1 className="font-display text-2xl font-bold">AI Review Queue</h1>
        <p className="text-sm text-muted-foreground">Reports where the AI confidence is below the auto-execute threshold.</p>
      </div>
      <div className="grid gap-4 p-6 lg:grid-cols-[380px_1fr]">
        <div className="glass rounded-xl">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Pending · {rows.length}</div>
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {rows.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Queue clear. Nice work.</div>}
            {rows.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r.id)}
                className={`flex w-full items-start gap-3 border-b border-border/40 p-3 text-left hover:bg-surface-2/40 ${
                  current?.id === r.id ? "bg-surface-2/60" : ""
                }`}
              >
                <PriorityBadge priority={r.priority} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="mono text-xs text-primary">{r.request_code}</span>
                    <span className="mono text-[10px] text-muted-foreground">{r.confidence ?? "?"}%</span>
                  </div>
                  <div className="mt-0.5 truncate text-sm">{r.intent?.replaceAll("_", " ") ?? "unclassified"}</div>
                  <div className="truncate text-xs text-muted-foreground">{r.location_text}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          {!current ? (
            <div className="grid h-full place-items-center text-muted-foreground">Select a report to review.</div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="mono text-primary">{current.request_code}</span>
                <PriorityBadge priority={current.priority} />
                <span className="mono text-[10px] text-muted-foreground">
                  AI confidence · {current.confidence ?? "?"}%
                </span>
              </div>
              <Meta label="Reporter">{current.citizen_name}{current.citizen_phone ? ` · ${current.citizen_phone}` : ""}</Meta>
              <Meta label="Location">{current.location_text}</Meta>
              <Meta label="Description">{current.description}</Meta>
              <div className="grid gap-3 md:grid-cols-3">
                <Meta label="Detected intent">{current.intent?.replaceAll("_", " ") ?? "—"}</Meta>
                <Meta label="Recommended dept">{current.department?.replaceAll("_", " ") ?? "—"}</Meta>
                <Meta label="Sentiment">{current.sentiment ?? "—"}</Meta>
              </div>
              {current.ai_reasoning && (
                <div className="rounded-md border border-border/60 bg-surface-2/40 p-3">
                  <div className="mono text-[9px] uppercase tracking-widest text-muted-foreground">AI reasoning</div>
                  <p className="mt-1 text-sm">{current.ai_reasoning}</p>
                </div>
              )}
              {(current.recommended_resources?.length || current.estimated_response_minutes || current.suggested_volunteer_skill) && (
                <div className="grid gap-3 md:grid-cols-3">
                  {current.recommended_resources && current.recommended_resources.length > 0 && (
                    <Meta label="Recommended resources">
                      <div className="flex flex-wrap gap-1">
                        {current.recommended_resources.map((r) => (
                          <span key={r} className="mono text-[10px] rounded bg-primary/10 px-1.5 py-0.5 text-primary">{r}</span>
                        ))}
                      </div>
                    </Meta>
                  )}
                  {current.estimated_response_minutes != null && (
                    <Meta label="Estimated response">{current.estimated_response_minutes} min</Meta>
                  )}
                  {current.suggested_volunteer_skill && (
                    <Meta label="Suggested skill">{current.suggested_volunteer_skill}</Meta>
                  )}
                </div>
              )}

              <div className="rounded-md border border-border/60 bg-surface-2/40 p-3">
                <div className="flex items-center justify-between">
                  <div className="mono text-[9px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> AI-ranked volunteers
                  </div>
                  {matches.isLoading && <span className="mono text-[10px] text-muted-foreground">scoring…</span>}
                </div>
                <div className="mt-2 space-y-2">
                  {matches.data && matches.data.length === 0 && (
                    <p className="text-xs text-muted-foreground">No available volunteers match this incident yet.</p>
                  )}
                  {matches.data?.map((m) => (
                    <div key={m.volunteer_id} className="flex items-center justify-between rounded border border-border/40 bg-background/40 p-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{m.display_name ?? "Volunteer"}</span>
                          <span className="mono text-[10px] rounded bg-primary/15 px-1.5 py-0.5 text-primary">{m.score}</span>
                          {m.skill_match && <span className="mono text-[9px] rounded bg-success/15 px-1.5 py-0.5 text-success">skill</span>}
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{m.reason}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => decide.mutate({ request_id: current.id, decision: "approve", volunteer_id: m.volunteer_id })}
                        disabled={decide.isPending}
                        className="ml-2"
                      >
                        Assign
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 border-t border-border/60 pt-4">
                <Button
                  onClick={() => decide.mutate({ request_id: current.id, decision: "approve" })}
                  disabled={decide.isPending}
                  className="bg-success text-background hover:bg-success/90"
                >
                  <Check className="mr-2 h-4 w-4" /> Approve (auto-assign)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => decide.mutate({ request_id: current.id, decision: "reject" })}
                  disabled={decide.isPending}
                  className="border-destructive/60 text-destructive hover:bg-destructive/10"
                >
                  <X className="mr-2 h-4 w-4" /> Reject
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm whitespace-pre-wrap">{children}</div>
    </div>
  );
}
