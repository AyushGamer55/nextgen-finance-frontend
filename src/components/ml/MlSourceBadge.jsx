function baseClasses(source) {
  if (source === "trained_model") {
    return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
  }

  if (source === "fallback_rules") {
    return "bg-amber-500/15 text-amber-300 border border-amber-500/30";
  }

  return "bg-muted text-muted-foreground border border-border";
}

function labelForSource(source) {
  if (source === "trained_model") return "Trained ML Model Active";
  if (source === "fallback_rules") return "Fallback Prediction Mode";
  return "ML Status Unknown";
}

export function MlSourceBadge({ source, compact = false }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${baseClasses(source)}`}>
      <span className={`h-2 w-2 rounded-full ${source === "trained_model" ? "bg-emerald-400" : source === "fallback_rules" ? "bg-amber-400" : "bg-muted-foreground"}`} />
      {compact ? source || "unknown" : labelForSource(source)}
    </span>
  );
}
