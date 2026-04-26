import { AlertTriangle, ArrowRight, Info, Lightbulb, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const kindStyles = {
  warning: {
    wrap: "border-amber-500/30 bg-amber-500/5",
    icon: AlertTriangle,
    iconClass: "text-amber-500",
  },
  positive: {
    wrap: "border-emerald-500/30 bg-emerald-500/5",
    icon: Sparkles,
    iconClass: "text-emerald-500",
  },
  info: {
    wrap: "border-border bg-muted/30",
    icon: Info,
    iconClass: "text-primary",
  },
  tip: {
    wrap: "border-secondary/40 bg-secondary/5",
    icon: Lightbulb,
    iconClass: "text-secondary",
  },
};

/** @param {{ insights: object[], compact?: boolean, title?: string }} props */
export function InsightsPanel({
  insights,
  compact = false,
  title = "Insights",
}) {
  if (!insights?.length) return null;

  return (
    <section className={`stat-card ${compact ? "py-4" : ""}`}>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {!compact && (
          <Link
            to="/report"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            Full report
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <ul className="space-y-3">
        {insights.map((insight) => {
          const cfg = kindStyles[insight.kind] || kindStyles.info;
          const Icon = cfg.icon;
          return (
            <li
              key={insight.id}
              className={`rounded-xl border px-4 py-3 ${cfg.wrap}`}
            >
              <div className="flex gap-3">
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.iconClass}`} />
                <div className="min-w-0 space-y-1">
                  <p className="font-medium text-sm text-foreground">{insight.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{insight.detail}</p>
                  {insight.action && (
                    <p className="text-xs font-medium text-foreground/90 pt-1 border-t border-border/60 mt-2">
                      → {insight.action}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
