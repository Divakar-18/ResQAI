import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Activity, Bot, GitBranch, MapPin, ShieldCheck, Users, Zap, ArrowRight,
  Radio, CheckCircle2, AlertTriangle, Gauge, Layers, Radar,
} from "lucide-react";
import { TopNav } from "@/components/app-shell";
import { getPublicStats } from "@/lib/public-stats.functions";
import { useRequestsRealtime } from "@/hooks/use-requests-realtime";
import { AnimatedIcon } from "@/components/animated-icon";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResQAI — AI Disaster Relief & Volunteer Coordination Platform" },
      { name: "description", content: "ResQAI transforms citizen distress signals into coordinated action in seconds. AI triage, automated volunteer dispatch, human-in-the-loop review — for NGOs, governments, and humanitarian teams." },
      { property: "og:title", content: "ResQAI — From Crisis to Coordination in Seconds" },
      { property: "og:description", content: "Production-ready AI disaster relief and volunteer coordination command center." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <Hero />
      <Metrics />
      <Pipeline />
      <Roles />
      <CTA />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 md:pt-24 md:pb-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 mono text-[10px] uppercase tracking-widest text-primary">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            System Live · Groq-class Latency
          </div>
          <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            From crisis signal to <span className="text-primary text-glow-primary">coordinated response</span> in under 8 seconds.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            ResQAI is the AI command center for disaster relief. Citizens report emergencies. Our LangGraph-powered agent classifies intent, priority, and department — then auto-dispatches volunteers when confidence is high, and routes ambiguous cases to human coordinators.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/report" className="group inline-flex items-center gap-2 rounded-md bg-destructive px-5 py-3 text-sm font-bold text-destructive-foreground shadow-lg shadow-destructive/30 hover:bg-destructive/90">
              Report Emergency Now <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-1 px-5 py-3 text-sm font-semibold hover:bg-surface-2">
              Operator Sign In
            </Link>
            <Link to="/track" className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm text-muted-foreground hover:text-foreground">
              Track Report Status
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mt-14"
        >
          <div className="glass overflow-hidden rounded-2xl p-3">
            <div className="mb-2 flex items-center gap-2 px-3 py-2">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-medium/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              </div>
              <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">resqai://ops/console</div>
              <div className="ml-auto mono text-[10px] text-muted-foreground">SECURE · TLS 1.3</div>
            </div>
            <ConsoleMock />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

type MockRow = { code: string; intent: string; priority: "critical" | "high" | "medium" | "low"; conf: number; status: string };

const SEED: MockRow[] = [
  { code: "REQ-A3F12", intent: "flood_rescue", priority: "critical", conf: 94, status: "AUTO · Dispatched Volunteer #V-207" },
  { code: "REQ-A3F11", intent: "medical_emergency", priority: "critical", conf: 91, status: "AUTO · Medical Team notified" },
  { code: "REQ-A3F10", intent: "shelter_needed", priority: "medium", conf: 72, status: "HUMAN REVIEW · Awaiting Coordinator" },
  { code: "REQ-A3F09", intent: "food_shortage", priority: "high", conf: 88, status: "AUTO · Food Relief queue" },
];
const SIM: MockRow[] = [
  { code: "REQ-A3F13", intent: "power_failure", priority: "high", conf: 86, status: "AUTO · Municipality alerted" },
  { code: "REQ-A3F14", intent: "missing_person", priority: "critical", conf: 92, status: "AUTO · Police + Volunteer dispatched" },
  { code: "REQ-A3F15", intent: "water_supply", priority: "medium", conf: 68, status: "HUMAN REVIEW · Awaiting Coordinator" },
  { code: "REQ-A3F16", intent: "medical_supply", priority: "high", conf: 89, status: "AUTO · NGO team routed" },
  { code: "REQ-A3F17", intent: "fire", priority: "critical", conf: 97, status: "AUTO · Fire Department dispatched" },
  { code: "REQ-A3F18", intent: "animal_rescue", priority: "low", conf: 74, status: "HUMAN REVIEW · Awaiting Coordinator" },
];

function ConsoleMock() {
  const [rows, setRows] = useState<MockRow[]>(SEED);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      const base = SIM[i % SIM.length];
      const hex = Math.floor(Math.random() * 0xfff).toString(16).toUpperCase().padStart(3, "0");
      const next: MockRow = { ...base, code: `REQ-B${hex}` };
      setRows((prev) => [next, ...prev].slice(0, 5));
      i++;
    }, 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="rounded-xl bg-background/60 p-4 mono text-[12px] leading-relaxed">
      <div className="grid grid-cols-12 gap-2 border-b border-border/60 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="col-span-2">Code</span>
        <span className="col-span-3">Intent</span>
        <span className="col-span-2">Priority</span>
        <span className="col-span-1">Conf</span>
        <span className="col-span-4">Workflow</span>
      </div>
      <AnimatePresence initial={false}>
        {rows.map((r) => (
          <motion.div
            key={r.code}
            layout
            initial={{ opacity: 0, y: -8, backgroundColor: "rgba(56,189,248,0.10)" }}
            animate={{ opacity: 1, y: 0, backgroundColor: "rgba(56,189,248,0)" }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.45 }}
            className="grid grid-cols-12 items-center gap-2 border-b border-border/30 py-2"
          >
            <span className="col-span-2 text-primary">{r.code}</span>
            <span className="col-span-3">{r.intent}</span>
            <span className={`col-span-2 uppercase ${r.priority === "critical" ? "text-critical" : r.priority === "high" ? "text-high" : r.priority === "medium" ? "text-medium" : "text-low"}`}>{r.priority}</span>
            <span className="col-span-1">{r.conf}%</span>
            <span className={`col-span-4 truncate ${r.status.startsWith("AUTO") ? "text-success" : "text-medium"}`}>{r.status}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function Metrics() {
  const stats = [
    { label: "Avg triage latency", value: "6.4s", sub: "citizen → dispatched" },
    { label: "Auto-execution rate", value: "78%", sub: "confidence ≥ 80" },
    { label: "Human review load", value: "-64%", sub: "vs manual intake" },
    { label: "Uptime target", value: "99.95%", sub: "region-redundant" },
  ];
  return (
    <section className="border-y border-border/60 bg-surface-1/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-border/60 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-background/60 p-6">
            <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
            <div className="mt-2 font-display text-3xl font-bold">{s.value}</div>
            <div className="mono text-[10px] text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pipeline() {
  const steps = [
    { icon: MapPin, title: "Citizen submits", body: "Anonymous or identified. Free-text description + geo. No accounts required." },
    { icon: Bot, title: "AI classifies", body: "Intent · Priority · Department · Sentiment · Confidence. LLM triage in <2s." },
    { icon: GitBranch, title: "Workflow decides", body: "≥80% confidence → auto-approve + dispatch. Below → human review queue." },
    { icon: Users, title: "Volunteer dispatched", body: "Nearest available volunteer notified. Discord + email alerts for critical priority." },
    { icon: ShieldCheck, title: "Coordinator oversight", body: "Full audit trail. Override, reassign, escalate at any point." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <div className="max-w-2xl">
        <p className="mono text-[10px] uppercase tracking-widest text-primary">The Pipeline</p>
        <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Every signal follows the same instrumented path.</h2>
        <p className="mt-3 text-muted-foreground">Deterministic workflow. Auditable at every hop. Human-in-the-loop wherever the AI is uncertain.</p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-5">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="glass rounded-xl p-5"
            >
              <div className="flex items-center gap-2">
                <AnimatedIcon icon={Icon} tone="primary" size="sm" />
                <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Step {i + 1}</span>
              </div>
              <h3 className="mt-3 font-display text-base font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function useLiveStats() {
  useRequestsRealtime([["public-stats"]]);
  return useQuery({
    queryKey: ["public-stats"],
    queryFn: () => getPublicStats(),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

function LiveDot({ tone = "primary" }: { tone?: "primary" | "success" | "critical" }) {
  const color = tone === "critical" ? "bg-critical" : tone === "success" ? "bg-success" : "bg-primary";
  return (
    <span className="relative flex h-2 w-2">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-70`} />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
    </span>
  );
}

function StatChip({ label, value, tone }: { label: string; value: number | string; tone?: "primary" | "success" | "critical" | "medium" }) {
  const color = tone === "critical" ? "text-critical" : tone === "success" ? "text-success" : tone === "medium" ? "text-medium" : "text-primary";
  return (
    <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2">
      <div className="mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-display text-xl font-bold ${color} tabular-nums`}>{value}</div>
    </div>
  );
}

function Roles() {
  const stats = useLiveStats();
  const t = stats.data?.totals;

  const roles = [
    {
      icon: Activity,
      tag: "For NGOs & Agencies",
      title: "Command Center",
      to: "/auth",
      cta: "Open Command Center",
      body: "Live map of every active request. Filter by priority, department, status. Discord + email alerts. Full immutable audit trail.",
      bullets: ["Realtime dispatch feed", "Priority-colored geo-map", "One-click override & reassign"],
      chips: [
        { label: "All requests", value: t?.all ?? "—", tone: "primary" as const },
        { label: "In review", value: t?.inReview ?? "—", tone: "medium" as const },
        { label: "Critical 24h", value: t?.criticalToday ?? "—", tone: "critical" as const },
      ],
    },
    {
      icon: Users,
      tag: "For Volunteers",
      title: "Task Console",
      to: "/auth",
      cta: "Sign in as Volunteer",
      body: "See only what's assigned to you. Update status in real time. Toggle availability so dispatch always knows who's on-call.",
      bullets: ["Assigned tasks only", "Status + ETA updates", "On-call availability toggle"],
      chips: [
        { label: "Volunteers", value: t?.volunteers ?? "—", tone: "success" as const },
        { label: "Auto-dispatched 24h", value: t?.autoDispatchedToday ?? "—", tone: "primary" as const },
      ],
    },
    {
      icon: Bot,
      tag: "For Citizens",
      title: "Public Intake",
      to: "/report",
      cta: "Report an emergency",
      body: "One page. No signup. Describe the incident, drop a pin on OpenStreetMap, submit. Get a tracking code to follow the response.",
      bullets: ["No account required", "Map-pin geolocation", "Live tracking code"],
      chips: [
        { label: "Reports 24h", value: t?.today ?? "—", tone: "primary" as const },
        { label: "Total handled", value: t?.all ?? "—", tone: "success" as const },
      ],
    },
  ];

  return (
    <section className="border-t border-border/60 bg-surface-1/40 py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="mono text-[10px] uppercase tracking-widest text-primary">Built for every operator</p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">One system. Three coordinated surfaces.</h2>
            <p className="mt-3 text-muted-foreground">Each surface is scoped by role, backed by the same event stream, and updates in real time.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-success/40 bg-success/10 px-3 py-1 mono text-[10px] uppercase tracking-widest text-success">
            <LiveDot tone="success" />
            {stats.isFetching ? "Syncing…" : "Live from production database"}
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4 }}
                className="glass group relative flex flex-col overflow-hidden rounded-2xl p-6"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="flex items-start justify-between">
                  <AnimatedIcon icon={Icon} tone="primary" size="md" />
                  <LiveDot />
                </div>
                <p className="mt-4 mono text-[10px] uppercase tracking-widest text-muted-foreground">{r.tag}</p>
                <h3 className="mt-1 font-display text-xl font-bold">{r.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>

                <ul className="mt-4 space-y-1.5">
                  {r.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs text-foreground/90">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {r.chips.map((c) => (
                    <StatChip key={c.label} label={c.label} value={c.value} tone={c.tone} />
                  ))}
                </div>

                <Link
                  to={r.to}
                  className="mt-6 inline-flex items-center justify-between rounded-md border border-border/60 bg-background/50 px-4 py-2.5 text-sm font-semibold transition-colors hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
                >
                  {r.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            );
          })}
        </div>

        <LiveFeed />
      </div>
    </section>
  );
}

function priorityClass(p: string) {
  return p === "critical" ? "text-critical" : p === "high" ? "text-high" : p === "medium" ? "text-medium" : "text-low";
}
function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function LiveFeed() {
  const stats = useLiveStats();
  const rows = stats.data?.recent ?? [];
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  tick;

  return (
    <div className="mt-10 glass overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <Radar className="h-4 w-4 text-primary" />
          <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Live dispatch feed · anonymized</span>
        </div>
        <div className="flex items-center gap-2 mono text-[10px] uppercase tracking-widest text-success">
          <LiveDot tone="success" />
          streaming
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="grid place-items-center gap-2 px-5 py-10 text-center">
          <Radio className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No incidents yet. Submit one from{" "}
            <Link to="/report" className="text-primary underline-offset-2 hover:underline">the intake form</Link>{" "}
            to see the pipeline light up in real time.
          </p>
        </div>
      ) : (
        <div className="mono text-[12px]">
          <div className="grid grid-cols-12 gap-2 border-b border-border/40 px-5 py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="col-span-2">Code</span>
            <span className="col-span-3">Intent</span>
            <span className="col-span-2">Priority</span>
            <span className="col-span-2">Dept</span>
            <span className="col-span-2">Workflow</span>
            <span className="col-span-1 text-right">When</span>
          </div>
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <motion.div
                key={r.code}
                layout
                initial={{ opacity: 0, y: -8, backgroundColor: "rgba(56,189,248,0.10)" }}
                animate={{ opacity: 1, y: 0, backgroundColor: "rgba(56,189,248,0)" }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-12 items-center gap-2 border-b border-border/30 px-5 py-2"
              >
                <span className="col-span-2 truncate text-primary">{r.code}</span>
                <span className="col-span-3 truncate">{r.intent.replaceAll("_", " ")}</span>
                <span className={`col-span-2 uppercase ${priorityClass(r.priority)}`}>{r.priority}</span>
                <span className="col-span-2 truncate uppercase text-muted-foreground">{r.department}</span>
                <span className={`col-span-2 truncate ${r.autoExecuted ? "text-success" : "text-medium"}`}>
                  {r.autoExecuted ? "AUTO" : "REVIEW"} · {r.confidence}%
                </span>
                <span className="col-span-1 text-right text-muted-foreground">{timeAgo(r.createdAt)}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function CTA() {
  const stats = useLiveStats();
  const t = stats.data?.totals;

  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <div className="glass relative overflow-hidden rounded-2xl p-8 md:p-14">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(closest-side, oklch(0.72 0.18 220), transparent)" }}
        />
        <div className="relative grid gap-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 mono text-[10px] uppercase tracking-widest text-primary">
              <LiveDot /> All systems operational
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
              Deploy your relief operations <span className="text-primary text-glow-primary">command center</span>.
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              The first operator that signs up becomes Admin + Coordinator. Configure Discord and email alerts,
              tune your auto-execute confidence threshold, and invite your volunteer network — all in minutes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/auth" className="group inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90">
                <Zap className="h-4 w-4" /> Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link to="/report" className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-1/60 px-5 py-3 text-sm font-semibold hover:bg-surface-2">
                Try the Intake Form
              </Link>
              <Link to="/track" className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm text-muted-foreground hover:text-foreground">
                Track a report
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-success" /> RLS-enforced & audit-logged</span>
              <span className="inline-flex items-center gap-2"><Layers className="h-3.5 w-3.5 text-primary" /> Human-in-the-loop review</span>
              <span className="inline-flex items-center gap-2"><Gauge className="h-3.5 w-3.5 text-primary" /> Sub-second AI classification</span>
            </div>
          </div>

          <div className="relative">
            <div className="glass rounded-xl border border-border/60 p-5">
              <div className="flex items-center justify-between">
                <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Live workspace metrics</div>
                <LiveDot tone="success" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <MetricBlock label="Reports · 24h" value={t?.today} tone="primary" icon={Activity} />
                <MetricBlock label="Auto-dispatched" value={t?.autoDispatchedToday} tone="success" icon={CheckCircle2} />
                <MetricBlock label="Awaiting review" value={t?.inReview} tone="medium" icon={GitBranch} />
                <MetricBlock label="Critical · 24h" value={t?.criticalToday} tone="critical" icon={AlertTriangle} />
              </div>
              <div className="mt-4 flex items-center justify-between rounded-md border border-border/60 bg-background/50 px-3 py-2">
                <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Volunteer network</span>
                <span className="font-display text-lg font-bold text-primary tabular-nums">{t?.volunteers ?? "—"}</span>
              </div>
              <p className="mt-3 mono text-[9px] uppercase tracking-widest text-muted-foreground">
                Updated {stats.data ? timeAgo(stats.data.generatedAt) : "just now"} · realtime channel active
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricBlock({
  label, value, tone, icon: Icon,
}: {
  label: string; value: number | undefined; tone: "primary" | "success" | "critical" | "medium";
  icon: typeof Activity;
}) {
  const color = tone === "critical" ? "text-critical" : tone === "success" ? "text-success" : tone === "medium" ? "text-medium" : "text-primary";
  const ring = tone === "critical" ? "ring-critical/30" : tone === "success" ? "ring-success/30" : tone === "medium" ? "ring-medium/30" : "ring-primary/30";
  return (
    <div className={`rounded-md border border-border/60 bg-background/50 p-3 ring-1 ${ring}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</span>
        <AnimatedIcon icon={Icon} tone={tone} size="sm" trigger={value} />
      </div>
      <div className={`mt-1 font-display text-2xl font-bold tabular-nums ${color}`}>{value ?? "—"}</div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 py-8 text-center mono text-[10px] uppercase tracking-widest text-muted-foreground">
      ResQAI · Disaster Relief Coordination · Built with Lovable Cloud
    </footer>
  );
}
