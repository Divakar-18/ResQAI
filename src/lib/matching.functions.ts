import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Haversine distance in km
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type VolunteerMatch = {
  volunteer_id: string;
  display_name: string | null;
  score: number;
  distance_km: number | null;
  workload: number;
  performance: number;
  skill_match: boolean;
  reason: string;
};

/**
 * AI-assisted volunteer matching engine.
 * Ranks available volunteers by weighted composite of:
 *   - distance (35%)  · closest wins
 *   - skill match (25%) · exact skill == recommended skill
 *   - performance (20%) · historical rating 0-100
 *   - workload (20%) · fewer active assignments wins
 * Returns top N ranked matches with human-readable reasoning.
 */
export async function rankVolunteersForRequest(
  requestId: string,
  opts: {
    lat?: number | null;
    lng?: number | null;
    requiredSkill?: string | null;
    limit?: number;
  } = {},
): Promise<VolunteerMatch[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // 1. Available volunteers with volunteer role
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, skills, latitude, longitude, performance_score, is_available")
    .eq("is_available", true);
  if (!profiles || profiles.length === 0) return [];

  const ids = profiles.map((p) => p.id);
  const { data: roleRows } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "volunteer")
    .in("user_id", ids);
  const volSet = new Set(roleRows?.map((r) => r.user_id) ?? []);
  const eligible = profiles.filter((p) => volSet.has(p.id));
  if (eligible.length === 0) return [];

  // 2. Current workload (active assigned/in_progress per volunteer)
  const { data: workloadRows } = await supabaseAdmin
    .from("requests")
    .select("assigned_volunteer_id")
    .in("assigned_volunteer_id", eligible.map((p) => p.id))
    .in("status", ["assigned", "in_progress"]);
  const workload = new Map<string, number>();
  for (const w of workloadRows ?? []) {
    if (!w.assigned_volunteer_id) continue;
    workload.set(w.assigned_volunteer_id, (workload.get(w.assigned_volunteer_id) ?? 0) + 1);
  }

  // 3. Score
  const maxDist = 50; // km cutoff for full distance penalty
  const scored: VolunteerMatch[] = eligible.map((p) => {
    let dist: number | null = null;
    let distScore = 0.5; // neutral if unknown
    if (
      opts.lat != null && opts.lng != null &&
      p.latitude != null && p.longitude != null
    ) {
      dist = distanceKm(opts.lat, opts.lng, Number(p.latitude), Number(p.longitude));
      distScore = Math.max(0, 1 - Math.min(dist, maxDist) / maxDist);
    }

    const skills = (p.skills ?? []) as string[];
    const skillMatch = !!(opts.requiredSkill && skills.some((s) => s.toLowerCase() === opts.requiredSkill!.toLowerCase()));
    const skillScore = skillMatch ? 1 : opts.requiredSkill ? 0.2 : 0.6;

    const perf = Math.max(0, Math.min(100, p.performance_score ?? 75)) / 100;

    const load = workload.get(p.id) ?? 0;
    const loadScore = Math.max(0, 1 - Math.min(load, 5) / 5);

    const composite = distScore * 0.35 + skillScore * 0.25 + perf * 0.2 + loadScore * 0.2;
    const score = Math.round(composite * 100);

    const reasons: string[] = [];
    if (dist != null) reasons.push(`${dist.toFixed(1)}km away`);
    if (skillMatch) reasons.push(`skill match: ${opts.requiredSkill}`);
    else if (opts.requiredSkill) reasons.push(`no ${opts.requiredSkill} skill`);
    reasons.push(`${load} active task${load === 1 ? "" : "s"}`);
    reasons.push(`${p.performance_score ?? 75}% rating`);

    return {
      volunteer_id: p.id,
      display_name: p.display_name,
      score,
      distance_km: dist,
      workload: load,
      performance: p.performance_score ?? 75,
      skill_match: skillMatch,
      reason: reasons.join(" · "),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, opts.limit ?? 5);
}

export const getVolunteerMatches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ request_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("Forbidden: staff only");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: req } = await supabaseAdmin
      .from("requests")
      .select("latitude, longitude, suggested_volunteer_skill")
      .eq("id", data.request_id)
      .maybeSingle();
    if (!req) throw new Error("Request not found");
    return rankVolunteersForRequest(data.request_id, {
      lat: req.latitude != null ? Number(req.latitude) : null,
      lng: req.longitude != null ? Number(req.longitude) : null,
      requiredSkill: req.suggested_volunteer_skill,
      limit: 5,
    });
  });
