export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>{eyebrow ? <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</p> : null}<h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>{description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p> : null}</div>
      {action ? <div className="w-full [&>*]:w-full sm:w-auto sm:[&>*]:w-auto">{action}</div> : null}
    </header>
  );
}
