import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";


const IntentEnum = z.enum([
  "medical_emergency","flood_rescue","food_shortage","fire","shelter_needed",
  "missing_person","animal_rescue","power_failure","road_block","water_supply",
  "medical_supply","volunteer_request","donation_request","other",
]);
const PriorityEnum = z.enum(["critical","high","medium","low"]);
const DeptEnum = z.enum([
  "medical_team","fire_department","food_relief","police","ngo","volunteer_team","municipality",
]);
const SentimentEnum = z.enum(["panic","distressed","urgent","neutral"]);

const ClassificationSchema = z.object({
  intent: IntentEnum,
  priority: PriorityEnum,
  department: DeptEnum,
  sentiment: SentimentEnum,
  confidence: z.number().min(0).max(100),
  reasoning: z.string(),
  recommended_resources: z.array(z.string()).max(10).default([]),
  estimated_response_minutes: z.number().int().min(1).max(1440).nullable().default(null),
  suggested_volunteer_skill: z.string().max(60).nullable().default(null),
});

const SubmitSchema = z.object({
  citizen_name: z.string().trim().min(1).max(120),
  citizen_phone: z.string().trim().max(40).optional().or(z.literal("")),
  citizen_email: z.string().trim().max(200).optional().or(z.literal("")),
  location_text: z.string().trim().min(2).max(300),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  description: z.string().trim().min(5).max(2000),
});


const SYSTEM_PROMPT = `You are ResQAI, an emergency dispatch triage AI for a disaster relief coordination system used by NGOs and government emergency responders.

You will receive a citizen's emergency report. Classify it precisely and return ONLY JSON with these fields:
- intent: one of medical_emergency, flood_rescue, food_shortage, fire, shelter_needed, missing_person, animal_rescue, power_failure, road_block, water_supply, medical_supply, volunteer_request, donation_request, other
- priority: critical | high | medium | low
  - critical = imminent risk to life (cardiac, drowning, active fire, trapped, unconscious, severe bleeding)
  - high = urgent but stable, or affects many people (large flood, missing child, widespread outage)
  - medium = important but not immediately life-threatening (food shortage, minor injury, road blocked)
  - low = informational, donations, non-urgent volunteer signups
- department: which team should respond (medical_team, fire_department, food_relief, police, ngo, volunteer_team, municipality)
- sentiment: panic | distressed | urgent | neutral (reflects the reporter's emotional state, not the situation severity)
- confidence: 0-100 integer. Only use >=80 when the report is unambiguous and all fields are clearly determined by the text.
- reasoning: one short sentence explaining your classification.
- recommended_resources: array of 1-6 concrete resources needed (e.g. ["ambulance","paramedic","oxygen"] or ["rescue_boat","life_jackets","rope"]).
- estimated_response_minutes: integer estimated on-scene response time in minutes based on priority (critical: 5-15, high: 15-45, medium: 60-240, low: 240-720). Null if truly unknown.
- suggested_volunteer_skill: single lowercase skill tag best matched to this incident (e.g. "medical","swimming","cooking","logistics","first_aid","driving","translation"). Null if generic.

Be conservative with confidence. Ambiguous, vague, or short reports should score below 80 to trigger human review.`;

async function classifyReport(text: string, location: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");
  const model = "llama-3.3-70b-versatile";

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `LOCATION: ${location}\n\nREPORT:\n${text}` },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { ok: false as const, error: `Groq ${res.status}: ${errText.slice(0, 200)}`, model };
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return { ok: false as const, error: "Groq returned non-JSON content", model };
    }
    const result = ClassificationSchema.safeParse(parsed);
    if (!result.success) {
      return { ok: false as const, error: `Schema validation failed: ${result.error.message.slice(0, 200)}`, model };
    }
    return { ok: true as const, data: result.data, model };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false as const, error: msg, model };
  }
}


