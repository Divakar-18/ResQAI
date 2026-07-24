import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type OrgUpdate = Database["public"]["Tables"]["org_settings"]["Update"];

export const updateOrgSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      discord_webhook_url: z.string().url().max(500).nullable().optional(),
      notify_email: z.string().email().max(200).nullable().optional(),
      auto_execute_threshold: z.number().min(0).max(100).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId, _role: "admin",
    });
    if (error || !isAdmin) throw new Error("Forbidden: admin only");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: OrgUpdate = { updated_by: context.userId, updated_at: new Date().toISOString() };
    if (data.discord_webhook_url !== undefined) patch.discord_webhook_url = data.discord_webhook_url;
    if (data.notify_email !== undefined) patch.notify_email = data.notify_email;
    if (data.auto_execute_threshold !== undefined) patch.auto_execute_threshold = data.auto_execute_threshold;
    const { error: upErr } = await supabaseAdmin.from("org_settings").update(patch).eq("id", 1);
    if (upErr) throw new Error(upErr.message);
    return { ok: true };
  });

export const grantRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      user_id: z.string().uuid(),
      role: z.enum(["volunteer", "coordinator", "admin"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden: admin only");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.user_id, role: data.role });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      display_name: z.string().trim().min(1).max(120).optional(),
      phone: z.string().trim().max(40).optional().or(z.literal("")),
      skills: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
      is_available: z.boolean().optional(),
      latitude: z.number().min(-90).max(90).nullable().optional(),
      longitude: z.number().min(-180).max(180).nullable().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
    const patch: ProfileUpdate = { updated_at: new Date().toISOString() };
    if (data.display_name !== undefined) patch.display_name = data.display_name;
    if (data.phone !== undefined) patch.phone = data.phone || null;
    if (data.skills !== undefined) patch.skills = data.skills;
    if (data.is_available !== undefined) patch.is_available = data.is_available;
    if (data.latitude !== undefined) patch.latitude = data.latitude;
    if (data.longitude !== undefined) patch.longitude = data.longitude;
    const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

