import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw } from "lucide-react";

import { TopNav } from "@/components/app-shell";
import { PriorityBadge, StatusBadge } from "@/components/priority-badge";
import { Button } from "@/components/ui/button";
import { getRequestByCode } from "@/lib/classify.functions";

export const Route = createFileRoute("/track/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Report ${params.code} — ResQAI` },
      { name: "description", content: "Live status of your ResQAI emergency report." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrackDetail,
});

function TrackDetail() {
  const { code } = Route.useParams();
  const q = useQuery({
    queryKey: ["track", code],
    queryFn: () => getRequestByCode({ data: code }),
    refetchInterval: 15_000,
  });

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/track" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Search another
        </Link>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Tracking code</p>
            <h1 className="font-display text-3xl font-bold text-primary">{code}</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => q.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        {q.isLoading ? (
          <div className="glass rounded-2xl p-8 text-center text-muted-foreground">Loading…</div>
        ) : !q.data ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="font-display text-lg font-semibold">Report not found</p>
            <p className="mt-2 text-sm text-muted-foreground">Double-check the tracking code and try again.</p>
          </div>
        ) : (
          <div className="glass space-y-6 rounded-2xl p-6">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={q.data.status} />
              <PriorityBadge priority={q.data.priority} />
              {q.data.confidence != null && (
                <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  AI confidence · {q.data.confidence}%
                </span>
              )}
            </div>

            <Field label="Reporter">{q.data.citizen_name}</Field>
            <Field label="Location">{q.data.location_text}</Field>
            <Field label="Description">{q.data.description}</Field>

            {q.data.intent && <Field label="Detected intent">{q.data.intent.replaceAll("_", " ")}</Field>}
            {q.data.department && <Field label="Routed to">{q.data.department.replaceAll("_", " ")}</Field>}

            <div className="grid grid-cols-2 gap-4 border-t border-border/60 pt-4 mono text-[11px] text-muted-foreground">
              <div>
                <div className="text-[9px] uppercase tracking-widest">Submitted</div>
                <div>{new Date(q.data.created_at).toLocaleString()}</div>
              </div>
              {q.data.assigned_at && (
                <div>
                  <div className="text-[9px] uppercase tracking-widest">Assigned</div>
                  <div>{new Date(q.data.assigned_at).toLocaleString()}</div>
                </div>
              )}
              {q.data.completed_at && (
                <div>
                  <div className="text-[9px] uppercase tracking-widest">Completed</div>
                  <div>{new Date(q.data.completed_at).toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm text-foreground whitespace-pre-wrap">{children}</div>
    </div>
  );
}
