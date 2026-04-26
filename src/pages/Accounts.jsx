import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Building2, CreditCard, Landmark, PiggyBank, ShieldCheck } from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency } from "@/utils/dashboardUtils.js";
import { buildAccountPortfolio } from "@/lib/finance.js";

export default function Accounts() {
  const { session } = useAuth();
  const { summary } = useFinance();
  const accountPortfolio = useMemo(
    () => buildAccountPortfolio(session?.balance || 0),
    [session?.balance]
  );

  const buckets = useMemo(() => {
    const emergencySaved = Math.max(0, summary.netSavings);
    const emergencyTarget = Math.max(summary.emergencyFundTarget || 0, summary.averageMonthlyExpenses || 0);
    const emergencyProgress = emergencyTarget > 0 ? Math.min(100, (emergencySaved / emergencyTarget) * 100) : 0;
    const travelSpend = summary.categoryExpensePie.find((item) => item.name === "Travel")?.value || 0;
    const educationSpend = summary.categoryExpensePie.find((item) => item.name === "Education")?.value || 0;

    return [
      {
        title: "Emergency fund",
        amount: formatCurrency(emergencySaved),
        foot: `${emergencyProgress.toFixed(0)}% of target ${formatCurrency(emergencyTarget)}`,
      },
      {
        title: "Travel bucket",
        amount: formatCurrency(Math.max(0, Math.round(travelSpend * 0.35))),
        foot: travelSpend > 0 ? `Derived from your travel spending pattern` : "No travel pattern yet, start tagging travel transactions",
      },
      {
        title: "Learning bucket",
        amount: formatCurrency(Math.max(0, Math.round(educationSpend * 0.4))),
        foot: educationSpend > 0 ? `Derived from education-related activity` : "No learning spend recorded yet",
      },
    ];
  }, [summary]);

  const creditSnapshot = useMemo(() => {
    const bills = summary.categoryExpensePie.find((item) => item.name === "Bills & Utilities")?.value || 0;
    const shopping = summary.categoryExpensePie.find((item) => item.name === "Shopping")?.value || 0;
    const debtPressure = Math.max(0, bills + Math.round(shopping * 0.25));
    const creditHealth = summary.netSavings >= 0 ? "Stable" : "Needs attention";

    return {
      debtPressure,
      creditHealth,
      runway: summary.averageMonthlyExpenses > 0 ? (Math.max(session?.balance || 0, 0) / summary.averageMonthlyExpenses).toFixed(1) : "0.0",
    };
  }, [summary, session]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="mx-auto max-w-5xl flex-1 p-8">
        <Header userName="Accounts" />

        <div className="grid gap-6 md:grid-cols-3">
          <div className="stat-card flex flex-col">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
              <Landmark className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold text-foreground">Primary account</h3>
            <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
              Your live app balance, sandbox payment identity, and transaction-backed monthly flow.
            </p>
            <p className="mt-4 text-2xl font-bold text-foreground">{formatCurrency(session?.balance || 0)}</p>
            <p className="mt-2 border-t border-border pt-3 text-xs text-muted-foreground">
              {session?.sandboxUpiId || "Sandbox identity unavailable"}
            </p>
          </div>

          <div className="stat-card flex flex-col">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
              <PiggyBank className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold text-foreground">Savings buckets</h3>
            <div className="mt-2 space-y-3 text-sm">
              {buckets.map((bucket) => (
                <div key={bucket.title} className="rounded-lg bg-muted/40 px-3 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{bucket.title}</span>
                    <span className="font-semibold">{bucket.amount}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{bucket.foot}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="stat-card flex flex-col">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold text-foreground">Credit & loans</h3>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-muted/40 px-3 py-3">
                <p className="text-xs text-muted-foreground">Credit health</p>
                <p className="mt-1 font-semibold text-foreground">{creditSnapshot.creditHealth}</p>
              </div>
              <div className="rounded-lg bg-muted/40 px-3 py-3">
                <p className="text-xs text-muted-foreground">Monthly commitment estimate</p>
                <p className="mt-1 font-semibold text-foreground">{formatCurrency(creditSnapshot.debtPressure)}</p>
              </div>
              <div className="rounded-lg bg-muted/40 px-3 py-3">
                <p className="text-xs text-muted-foreground">Cash runway</p>
                <p className="mt-1 font-semibold text-foreground">{creditSnapshot.runway} months</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="stat-card">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Sandbox banking details</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-muted/40 px-4 py-3">
                <p className="text-xs text-muted-foreground">Bank</p>
                <p className="font-medium">{session?.sandboxBankName || "MountDash Sandbox Bank"}</p>
              </div>
              <div className="rounded-lg bg-muted/40 px-4 py-3">
                <p className="text-xs text-muted-foreground">UPI ID</p>
                <p className="font-medium">{session?.sandboxUpiId || "-"}</p>
              </div>
              <div className="rounded-lg bg-muted/40 px-4 py-3">
                <p className="text-xs text-muted-foreground">Account number</p>
                <p className="font-medium">{session?.sandboxAccountNumber || "-"}</p>
              </div>
              <div className="rounded-lg bg-muted/40 px-4 py-3">
                <p className="text-xs text-muted-foreground">IFSC</p>
                <p className="font-medium">{session?.sandboxIfsc || "MTDS0001234"}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Account quality</h3>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Your accounts page now reflects your current app balance and transaction-derived planning buckets, not placeholder text.</p>
              <p>Wallet transfers can now work between users through sandbox email, UPI, or account number routing.</p>
              <p>When you later add real bank linking, this page can swap sandbox identifiers for live provider accounts without changing the UI structure.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 stat-card">
          <h3 className="mb-4 font-semibold">Portfolio allocation</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {accountPortfolio.map((account) => (
              <div key={account.key} className="rounded-xl border border-border px-4 py-4">
                <p className="text-sm font-medium">{account.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{account.type}</p>
                <p className="mt-3 text-xl font-semibold">{formatCurrency(account.balance)}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            These balances are split from your total available funds so Accounts and Wallet stay aligned.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/wallet"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <Landmark className="h-4 w-4" />
            Open wallet
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
