import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BrainCircuit, Printer, Sparkles, TrendingUp } from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency } from "@/utils/dashboardUtils.js";
import { buildInsights, insightRecommendations } from "@/lib/insights.js";
import { useMlInsights } from "@/context/MlInsightsContext";
import { MlStatusPanel } from "@/components/ml/MlStatusPanel";
import { MlMetricsPanel } from "@/components/ml/MlMetricsPanel";
import { MlSourceBadge } from "@/components/ml/MlSourceBadge";

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

export default function Report() {
  const { summary, transactions } = useFinance();
  const { ml, predictionSummary, loading: mlLoading, error: mlError, lastTrainingResult } = useMlInsights();

  const insights = useMemo(() => buildInsights(transactions), [transactions]);
  const recommendations = useMemo(() => insightRecommendations(insights), [insights]);
  const generated = useMemo(() => new Date().toLocaleString(), []);
  const strongestMonth = useMemo(() => {
    return [...summary.trailingMonths].sort((a, b) => b.net - a.net)[0];
  }, [summary.trailingMonths]);
  const weakestMonth = useMemo(() => {
    return [...summary.trailingMonths].sort((a, b) => a.net - b.net)[0];
  }, [summary.trailingMonths]);

  const overspending = ml?.overspending || null;
  const behavior = ml?.behavior || null;
  const trend = ml?.trend || null;
  const training = ml?.training || null;

  const handlePrint = () => window.print();

  return (
    <div className="flex min-h-screen bg-background print:block">
      <div className="no-print">
        <Sidebar />
      </div>

      <main className="mx-auto max-w-5xl flex-1 p-8 print:max-w-none print:p-6">
        <div className="no-print mb-6">
          <Header userName="Monthly report" />
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              Back to Dashboard
            </Link>
            <button type="button" onClick={handlePrint} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <Printer className="h-4 w-4" />
              Print / Save as PDF
            </button>
          </div>
        </div>

        <article className="space-y-8 print:bg-white print:text-black">
          <header className="border-b border-border pb-6 print:border-gray-300">
            <p className="text-xs uppercase tracking-wider text-muted-foreground print:text-gray-600">MountDash | Summary</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Financial snapshot</h1>
            <p className="mt-2 text-sm text-muted-foreground print:text-gray-600">
              Generated {generated} | based on {transactions.length} recorded transactions
            </p>
          </header>

          <MlStatusPanel
            ml={ml}
            loading={mlLoading}
            error={mlError}
            title="ML pipeline status"
            subtitle="This report is now driven by the persisted backend models. You can see whether predictions come from a trained model or fallback mode."
          />

          {lastTrainingResult ? (
            <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-emerald-200">Latest retraining result</p>
                  <p className="mt-1 text-emerald-100/80">
                    Models updated at {formatDate(lastTrainingResult.training?.trained_at || lastTrainingResult.at)} with {lastTrainingResult.training?.dataset?.row_count || lastTrainingResult.importedCount || 0} dataset rows.
                  </p>
                </div>
                <MlSourceBadge source="trained_model" compact />
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 text-lg font-semibold">Totals</h2>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-border p-4 print:border-gray-200">
                <p className="text-xs text-muted-foreground">Total income</p>
                <p className="text-xl font-bold text-emerald-600 print:text-emerald-700 dark:text-emerald-400">{formatCurrency(summary.totalIncome)}</p>
              </div>
              <div className="rounded-xl border border-border p-4 print:border-gray-200">
                <p className="text-xs text-muted-foreground">Total expenses</p>
                <p className="text-xl font-bold text-red-500 print:text-red-600">{formatCurrency(summary.totalExpenses)}</p>
              </div>
              <div className="rounded-xl border border-border p-4 print:border-gray-200">
                <p className="text-xs text-muted-foreground">Net savings</p>
                <p className="text-xl font-bold">{formatCurrency(summary.netSavings)}</p>
              </div>
              <div className="rounded-xl border border-border p-4 print:border-gray-200">
                <p className="text-xs text-muted-foreground">Savings rate</p>
                <p className="text-xl font-bold">{summary.savingsRate.toFixed(0)}%</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Pattern view</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border p-4 print:border-gray-200">
                <p className="text-xs text-muted-foreground">Top expense category</p>
                <p className="mt-1 text-lg font-semibold">{summary.topExpenseCategory?.name || "Not enough data"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {summary.topExpenseCategory ? formatCurrency(summary.topExpenseCategory.value) : "Add more expense data to rank categories."}
                </p>
              </div>
              <div className="rounded-xl border border-border p-4 print:border-gray-200">
                <p className="text-xs text-muted-foreground">Average monthly expenses</p>
                <p className="mt-1 text-lg font-semibold">{formatCurrency(summary.averageMonthlyExpenses)}</p>
                <p className="mt-1 text-sm text-muted-foreground">Useful for emergency fund planning and steady budget targets.</p>
              </div>
              <div className="rounded-xl border border-border p-4 print:border-gray-200">
                <p className="text-xs text-muted-foreground">Emergency fund target</p>
                <p className="mt-1 text-lg font-semibold">{formatCurrency(summary.emergencyFundTarget)}</p>
                <p className="mt-1 text-sm text-muted-foreground">Based on 6 months of average expenses.</p>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Live ML insights</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-border p-4 print:border-gray-200">
                <p className="text-xs text-muted-foreground">Prediction source</p>
                <p className="mt-1 text-lg font-semibold">{mlLoading ? "Loading..." : predictionSummary?.source || "fallback_rules"}</p>
                <div className="mt-2">
                  <MlSourceBadge compact source={predictionSummary?.source || ml?.source} />
                </div>
              </div>
              <div className="rounded-xl border border-border p-4 print:border-gray-200">
                <p className="text-xs text-muted-foreground">Overspending risk</p>
                <p className="mt-1 text-lg font-semibold">{mlLoading ? "Loading..." : overspending?.prediction || "Not enough data"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{mlLoading ? "" : `${predictionSummary?.confidence || 0}% confidence`}</p>
              </div>
              <div className="rounded-xl border border-border p-4 print:border-gray-200">
                <p className="text-xs text-muted-foreground">Spending behavior</p>
                <p className="mt-1 text-lg font-semibold">{mlLoading ? "Loading..." : behavior?.segment || "Unknown"}</p>
                <p className="mt-1 text-sm text-muted-foreground">Cluster-driven classification.</p>
              </div>
              <div className="rounded-xl border border-border p-4 print:border-gray-200">
                <p className="text-xs text-muted-foreground">Next month forecast</p>
                <p className="mt-1 text-lg font-semibold">{mlLoading ? "Loading..." : formatCurrency(trend?.nextMonthExpense || 0)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{trend ? `${trend.direction} trend` : "Awaiting model signal"}</p>
              </div>
            </div>
          </section>

          <MlMetricsPanel ml={ml} loading={mlLoading} />

          <section>
            <h2 className="mb-3 text-lg font-semibold">12-month momentum</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-4 print:border-gray-200">
                <p className="text-xs text-muted-foreground">Strongest month</p>
                <p className="mt-1 text-lg font-semibold">{strongestMonth?.label || "No data"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Net result: {formatCurrency(strongestMonth?.net || 0)}
                </p>
              </div>
              <div className="rounded-xl border border-border p-4 print:border-gray-200">
                <p className="text-xs text-muted-foreground">Weakest month</p>
                <p className="mt-1 text-lg font-semibold">{weakestMonth?.label || "No data"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Net result: {formatCurrency(weakestMonth?.net || 0)}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Insights</h2>
            <ul className="list-none space-y-3 pl-0">
              {insights.map((insight) => (
                <li key={insight.id} className="rounded-lg border border-border px-4 py-3 text-sm print:border-gray-200">
                  <p className="font-medium">{insight.title}</p>
                  <p className="mt-1 leading-relaxed text-muted-foreground print:text-gray-700">{insight.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Recommendations</h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground print:text-gray-700">
              {recommendations.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ol>
          </section>

          <section>
            <div className="rounded-2xl border border-border bg-muted/20 p-5 print:border-gray-200">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">How the prediction layer works</h2>
              </div>
              <div className="mt-3 grid gap-4 text-sm text-muted-foreground print:text-gray-700 sm:grid-cols-3">
                <div>
                  <p className="font-medium text-foreground print:text-black">Logistic Regression</p>
                  <p className="mt-1">Uses monthly income, expenses, category pressure, and balance position to estimate overspending risk.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground print:text-black">K-Means</p>
                  <p className="mt-1">Groups the account into low, moderate, or high spender behavior without manual labels.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground print:text-black">Linear Regression</p>
                  <p className="mt-1">Projects next-month expenses from the month-by-month expense trend.</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-background px-3 py-1">
                  <TrendingUp className="h-3 w-3" />
                  Samples: {training?.sampleCount ?? 0}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-background px-3 py-1">
                  Last trained: {formatDate(training?.trainedAt)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-background px-3 py-1">
                  Source: {predictionSummary?.source || ml?.source || "fallback_rules"}
                </span>
              </div>
            </div>
          </section>

          <footer className="border-t border-border pt-6 text-xs text-muted-foreground print:border-gray-300 print:text-gray-600">
            Hybrid system: ML predicts, advisor explains. Not investment or tax advice.
          </footer>
        </article>
      </main>
    </div>
  );
}
