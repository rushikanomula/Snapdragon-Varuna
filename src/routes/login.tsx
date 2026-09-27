import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Varuna" },
      { name: "description", content: "Sign in to Varuna water intelligence." },
      { property: "og:title", content: "Sign in — Varuna" },
      { property: "og:description", content: "Sign in to Varuna water intelligence." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/dashboard" });
        }}
        className="w-full max-w-sm space-y-5 rounded-xl border border-border bg-card/70 p-6 backdrop-blur"
      >
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Droplets className="h-5 w-5 text-primary" /> Varuna
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">Access your water intelligence workspace.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required placeholder="you@agency.gov" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required />
        </div>
        <Button type="submit" className="w-full">Sign in</Button>
      </form>
    </div>
  );
}
