import { createFileRoute, Link } from "@tanstack/react-router";
import { Cpu, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Varuna — On-Device AI Water Intelligence" },
      { name: "description", content: "NPU-accelerated water-quality analysis, forecasting and anomaly detection on Snapdragon PCs." },
      { property: "og:title", content: "Varuna — On-Device AI Water Intelligence" },
      { property: "og:description", content: "NPU-accelerated water-quality analysis, forecasting and anomaly detection." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 font-semibold"><Droplets className="h-5 w-5 text-primary" /> Varuna</div>
        <Button asChild variant="ghost" size="sm"><Link to="/login">Sign in</Link></Button>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
          <Cpu className="h-3.5 w-3.5" /> Snapdragon X Elite · Qualcomm AI Hub
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">Water intelligence, computed at the edge.</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">Real-time quality analysis, hydrological forecasting and anomaly detection running locally on your NPU.</p>
        <div className="mt-8 flex gap-3">
          <Button asChild><Link to="/dashboard">Get started</Link></Button>
          <Button asChild variant="outline"><Link to="/login">Sign in</Link></Button>
        </div>
      </main>
    </div>
  );
}
