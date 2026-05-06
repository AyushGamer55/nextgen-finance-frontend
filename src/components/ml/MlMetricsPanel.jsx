import { BarChart3, Gauge, GitBranch, Radar } from "lucide-react";

function MetricBar({ label, value, percent }) {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary transition-all"
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  );
}

export function MlMetricsPanel({ ml, loading }) {
  const logistic = ml?.overspending?.metrics || {};
  const kmeans = ml?.behavior?.metrics || {};
  const trend = ml?.trend?.metrics || {};
  const clusterDistribution = kmeans.cluster_distribution || {};

  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <div className="rounded-2xl border border-border bg-card/70 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Gauge className="h-4 w-4 text-primary" />
          Logistic Regression
        </div>
        <div className="mt-4 space-y-4">
          <MetricBar
            label="Accuracy"
            value={loading ? "..." : `${Math.round((logistic.accuracy || 0) * 100)}%`}
            percent={(logistic.accuracy || 0) * 100}
          />
          <MetricBar
            label="Precision"
            value={loading ? "..." : `${Math.round((logistic.precision || 0) * 100)}%`}
            percent={(logistic.precision || 0) * 100}
          />
          <MetricBar
            label="Recall"
            value={loading ? "..." : `${Math.round((logistic.recall || 0) * 100)}%`}
            percent={(logistic.recall || 0) * 100}
          />
          <MetricBar
            label="F1 Score"
            value={loading ? "..." : `${Math.round((logistic.f1_score || 0) * 100)}%`}
            percent={(logistic.f1_score || 0) * 100}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/70 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <GitBranch className="h-4 w-4 text-primary" />
          K-Means Clustering
        </div>
        <div className="mt-4 space-y-4">
          <MetricBar
            label="Silhouette score"
            value={loading ? "..." : `${(kmeans.silhouette_score || 0).toFixed(2)}`}
            percent={(kmeans.silhouette_score || 0) * 100}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium">Cluster distribution</p>
            {Object.keys(clusterDistribution).length ? (
              Object.entries(clusterDistribution).map(([label, count]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Distribution will appear after model metrics load.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/70 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <BarChart3 className="h-4 w-4 text-primary" />
          Linear Regression
        </div>
        <div className="mt-4 space-y-4">
          <MetricBar
            label="Forecast confidence"
            value={loading ? "..." : `${Math.round(ml?.trend?.confidenceScore || 0)}%`}
            percent={ml?.trend?.confidenceScore || 0}
          />
          <MetricBar
            label="R2 score"
            value={loading ? "..." : `${(trend.r2_score || 0).toFixed(2)}`}
            percent={(trend.r2_score || 0) * 100}
          />
          <div className="rounded-lg border border-border px-3 py-3 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <Radar className="h-4 w-4 text-primary" />
              Forecast direction
            </div>
            <p className="mt-1 text-muted-foreground">
              {loading ? "Loading..." : ml?.trend?.direction || "stable"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}