export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold md:text-2xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-sub">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function ComingSoon({ phase, children }: { phase: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white p-6 text-sm text-sub">
      <p className="mb-1 font-semibold text-ink">{phase}で実装します</p>
      {children}
    </div>
  );
}
