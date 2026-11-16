import { cn } from "@/lib/utils";
import { STATUS_LABELS, initials } from "@/lib/format";
import { Loader2, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("uz-card overflow-hidden", className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="font-display text-[0.98rem] font-semibold">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

const TONES: Record<string, string> = {
  emerald: "border-emerald-200/70 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200/70 bg-amber-50 text-amber-700",
  rose: "border-rose-200/70 bg-rose-50 text-rose-700",
  indigo: "border-indigo-200/70 bg-indigo-50 text-indigo-700",
  violet: "border-violet-200/70 bg-violet-50 text-violet-700",
  sky: "border-sky-200/70 bg-sky-50 text-sky-700",
  slate: "border-slate-200/70 bg-slate-50 text-slate-600",
};

const DOT: Record<string, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  sky: "bg-sky-500",
  slate: "bg-slate-400",
};

const STATUS_TONE: Record<string, keyof typeof TONES> = {
  approved: "emerald",
  present: "emerald",
  ready: "emerald",
  collected: "emerald",
  accepted: "emerald",
  resolved: "emerald",
  active: "emerald",
  verified: "emerald",
  graded: "emerald",
  under_faculty_review: "amber",
  submitted: "amber",
  processing: "amber",
  placed: "amber",
  preparing: "amber",
  pending: "amber",
  forwarded_to_hod: "sky",
  open: "indigo",
  od: "violet",
  returned: "violet",
  claimed: "violet",
  rejected: "rose",
  absent: "rose",
  failed: "rose",
  declined: "rose",
  disabled: "rose",
  cancelled: "slate",
  draft: "slate",
  hidden: "slate",
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const tone = STATUS_TONE[status] ?? "slate";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        TONES[tone],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT[tone])} />
      {label ?? STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border/70 bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon: Icon,
  tone = "indigo",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: "indigo" | "violet" | "sky" | "emerald" | "amber";
}) {
  const tones: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    violet: "bg-violet-50 text-violet-600",
    sky: "bg-sky-50 text-sky-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="uz-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span className={cn("flex size-9 items-center justify-center rounded-xl", tones[tone])}>
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary/8 text-primary">
          <Icon className="size-5" />
        </span>
      )}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {label}…
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-rose-200/80 bg-rose-50/80 px-4 py-3 text-xs text-rose-700">
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function ProgressBar({
  value,
  className,
  tone = "indigo",
}: {
  value: number;
  className?: string;
  tone?: "indigo" | "emerald" | "amber" | "violet";
}) {
  const tones = {
    indigo: "from-indigo-500 to-violet-500",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-500 to-orange-500",
    violet: "from-violet-500 to-fuchsia-500",
  };
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full bg-gradient-to-r transition-all", tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Avatar({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-[11px] font-semibold text-white",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function PageWrap({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">{children}</div>;
}