async function postToDiscord(webhookUrl: string, payload: {
  request_code: string;
  priority: string;
  intent: string;
  department: string;
  confidence: number;
  location: string;
  description: string;
}) {
  const colors: Record<string, number> = { critical: 0xff3b30, high: 0xff9500, medium: 0xffcc00, low: 0x30d158 };
  const body = {
    username: "ResQAI Dispatch",
    content: payload.priority === "critical" ? "@here Critical incident auto-dispatched" : undefined,
    embeds: [{
      title: `${payload.priority.toUpperCase()} · ${payload.intent.replaceAll("_", " ")}`,
      description: payload.description.slice(0, 500),
      color: colors[payload.priority] ?? 0x8899aa,
      fields: [
        { name: "Tracking Code", value: payload.request_code, inline: true },
        { name: "Department", value: payload.department, inline: true },
        { name: "Confidence", value: `${payload.confidence}%`, inline: true },
        { name: "Location", value: payload.location.slice(0, 200) },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "ResQAI · autonomous dispatch" },
    }],
  };
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendCriticalEmail(to: string, subject: string, html: string, text: string) {
  const apiKey = process.env.LOVABLE_API_KEY;
  const from = process.env.NOTIFY_FROM_EMAIL;
  if (!apiKey || !from) return { sent: false, reason: "missing_sender_config" as const };
  try {
    const { sendLovableEmail } = await import("@lovable.dev/email-js");
    const result = await sendLovableEmail(
      { to, from, subject, html, text, purpose: "critical_alert" },
      { apiKey },
    );
    return { sent: result.success === true, reason: result.status ?? null };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : "send_failed" };
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export const submitRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SubmitSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Insert as pending_ai (admin client so RETURNING works for anonymous submissions)
    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("requests")
      .insert({
        citizen_name: data.citizen_name,
        citizen_phone: data.citizen_phone || null,
        citizen_email: data.citizen_email || null,
        location_text: data.location_text,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        description: data.description,
        status: "pending_ai",
      })
      .select("id, request_code")
      .single();

    if (insErr || !inserted) {
      throw new Error(insErr?.message ?? "Failed to create request");
    }

    // 2. Classify with AI
    const classification = await classifyReport(data.description, data.location_text);

    if (!classification.ok) {
      await supabaseAdmin
        .from("requests")
        .update({ status: "awaiting_review", ai_model: classification.model })
        .eq("id", inserted.id);
      await supabaseAdmin.from("execution_logs").insert({
        request_id: inserted.id,
        actor_kind: "ai",
        action: "classified",
        success: false,
        details: { error: classification.error },
      });
      return { request_code: inserted.request_code, requires_review: true };
    }

    const c = classification.data;

    // 3. Load org settings
    const { data: settings } = await supabaseAdmin
      .from("org_settings")
      .select("auto_execute_threshold, discord_webhook_url, notify_email")
      .eq("id", 1)
      .maybeSingle();
    const threshold = Number(settings?.auto_execute_threshold ?? 80);
    const autoExecute = c.confidence >= threshold;

    // 4. Update request with classification (including extended AI fields)
    await supabaseAdmin
      .from("requests")
      .update({
        intent: c.intent,
        priority: c.priority,
        department: c.department,
        sentiment: c.sentiment,
        confidence: c.confidence,
        ai_reasoning: c.reasoning,
        ai_model: classification.model,
        recommended_resources: c.recommended_resources ?? [],
        estimated_response_minutes: c.estimated_response_minutes ?? null,
        suggested_volunteer_skill: c.suggested_volunteer_skill ?? null,
        status: autoExecute ? "approved" : "awaiting_review",
        auto_executed: autoExecute,
      })
      .eq("id", inserted.id);

    await supabaseAdmin.from("execution_logs").insert({
      request_id: inserted.id,
      actor_kind: "ai",
      action: "classified",
      success: true,
      details: { ...c, model: classification.model, auto_execute: autoExecute, threshold },
    });

    // 5. Auto-assign using AI-ranked matching engine
    if (autoExecute) {
      const { rankVolunteersForRequest } = await import("./matching.functions");
      const matches = await rankVolunteersForRequest(inserted.id, {
        lat: data.latitude ?? null,
        lng: data.longitude ?? null,
        requiredSkill: c.suggested_volunteer_skill,
        limit: 1,
      });
      const pick = matches[0];
      if (pick) {
        await supabaseAdmin
          .from("requests")
          .update({
            assigned_volunteer_id: pick.volunteer_id,
            assigned_at: new Date().toISOString(),
            status: "assigned",
            match_score: pick.score,
            match_reason: pick.reason,
          })
          .eq("id", inserted.id);
        await supabaseAdmin.from("execution_logs").insert({
          request_id: inserted.id,
          actor_kind: "system",
          action: "assigned",
          success: true,
          details: {
            volunteer_id: pick.volunteer_id,
            mode: "auto",
            match_score: pick.score,
            reason: pick.reason,
          },
        });
      } else {
        await supabaseAdmin.from("execution_logs").insert({
          request_id: inserted.id,
          actor_kind: "system",
          action: "assigned",
          success: false,
          details: { mode: "auto", reason: "no_eligible_volunteer" },
        });
      }


      // 6. Discord webhook for high/critical
      if (settings?.discord_webhook_url && (c.priority === "critical" || c.priority === "high")) {
        const ok = await postToDiscord(settings.discord_webhook_url, {
          request_code: inserted.request_code,
          priority: c.priority,
          intent: c.intent,
          department: c.department,
          confidence: c.confidence,
          location: data.location_text,
          description: data.description,
        });
        await supabaseAdmin.from("execution_logs").insert({
          request_id: inserted.id,
          actor_kind: "system",
          action: "notified_discord",
          success: ok,
          details: { priority: c.priority },
        });
      }

      // 7. Email alert for critical/high
      if (settings?.notify_email && (c.priority === "critical" || c.priority === "high")) {
        const subject = `[ResQAI ${c.priority.toUpperCase()}] ${c.intent.replaceAll("_", " ")} · ${inserted.request_code}`;
        const html = `<div style="font-family:system-ui,sans-serif;max-width:560px">
          <h2 style="color:#e11d48;margin:0 0 8px">${c.priority.toUpperCase()} · ${c.intent.replaceAll("_", " ")}</h2>
          <p><strong>Tracking:</strong> ${inserted.request_code}<br/>
          <strong>Department:</strong> ${c.department}<br/>
          <strong>Confidence:</strong> ${c.confidence}%<br/>
          <strong>Location:</strong> ${escapeHtml(data.location_text)}</p>
          <p style="white-space:pre-wrap;background:#f4f4f5;padding:12px;border-radius:6px">${escapeHtml(data.description)}</p>
          <p style="color:#6b7280;font-size:12px">Dispatched autonomously by ResQAI. Open the Command Center to reassign or override.</p>
        </div>`;
        const text = `${c.priority.toUpperCase()} · ${c.intent}\nTracking: ${inserted.request_code}\nLocation: ${data.location_text}\n\n${data.description}`;
        const emailResult = await sendCriticalEmail(settings.notify_email, subject, html, text);
        await supabaseAdmin.from("execution_logs").insert({
          request_id: inserted.id,
          actor_kind: "system",
          action: "notified_email",
          success: emailResult.sent,
          details: { priority: c.priority, to: settings.notify_email, reason: emailResult.reason },
        });
      }
    }

    return { request_code: inserted.request_code, requires_review: !autoExecute };
  });

export const getRequestByCode = createServerFn({ method: "GET" })
  .inputValidator((code: unknown) => z.string().min(1).max(40).parse(code))
  .handler(async ({ data: code }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("requests")
      .select("request_code, citizen_name, location_text, description, intent, priority, department, sentiment, confidence, status, created_at, assigned_at, completed_at")
      .eq("request_code", code)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });
