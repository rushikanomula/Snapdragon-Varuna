export function PagePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-lg border border-border bg-card/60" />
        ))}
      </div>
      <div className="h-72 rounded-lg border border-dashed border-border bg-card/40" />
    </div>
  );
}
