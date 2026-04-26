import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, TrendingUp, Wallet } from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency } from "@/utils/dashboardUtils.js";

function parseNum(value) {
  const n = parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function projectLumpSum(principal, annualPct, years) {
  const r = annualPct / 100;
  const y = Math.max(0, Math.floor(years));
  if (y <= 0) return principal;
  return principal * Math.pow(1 + r, y);
}

export default function Invest() {
  const { summary } = useFinance();
  const [principal, setPrincipal] = useState("50000");
  const [rate, setRate] = useState("10");
  const [years, setYears] = useState("10");

  const result = useMemo(() => {
    const p = parseNum(principal);
    const r = parseNum(rate);
    const y = parseNum(years);
    const fv = projectLumpSum(p, r, y);
    const gain = fv - p;
    return { fv, gain, p, y };
  }, [principal, rate, years]);

  const suggestedMonthlyInvesting = useMemo(() => {
    if (summary.netSavings <= 0) return 0;
    return Math.max(1000, Math.round(summary.netSavings * 0.35));
  }, [summary.netSavings]);

  const emergencyGap = useMemo(() => {
    return Math.max(0, summary.emergencyFundTarget - Math.max(summary.netSavings, 0));
  }, [summary.emergencyFundTarget, summary.netSavings]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="mx-auto flex w-full max-w-4xl flex-1 p-8">
        <Header userName="Investment planner" />
        <Link
          to="/dashboard"
          className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          Back to Dashboard
        </Link>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="stat-card">
              <div className="flex items-center gap-2 text-primary">
                <Wallet className="h-5 w-5" />
                <p className="text-sm font-medium">Current surplus</p>
              </div>
              <p className="mt-3 text-2xl font-bold">{formatCurrency(summary.netSavings)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Use surplus first for emergency cover, then investments.
              </p>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="h-5 w-5" />
                <p className="text-sm font-medium">Emergency fund gap</p>
              </div>
              <p className="mt-3 text-2xl font-bold">{formatCurrency(emergencyGap)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Based on 6 months of your average expenses.
              </p>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="h-5 w-5" />
                <p className="text-sm font-medium">Suggested monthly investing</p>
              </div>
              <p className="mt-3 text-2xl font-bold">{formatCurrency(suggestedMonthlyInvesting)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                A balanced starting point from your current cash-flow profile.
              </p>
            </div>
          </div>

          <div className="stat-card space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <TrendingUp className="h-6 w-6" />
              <h2 className="text-lg font-semibold text-foreground">Long-term growth planner</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This projection uses compound growth on a lump sum to estimate what disciplined investing could become over time. It is for planning, not guaranteed returns.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Initial amount (₹)</label>
                <input
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Expected annual return (%)</label>
                <input
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Years</label>
                <input
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-5">
              <p className="text-sm text-muted-foreground">Estimated balance after {result.y || 0} years</p>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(result.fv)}</p>
              <p className="text-sm text-muted-foreground">
                Gain vs starting principal:{" "}
                <span className={result.gain >= 0 ? "font-medium text-emerald-500" : "text-red-400"}>
                  {formatCurrency(result.gain)}
                </span>
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Savings rate</p>
                <p className="mt-1 text-lg font-semibold">{summary.savingsRate.toFixed(0)}%</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Avg monthly expenses</p>
                <p className="mt-1 text-lg font-semibold">{formatCurrency(summary.averageMonthlyExpenses)}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Priority</p>
                <p className="mt-1 text-lg font-semibold">{emergencyGap > 0 ? "Build safety buffer" : "Scale investing"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-5">
              <h3 className="text-sm font-semibold">Professional approach</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Protect 3-6 months of expenses before taking higher investment risk.</li>
                <li>Invest from consistent surplus, not from money needed for fees, rent, or essentials.</li>
                <li>Review top spending categories monthly so investing grows from better habits, not pressure.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
