import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-border bg-card/70 p-4 backdrop-blur", className)}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title && <h3 className="text-sm font-semibold">{title}</h3>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
