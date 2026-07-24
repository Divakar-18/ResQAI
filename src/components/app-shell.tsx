import { Link } from "@tanstack/react-router";
import { Activity, Radio, ShieldAlert, Users2, Zap } from "lucide-react";
import { motion } from "framer-motion";

export function TopNav({ authed = false }: { authed?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="relative">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/15 ring-1 ring-primary/40">
              <ShieldAlert className="h-4 w-4 text-primary" />
            </div>
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-critical pulse-critical" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm font-bold tracking-wide">ResQAI</div>
            <div className="mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Command Center</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/report" className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/10 hover:text-foreground">
            Report Emergency
          </Link>
          <Link to="/track" className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/10 hover:text-foreground">
            Track Status
          </Link>
          {authed ? (
            <Link to="/dashboard" className="ml-2 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Open Dashboard
            </Link>
          ) : (
            <Link to="/auth" className="ml-2 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Operator Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function AppShell({ children, active }: { children: React.ReactNode; active: string }) {
  const items = [
    { to: "/dashboard", label: "Overview", icon: Activity },
    { to: "/review", label: "AI Review Queue", icon: Radio },
    { to: "/my-tasks", label: "My Tasks", icon: Users2 },
    { to: "/settings", label: "Settings", icon: Zap },
  ] as const;
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-surface-1/60 backdrop-blur md:flex md:flex-col">
        <Link to="/" className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/15 ring-1 ring-primary/40">
            <ShieldAlert className="h-4 w-4 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm font-bold">ResQAI</div>
            <div className="mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Ops</div>
          </div>
        </Link>
        <nav className="flex-1 space-y-1 p-2">
          {items.map((it) => {
            const Icon = it.icon;
            const isActive = active === it.to;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {it.label}
                {isActive && <motion.span layoutId="active-dot" className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/60 p-3 text-[10px] uppercase tracking-widest text-muted-foreground mono">
          v1 · secure link
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
