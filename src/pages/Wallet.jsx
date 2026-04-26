import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Copy,
  Landmark,
  Loader2,
  Send,
  Wallet as WalletIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import { buildAccountPortfolio } from "@/lib/finance.js";
import { transferAPI, userAPI } from "@/lib/authApi";
import { formatCurrency } from "@/utils/dashboardUtils.js";

function resolveRecipientPayload(value) {
  const input = String(value || "").trim();
  if (!input) return {};
  if (/^\d{10,18}$/.test(input)) return { recipientAccountNumber: input };
  if (/@mountdash$/i.test(input)) return { recipientUpiId: input.toLowerCase() };
  return { recipientEmail: input.toLowerCase() };
}

function TransferModal({ onClose, recipients, onSearch, onTransfer, loading }) {
  const [form, setForm] = useState({ recipient: "", amount: "", description: "" });
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  useEffect(() => {
    if (form.recipient.trim().length >= 2) {
      onSearch(form.recipient.trim());
    }
  }, [form.recipient, onSearch]);

  const handleSubmit = async () => {
    const amount = Number(form.amount);
    if (!form.recipient || !amount) return;
    await onTransfer({
      ...resolveRecipientPayload(form.recipient),
      amount,
      description: form.description,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-fade-in">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Send money</h2>
          </div>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-muted">Close</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Recipient email, sandbox UPI, or account number</label>
            <input
              value={form.recipient}
              onChange={set("recipient")}
              placeholder="name@example.com or user.123456@mountdash"
              className="w-full rounded-lg bg-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {recipients.length > 0 && (
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Matching users</p>
              <div className="space-y-2">
                {recipients.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, recipient: user.sandboxUpiId }))}
                    className="flex w-full items-center justify-between rounded-lg bg-background px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span>
                      <span className="font-medium text-foreground">{user.name}</span>
                      <span className="ml-2 text-muted-foreground">{user.email}</span>
                    </span>
                    <span className="text-xs text-primary">{user.sandboxUpiId}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Amount (₹)</label>
              <input
                type="number"
                value={form.amount}
                onChange={set("amount")}
                placeholder="0"
                className="w-full rounded-lg bg-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Note</label>
              <input
                value={form.description}
                onChange={set("description")}
                placeholder="Rent, split bill, refund"
                className="w-full rounded-lg bg-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !form.recipient || !form.amount}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Transfer now
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Wallet() {
  const { session, refreshSession } = useAuth();
  const { summary, refreshTransactions, addTransaction } = useFinance();
  const [profile, setProfile] = useState(session);
  const [transferHistory, setTransferHistory] = useState([]);
  const [transferStats, setTransferStats] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [copied, setCopied] = useState(null);

  const loadWallet = async () => {
    setIsLoading(true);
    try {
      const [meRes, historyRes, statsRes] = await Promise.all([
        userAPI.getMe(),
        transferAPI.history(1, 8),
        transferAPI.stats(),
      ]);

      setProfile(meRes.data?.data?.user || session);
      setTransferHistory(historyRes.data?.data?.transfers || []);
      setTransferStats(statsRes.data?.data?.stats || null);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Wallet load failed");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const searchRecipients = async (query) => {
    try {
      const res = await userAPI.lookup(query);
      setRecipients(res.data?.data?.users || []);
    } catch {
      setRecipients([]);
    }
  };

  const handleTransfer = async (payload) => {
    setIsSending(true);
    try {
      const res = await transferAPI.send(payload);
      const transfer = res.data?.data?.transfer;
      toast.success(`₹${Number(transfer?.amount || 0).toLocaleString("en-IN")} sent to ${transfer?.recipient?.name || "recipient"}`);
      await Promise.all([refreshTransactions(), refreshSession(), loadWallet()]);
      setRecipients([]);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Transfer failed");
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  const handleTopUp = async () => {
    try {
      await addTransaction({
        id: Date.now(),
        name: "Wallet top-up",
        iconType: "receive",
        category: "Income",
        date: new Date().toISOString(),
        amount: "Rs 5000",
        status: "Success",
        note: "Sandbox top-up",
      });
      toast.success("Sandbox top-up added");
      await Promise.all([refreshTransactions(), refreshSession(), loadWallet()]);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Top-up failed");
    }
  };

  const copyField = async (value, key) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const recentTransfers = useMemo(() => transferHistory.slice(0, 6), [transferHistory]);
  const accountPortfolio = useMemo(
    () => buildAccountPortfolio(profile?.balance || 0),
    [profile?.balance]
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <Header userName="Wallet" />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="stat-card lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Available balance</p>
                <p className="mt-2 text-4xl font-bold text-foreground">
                  {formatCurrency(profile?.balance || 0)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Real account balance synced from your current project data.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowTransferModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
                  <Send className="h-4 w-4" /> Send money
                </button>
                <button onClick={handleTopUp} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium">
                  <WalletIcon className="h-4 w-4" /> Sandbox top-up
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Total sent</p>
                <p className="mt-1 text-xl font-semibold">{formatCurrency(transferStats?.totalSent || 0)}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Total received</p>
                <p className="mt-1 text-xl font-semibold">{formatCurrency(transferStats?.totalReceived || 0)}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Average transfer</p>
                <p className="mt-1 text-xl font-semibold">{formatCurrency(transferStats?.averageTransfer || 0)}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="mb-4 flex items-center gap-2 text-primary">
              <Landmark className="h-5 w-5" />
              <h2 className="font-semibold">Sandbox account</h2>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ["UPI ID", profile?.sandboxUpiId, "upi"],
                ["Account number", profile?.sandboxAccountNumber, "account"],
                ["IFSC", profile?.sandboxIfsc, "ifsc"],
              ].map(([label, value, key]) => (
                <div key={key} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium">{value || "-"}</p>
                  </div>
                  {value && (
                    <button onClick={() => copyField(value, key)} className="rounded-lg p-2 hover:bg-background">
                      {copied === key ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="stat-card">
            <h3 className="text-lg font-semibold">Wallet health</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Savings rate</span>
                <span className="font-medium">{summary.savingsRate?.toFixed?.(0) || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Monthly expenses</span>
                <span className="font-medium">{formatCurrency(summary.averageMonthlyExpenses || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Emergency target</span>
                <span className="font-medium">{formatCurrency(summary.emergencyFundTarget || 0)}</span>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <h3 className="text-lg font-semibold">Owned accounts</h3>
            <div className="mt-4 space-y-3">
              {accountPortfolio.map((account) => (
                <div key={account.key} className="rounded-xl border border-border px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-xs text-muted-foreground">{account.type}</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(account.balance)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="stat-card lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent transfers</h3>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <div className="space-y-2">
              {recentTransfers.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No transfers yet. Send money to another user to start using the wallet properly.</p>
              ) : (
                recentTransfers.map((tx) => {
                  const incoming = tx.type === "income";
                  return (
                    <div key={tx._id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${incoming ? "bg-green-500/15" : "bg-red-500/15"}`}>
                          {incoming ? <ArrowDownLeft className="h-5 w-5 text-green-500" /> : <ArrowUpRight className="h-5 w-5 text-red-500" />}
                        </div>
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">{new Date(tx.createdAt || tx.date).toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                      <p className={`font-semibold ${incoming ? "text-green-500" : "text-red-500"}`}>
                        {incoming ? "+" : "-"}{formatCurrency(tx.amount || 0)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {showTransferModal && (
          <TransferModal
            onClose={() => {
              setShowTransferModal(false);
              setRecipients([]);
            }}
            recipients={recipients}
            onSearch={searchRecipients}
            onTransfer={handleTransfer}
            loading={isSending}
          />
        )}
      </main>
    </div>
  );
}
