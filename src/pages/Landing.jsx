import { Link } from "react-router-dom";
import { ArrowRight, PieChart, TrendingUp, Wallet } from "lucide-react";

const btnBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background";
const btnPrimaryLg = `${btnBase} bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-xl px-8`;
const btnOutlineLg = `${btnBase} border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 rounded-xl px-8`;
const btnSm = `${btnBase} bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-lg px-3 text-sm`;

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary-foreground" fill="currentColor" aria-hidden>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-semibold text-lg tracking-tight">MountDash</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 text-sm flex-wrap justify-end">
            <Link
              to="/login"
              className="text-muted-foreground hover:text-foreground transition-colors px-2"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="text-muted-foreground hover:text-foreground transition-colors px-2"
            >
              Sign up
            </Link>
            <Link
              to="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
            >
              Open app
            </Link>
            <Link to="/dashboard" className={btnSm}>
              Start now
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-14 md:py-20 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8">
            <p className="text-sm font-medium text-primary uppercase tracking-wider">
              Personal finance
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-balance">
              Take Control of Your Money with AI
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Analyze spending, track trends, get smart advice. See your income, expenses, and savings
              in one calm dashboard built for clarity—not clutter.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/dashboard" className={`${btnPrimaryLg} gap-2`}>
                Start now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/analytics" className={btnOutlineLg}>
                View analytics
              </Link>
              <Link to="/upload" className={btnOutlineLg}>
                Import CSV
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              No signup required for the local demo—your data stays in this browser until you add a backend.
            </p>
          </div>

          <div
            className="relative rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-primary/5 ring-1 ring-border/50"
            aria-hidden
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Dashboard preview</span>
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                  <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                  <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Income", tone: "bg-primary/20 text-primary" },
                  { label: "Expenses", tone: "bg-secondary/20 text-secondary-foreground" },
                  { label: "Savings", tone: "bg-emerald-500/15 text-emerald-400" },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-xl border border-border/80 bg-background/80 p-3 space-y-2"
                  >
                    <div className={`h-1.5 w-8 rounded-full ${card.tone}`} />
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{card.label}</p>
                    <div className="h-6 w-full rounded bg-muted/60 animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-border/80 bg-background/80 p-4 flex items-end gap-2 h-36">
                {[40, 65, 35, 80, 55, 70, 45].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md bg-primary/50 opacity-80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <PieChart className="w-3.5 h-3.5 text-primary" /> Categories
                </span>
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-secondary" /> Trends
                </span>
                <span className="inline-flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-muted-foreground" /> Cash flow
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <Link to="/dashboard" className="hover:text-foreground transition-colors">
          Continue to dashboard →
        </Link>
      </footer>
    </div>
  );
}
