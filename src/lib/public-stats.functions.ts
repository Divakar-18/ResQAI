import { createServerFn } from "@tanstack/react-start";

/**
 * Public, anonymous aggregate stats for the landing page.
 * Returns ONLY counts + a few obfuscated recent items — never PII.
 */
export const getPublicStats = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [total, today, autoToday, review, critical, recent, volunteers] = await Promise.all([
    supabaseAdmin.from("requests").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("requests").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabaseAdmin
      .from("requests")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since)
      .eq("auto_executed", true),
    supabaseAdmin
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "awaiting_review"),
    supabaseAdmin
      .from("requests")
      .select("id", { count: "exact", head: true })
      .in("priority", ["critical", "high"])
      .gte("created_at", since),
    supabaseAdmin
      .from("requests")
      .select("request_code, intent, priority, confidence, status, department, auto_executed, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabaseAdmin.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "volunteer"),
  ]);

  return {
    totals: {
      all: total.count ?? 0,
      today: today.count ?? 0,
      autoDispatchedToday: autoToday.count ?? 0,
      inReview: review.count ?? 0,
      criticalToday: critical.count ?? 0,
      volunteers: volunteers.count ?? 0,
    },
    recent: (recent.data ?? []).map((r) => ({
      code: r.request_code,
      intent: (r.intent ?? "unclassified") as string,
      priority: (r.priority ?? "medium") as "critical" | "high" | "medium" | "low",
      confidence: Number(r.confidence ?? 0),
      status: (r.status ?? "queued") as string,
      department: (r.department ?? "unassigned") as string,
      autoExecuted: !!r.auto_executed,
      createdAt: r.created_at,
    })),
    generatedAt: new Date().toISOString(),
  };
});
