import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, BrainCircuit, CheckCircle2, Loader2, UploadCloud, XCircle } from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { useAuth } from "@/context/AuthContext";
import { useMlInsights } from "@/context/MlInsightsContext";
import { confirmTransactionsImport, uploadTransactionsCsv } from "@/lib/api.js";
import { formatCurrency } from "@/utils/dashboardUtils.js";

const PREVIEW_ROWS = 25;

function MlPreviewTable({ rows = [] }) {
  const visibleRows = rows.slice(0, PREVIEW_ROWS);
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-3 py-2 text-left font-medium">Income</th>
            <th className="px-3 py-2 text-left font-medium">Expenses</th>
            <th className="px-3 py-2 text-left font-medium">Food</th>
            <th className="px-3 py-2 text-left font-medium">Shopping</th>
            <th className="px-3 py-2 text-left font-medium">Rent</th>
            <th className="px-3 py-2 text-left font-medium">Savings</th>
            <th className="px-3 py-2 text-left font-medium">Balance</th>
            <th className="px-3 py-2 text-left font-medium">Label</th>
            <th className="px-3 py-2 text-left font-medium">Month</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr key={`ml-row-${row.rowNumber}`} className="border-b border-border/60">
              <td className="px-3 py-2">{formatCurrency(row.normalized.income)}</td>
              <td className="px-3 py-2">{formatCurrency(row.normalized.total_expenses)}</td>
              <td className="px-3 py-2">{formatCurrency(row.normalized.food_expense)}</td>
              <td className="px-3 py-2">{formatCurrency(row.normalized.shopping_expense)}</td>
              <td className="px-3 py-2">{formatCurrency(row.normalized.rent_expense)}</td>
              <td className="px-3 py-2">{formatCurrency(row.normalized.savings)}</td>
              <td className="px-3 py-2">{formatCurrency(row.normalized.remaining_balance)}</td>
              <td className="px-3 py-2">{row.normalized.overspending_label}</td>
              <td className="px-3 py-2">{row.normalized.month_index}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MlControlCenter() {
  const { session } = useAuth();
  const { reportTrainingResult } = useMlInsights();
  const [file, setFile] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [retrainingState, setRetrainingState] = useState("idle");

  const mlSummary = useMemo(() => {
    if (!previewData?.acceptedRows?.length) return null;
    return previewData.acceptedRows.reduce(
      (acc, row) => {
        acc.income += Number(row.normalized.income || 0);
        acc.expense += Number(row.normalized.total_expenses || 0);
        acc.positiveLabels += Number(row.normalized.overspending_label || 0);
        return acc;
      },
      { income: 0, expense: 0, positiveLabels: 0 }
    );
  }, [previewData]);

  const handleUploadPreview = async () => {
    if (!file || !session?.id) {
      toast.error("Choose a CSV and sign in first");
      return;
    }
    setError("");
    setPhase("uploading");
    try {
      const json = await uploadTransactionsCsv(file, session.id);
      const nextPreview = json.data;
      if (nextPreview.previewType !== "ml_dataset") {
        setPhase("idle");
        setPreviewData(null);
        setError("This page only accepts ML training datasets. Use Import CSV for transactions.");
        toast.error("Detected transaction CSV. Use Import CSV page.");
        return;
      }
      setPreviewData(nextPreview);
      setPhase("preview");
      toast.success(`Dataset preview ready: ${nextPreview.summary.acceptedRows} rows accepted`);
    } catch (err) {
      const msg = err?.message || "Upload failed";
      setError(msg);
      setPhase("idle");
      toast.error(msg);
    }
  };

  const handleConfirm = async () => {
    if (!previewData?.previewId) return;
    const ok = window.confirm("Save this dataset and retrain persisted ML models now?");
    if (!ok) return;
    setIsConfirming(true);
    setRetrainingState("running");
    try {
      const result = await confirmTransactionsImport(previewData.previewId);
      reportTrainingResult(result.data);
      setRetrainingState("completed");
      toast.success(`Retrained models with ${result.data.importedCount} rows`);
    } catch (err) {
      setRetrainingState("failed");
      toast.error(err?.message || "Retraining failed");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 p-8">
        <Header userName="ML Control Center" />
        <Link to="/upload" className="mt-4 mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to import transactions
        </Link>

        <div className="space-y-8">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <BrainCircuit className="h-7 w-7 text-primary" />
              ML Control Center
            </h1>
            <p className="mt-2 max-w-3xl leading-relaxed text-muted-foreground">
              Admin/demo area for model dataset uploads and retraining. This does not populate user transaction history or dashboard timelines.
            </p>
          </div>

          <div className="stat-card space-y-4">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground"
            />
            <button
              type="button"
              onClick={handleUploadPreview}
              disabled={phase === "uploading" || !file}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              {phase === "uploading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              {phase === "uploading" ? "Uploading..." : "Preview dataset"}
            </button>
            {error ? <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}
          </div>

          {phase === "preview" && previewData ? (
            <div className="space-y-6">
              {mlSummary ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="stat-card"><p className="text-xs uppercase tracking-wide text-muted-foreground">Dataset income total</p><p className="mt-1 text-2xl font-bold text-emerald-500">{formatCurrency(mlSummary.income)}</p></div>
                  <div className="stat-card"><p className="text-xs uppercase tracking-wide text-muted-foreground">Dataset expense total</p><p className="mt-1 text-2xl font-bold text-red-400">{formatCurrency(mlSummary.expense)}</p></div>
                  <div className="stat-card"><p className="text-xs uppercase tracking-wide text-muted-foreground">Positive labels</p><p className="mt-1 text-2xl font-bold">{mlSummary.positiveLabels}</p></div>
                </div>
              ) : null}

              <div className="stat-card">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Dataset preview (first {PREVIEW_ROWS} rows)</h2>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isConfirming || previewData.summary.acceptedRows === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground disabled:opacity-40"
                  >
                    {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Confirm dataset & retrain
                  </button>
                </div>
                <MlPreviewTable rows={previewData.acceptedRows || []} />
              </div>

              {previewData.skippedRows?.length > 0 ? (
                <div className="stat-card">
                  <div className="mb-3 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <h3 className="text-sm font-semibold">Rejected rows</h3>
                  </div>
                  <div className="space-y-2">
                    {previewData.skippedRows.slice(0, 8).map((row) => (
                      <div key={`${row.rowNumber}-${row.reason}`} className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                        <div><span className="font-medium">Row {row.rowNumber}</span>: {row.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {retrainingState !== "idle" ? (
            <section className="rounded-2xl border border-border bg-card/70 p-5">
              <p className="text-sm font-semibold">Retraining state</p>
              <p className="mt-2 text-lg font-semibold">
                {retrainingState === "running" ? "Retraining..." : retrainingState === "completed" ? "Completed" : "Failed"}
              </p>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
