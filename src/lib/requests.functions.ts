import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const StatusEnum = z.enum([
  "pending_ai","awaiting_review","approved","assigned","in_progress","completed","rejected","cancelled",
]);

type RequestUpdate = Database["public"]["Tables"]["requests"]["Update"];

export const reviewDecision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      request_id: z.string().uuid(),
      decision: z.enum(["approve", "reject"]),
      volunteer_id: z.string().uuid().optional().nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("Forbidden: staff only");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.decision === "reject") {
      await supabaseAdmin.from("requests").update({
        status: "rejected",
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      } satisfies RequestUpdate).eq("id", data.request_id);
      await supabaseAdmin.from("execution_logs").insert({
        request_id: data.request_id, actor_id: context.userId, actor_kind: "coordinator",
        action: "rejected", success: true, details: {},
      });
      return { ok: true };
    }
    const update: RequestUpdate = {
      status: data.volunteer_id ? "assigned" : "approved",
      reviewed_by: context.userId,
      reviewed_at: new Date().toISOString(),
    };
    if (data.volunteer_id) {
      update.assigned_volunteer_id = data.volunteer_id;
      update.assigned_at = new Date().toISOString();
    }
    await supabaseAdmin.from("requests").update(update).eq("id", data.request_id);
    await supabaseAdmin.from("execution_logs").insert({
      request_id: data.request_id, actor_id: context.userId, actor_kind: "coordinator",
      action: "approved", success: true, details: { volunteer_id: data.volunteer_id ?? null },
    });
    return { ok: true };
  });

export const assignVolunteer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      request_id: z.string().uuid(),
      volunteer_id: z.string().uuid(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("Forbidden: staff only");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("requests").update({
      assigned_volunteer_id: data.volunteer_id,
      assigned_at: new Date().toISOString(),
      status: "assigned",
    } satisfies RequestUpdate).eq("id", data.request_id);
    await supabaseAdmin.from("execution_logs").insert({
      request_id: data.request_id, actor_id: context.userId, actor_kind: "coordinator",
      action: "assigned", success: true, details: { volunteer_id: data.volunteer_id, mode: "manual" },
    });
    return { ok: true };
  });

export const updateRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      request_id: z.string().uuid(),
      status: StatusEnum,
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch: RequestUpdate = { status: data.status };
    if (data.status === "completed") patch.completed_at = new Date().toISOString();
    const { error } = await context.supabase
      .from("requests")
      .update(patch)
      .eq("id", data.request_id);
    if (error) throw new Error(error.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // On completion: bump volunteer completed_count as a real performance signal.
    if (data.status === "completed") {
      const { data: req } = await supabaseAdmin
        .from("requests")
        .select("assigned_volunteer_id, assigned_at, completed_at")
        .eq("id", data.request_id)
        .maybeSingle();
      if (req?.assigned_volunteer_id) {
        const { data: prof } = await supabaseAdmin
          .from("profiles")
          .select("completed_count, performance_score")
          .eq("id", req.assigned_volunteer_id)
          .maybeSingle();
        if (prof) {
          // Bump completed count; nudge performance score toward 100 (asymptotic).
          const newCount = (prof.completed_count ?? 0) + 1;
          const cur = prof.performance_score ?? 75;
          const newScore = Math.min(100, Math.round(cur + Math.max(0, (100 - cur) * 0.05)));
          await supabaseAdmin
            .from("profiles")
            .update({ completed_count: newCount, performance_score: newScore })
            .eq("id", req.assigned_volunteer_id);
        }
      }
    }

    await supabaseAdmin.from("execution_logs").insert({
      request_id: data.request_id, actor_id: context.userId, actor_kind: "volunteer",
      action: "status_changed", success: true, details: { status: data.status },
    });
    return { ok: true };
  });

