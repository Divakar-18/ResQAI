import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { TopNav } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/track/")({
  head: () => ({
    meta: [
      { title: "Track Emergency Report — ResQAI" },
      { name: "description", content: "Look up the live status of your ResQAI emergency report using its tracking code." },
    ],
  }),
  component: TrackIndex,
});

function TrackIndex() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto max-w-xl px-4 py-14">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="font-display text-3xl font-bold">Track your report</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter the tracking code shown after you submitted your report.</p>
        <form
          className="glass mt-6 flex gap-2 rounded-xl p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim()) navigate({ to: "/track/$code", params: { code: code.trim().toUpperCase() } });
          }}
        >
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="REQ-XXXXX" className="mono uppercase" />
          <Button type="submit">
            <Search className="mr-2 h-4 w-4" /> Track
          </Button>
        </form>
      </div>
    </div>
  );
}
