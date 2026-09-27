import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Cpu, Droplets, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useNpuStatus } from "@/hooks/use-npu-status";
import { navItems } from "./nav-items";
import { useAppStore } from "@/stores/app-store";

const STORAGE_KEY = "varuna.sidebar.collapsed";

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1 p-2">
      {navItems.map((item) => {
        const active = path === item.url || path.startsWith(item.url + "/");
        return (
          <Link
            key={item.url}
            to={item.url}
            onClick={onNavigate}
            title={collapsed ? item.title : undefined}
            className={cn(
              "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
              active
                ? "bg-primary/15 text-primary border-l-2 border-primary"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.title}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function NpuPill() {
  const { mode, latency } = useNpuStatus();
  const active = mode === "npu" || mode === "gpu";
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs",
        active ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground",
      )}
    >
      <span className="relative flex h-2 w-2">
        {active && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", active ? "bg-primary" : "bg-muted-foreground")} />
      </span>
      <Cpu className="hidden h-3.5 w-3.5 sm:block" />
      {mode === "detecting" ? "Detecting…" : active ? <>{mode.toUpperCase()} Active {latency !== null && <span className="text-foreground">{latency}ms</span>}</> : <>CPU Mode {latency !== null && <span className="text-foreground">{latency}ms</span>}</>}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const title = navItems.find((i) => path.startsWith(i.url))?.title ?? "Varuna";

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    void useAppStore.persist.rehydrate();
  }, []);
  const toggle = () => {
    setCollapsed((c) => {
      localStorage.setItem(STORAGE_KEY, c ? "0" : "1");
      return !c;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-3 backdrop-blur-md">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-2 text-muted-foreground hover:bg-accent md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          onClick={toggle}
          className="hidden rounded-md p-2 text-muted-foreground hover:bg-accent md:block"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
          <Droplets className="h-5 w-5 text-primary" />
          <span className="hidden sm:inline">Varuna</span>
        </Link>
        <span className="hidden text-border md:inline">/</span>
        <h1 className="truncate text-sm font-medium text-muted-foreground">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <NpuPill />
          <button className="relative rounded-md p-2 text-muted-foreground hover:bg-accent" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          </button>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-secondary text-xs">VA</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-14 z-30 hidden border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:block",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <NavList collapsed={collapsed} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 bg-sidebar p-0 pt-12">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <NavList collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className={cn("pt-14 transition-[padding] duration-200", collapsed ? "md:pl-16" : "md:pl-60")}>
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
