import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  UploadCloud,
  XCircle,
} from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { useFinance } from "@/context/FinanceContext";
import { useAuth } from "@/context/AuthContext";
import {
  confirmTransactionsImport,
  downloadGeneratedTransactionsCsv,
  uploadTransactionsCsv,
} from "@/lib/api.js";
import { mapImportPayloadToTransactions } from "@/lib/mapServerImport.js";
import { formatCurrency } from "@/utils/dashboardUtils.js";
import { parseRupeeAmount } from "@/lib/finance.js";

const PREVIEW_ROWS = 25;

export default function Upload() {
  const navigate = useNavigate();
  const { refreshTransactions } = useFinance();
  const { session } = useAuth();

  const [file, setFile] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [mappedPreview, setMappedPreview] = useState([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatorRows, setGeneratorRows] = useState("500");
  const [generatorFeatures, setGeneratorFeatures] = useState("4");

  const summary = useMemo(() => {
    if (!mappedPreview.length) return null;

    let income = 0;
    let expense = 0;

    for (const t of mappedPreview) {
      const n = parseRupeeAmount(t.amount);
      if (t.iconType === "receive") income += n;
      else expense += n;
    }

    return {
      count: mappedPreview.length,
      income,
      expense,
      net: income - expense,
    };
  }, [mappedPreview]);

  const handlePick = (e) => {
    const nextFile = e.target.files?.[0] || null;
    setFile(nextFile);
    setError("");
    setPreviewData(null);
    setMappedPreview([]);
    setPhase("idle");
  };

  const handleUploadPreview = async () => {
    if (!file) {
      toast.error("Choose a CSV file first");
      return;
    }

    if (!session?.id) {
      toast.error("Login required before upload");
      return;
    }

    setError("");
    setPhase("uploading");

    try {
      const json = await uploadTransactionsCsv(file, session.id);
      const nextPreview = json.data;
      if (nextPreview.previewType !== "transactions") {
        setPreviewData(null);
        setMappedPreview([]);
        setPhase("idle");
        setError("This page supports transaction imports only. Use ML Control Center for model dataset uploads.");
        toast.error("Detected ML dataset. Open ML Control Center for retraining.");
        return;
      }
      const mapped = mapImportPayloadToTransactions(nextPreview.acceptedRows);
      setPreviewData(nextPreview);
      setMappedPreview(mapped);
      setPhase("preview");
      toast.success(`Import preview ready: ${nextPreview.summary.acceptedRows} rows accepted`);
    } catch (err) {
      const msg = err?.message || "Upload failed";
      setError(msg);
      setPhase("idle");
      toast.error(msg);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData?.previewId) return;

    const prompt = "Import this preview into your account and replace the current backend transaction set for this user?";
    const ok = window.confirm(prompt);
    if (!ok) return;

    setIsConfirming(true);

    try {
      const result = await confirmTransactionsImport(previewData.previewId);
      await refreshTransactions();
      toast.success(`Imported ${result.data.importedCount} transactions`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.message || "Import failed");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleGenerateCsv = async () => {
    setIsGenerating(true);
    try {
      const blob = await downloadGeneratedTransactionsCsv({
        rows: Number(generatorRows) || 500,
        features: Number(generatorFeatures) || 4,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `transactions-${generatorRows || 500}-rows.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Sample CSV downloaded");
    } catch (err) {
      toast.error(err?.message || "CSV generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="mx-auto flex w-full max-w-6xl flex-1 p-8">
        <Header userName="Import CSV" />

        <Link
          to="/dashboard"
          className="mt-4 mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="space-y-8">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <FileSpreadsheet className="h-7 w-7 text-primary" />
              Import CSV
            </h1>
            <p className="mt-2 max-w-3xl leading-relaxed text-muted-foreground">
              Import transaction CSV files into your account. This flow updates real transaction history used by dashboard analytics, trends, and forecasts.
            </p>
            <Link to="/ml-control-center" className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline">
              Open ML Control Center
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="stat-card space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Connected account
                </label>
                <div className="w-full rounded-lg bg-muted px-3 py-2 text-sm">
                  {session?.email || "No active session"}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Transaction imports save to your account and power your normal analytics experience.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  CSV file
                </label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handlePick}
                  className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground"
                />
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  Generate sample transaction CSV from backend
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  This generator is for transaction imports only.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Rows
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={generatorRows}
                      onChange={(e) => setGeneratorRows(e.target.value)}
                      className="w-full rounded-lg bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Optional features
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="6"
                      value={generatorFeatures}
                      onChange={(e) => setGeneratorFeatures(e.target.value)}
                      className="w-full rounded-lg bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleGenerateCsv}
                      disabled={isGenerating}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground disabled:opacity-40"
                    >
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      Generate CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleUploadPreview}
              disabled={phase === "uploading" || !file}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              {phase === "uploading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Preview upload
                </>
              )}
            </button>
          </div>

          {phase === "preview" && previewData && (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                Detected upload type: <span className="font-medium text-foreground">Transaction import</span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="stat-card">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Accepted</p>
                  <p className="mt-1 text-2xl font-bold">{previewData.summary.acceptedRows}</p>
                </div>
                <div className="stat-card">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Rejected</p>
                  <p className="mt-1 text-2xl font-bold">{previewData.summary.skippedRows}</p>
                </div>
                <div className="stat-card">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Mode</p>
                  <p className="mt-1 text-lg font-bold">Transactions</p>
                </div>
                <div className="stat-card">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Rows scanned</p>
                  <p className="mt-1 text-2xl font-bold">{previewData.summary.totalRows}</p>
                </div>
              </div>

              {summary && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="stat-card">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Income</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-500">{formatCurrency(summary.income)}</p>
                  </div>
                  <div className="stat-card">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Expenses</p>
                    <p className="mt-1 text-2xl font-bold text-red-400">{formatCurrency(summary.expense)}</p>
                  </div>
                  <div className="stat-card">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Net</p>
                    <p className="mt-1 text-2xl font-bold">{formatCurrency(summary.net)}</p>
                  </div>
                </div>
              )}

              <div className="stat-card overflow-hidden">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">Preview (first {PREVIEW_ROWS} rows)</h2>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={isConfirming || previewData.summary.acceptedRows === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground disabled:opacity-40"
                  >
                    {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Confirm import
                  </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="px-3 py-2 text-left font-medium">Date</th>
                        <th className="px-3 py-2 text-left font-medium">Name</th>
                        <th className="px-3 py-2 text-left font-medium">Category</th>
                        <th className="px-3 py-2 text-left font-medium">Type</th>
                        <th className="px-3 py-2 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappedPreview.slice(0, PREVIEW_ROWS).map((row) => (
                        <tr key={row.id} className="border-b border-border/60">
                          <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{row.date}</td>
                          <td className="max-w-[200px] truncate px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2">{row.category}</td>
                          <td className="px-3 py-2 capitalize">{row.iconType}</td>
                          <td className="px-3 py-2 text-right font-medium">{row.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {mappedPreview.length > PREVIEW_ROWS && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    + {mappedPreview.length - PREVIEW_ROWS} more rows will be imported on confirm.
                  </p>
                )}
              </div>

              {previewData.skippedRows?.length > 0 && (
                <div className="stat-card">
                  <div className="mb-3 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <h3 className="text-sm font-semibold">Rejected rows</h3>
                  </div>
                  <div className="space-y-2">
                    {previewData.skippedRows.slice(0, 8).map((row) => (
                      <div
                        key={`${row.rowNumber}-${row.reason}`}
                        className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
                      >
                        <div><span className="font-medium">Row {row.rowNumber}</span>: {row.reason}</div>
                        {Array.isArray(row.reasons) && row.reasons.length > 1 && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {row.reasons.join(" | ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Preview belongs to <span className="font-mono text-foreground">{session?.email || session?.id}</span> and is confirmed against the backend before the dashboard refreshes.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
