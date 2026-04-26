import { TrendingUp, TrendingDown } from "lucide-react";

export function StatCard({ title, amount, change, isPositive, icon, iconBg = "bg-secondary" }) {
  return (
    <div className="stat-card flex items-center gap-4 animate-fade-in">
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
        {icon}
      </div>

      <div className="flex-1">
        <p className="text-muted-foreground text-sm">{title}</p>

        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-foreground">{amount}</span>

          <span
            className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              isPositive
                ? "bg-success/20 text-success"
                : "bg-destructive/20 text-destructive"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}

            {change}
          </span>
        </div>
      </div>
    </div>
  );
}