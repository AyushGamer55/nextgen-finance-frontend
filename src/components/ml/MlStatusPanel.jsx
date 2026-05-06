import { BrainCircuit, Database, RefreshCcw, ShieldAlert } from "lucide-react";

import { MlSourceBadge } from "@/components/ml/MlSourceBadge";

function formatDate(value) {
  if (!value) return "Not trained yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

function valueOrFallback(value, fallback = "-") {
  return value ?? fallback;
}

export function MlStatusPanel({ ml, loading, error, title = "ML model status", subtitle, className = "" }) {
  const training = ml?.training || {};
  const source = ml?.source || "fallback_rules";

  return (
    <section className={`rounded-2xl border border-border bg-card/70 p-5 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <BrainCircuit className="h-4 w-4 text-primary" />
            {title}
          </div>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <MlSourceBadge source={source} />
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5" />
            Training status
          </div>
          <p className="mt-2 text-lg font-semibold">{loading ? "Loading..." : valueOrFallback(training.status, "Unknown")}</p>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <RefreshCcw className="h-3.5 w-3.5" />
            Last trained
          </div>
          <p className="mt-2 text-sm font-medium">{loading ? "Loading..." : formatDate(training.trainedAt)}</p>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Database className="h-3.5 w-3.5" />
            Dataset rows
          </div>
          <p className="mt-2 text-lg font-semibold">{loading ? "..." : valueOrFallback(training.sampleCount, 0)}</p>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Invalid rows dropped</p>
          <p className="mt-2 text-lg font-semibold">{loading ? "..." : valueOrFallback(training.invalidRowsDropped, 0)}</p>
        </div>
      </div>
    </section>
  );
}
