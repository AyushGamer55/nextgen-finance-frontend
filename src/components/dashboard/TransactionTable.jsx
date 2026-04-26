import { ChevronDown, ArrowUpRight, ArrowDownLeft, Banknote, Trash2, Pencil, Plus, X, Check, ArrowDownUp } from "lucide-react";
import { useEffect, useMemo, useState, Fragment } from "react";
import { toast } from "sonner";
import { useFinance } from "@/context/FinanceContext";
import { formatFinanceAmount, normalizeFinanceTransactions, parseRupeeAmount, parseTxDate } from "@/lib/finance.js";

const STATUS_OPTIONS = ["Success", "Pending", "Review", "Failed"];
const TYPE_OPTIONS = [
  { value: "send", label: "Expense" },
  { value: "receive", label: "Income" },
  { value: "transfer", label: "Transfer" },
];
const CATEGORIES = ["Other", "Food", "Shopping", "Bills", "Travel", "Healthcare", "Education", "Savings", "Income", "Transfer"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const statusColor = {
  Success: "text-success bg-success/20",
  Pending: "text-warning bg-warning/20",
  Review: "text-info bg-info/20",
  Failed: "text-destructive bg-destructive/20",
};

function stripDisplayedAmount(amount) {
  return String(amount || "")
    .replace(/Rs\s*/i, "")
    .replace(/[^0-9.-]/g, "")
    .replace(/,/g, "")
    .trim();
}

function TxIcon({ type }) {
  if (type === "send") {
    return <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20"><ArrowUpRight className="h-5 w-5 text-red-400" /></div>;
  }
  if (type === "receive") {
    return <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20"><ArrowDownLeft className="h-5 w-5 text-green-400" /></div>;
  }
  return <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/20"><Banknote className="h-5 w-5 text-info" /></div>;
}

function buildMonthOptions(transactions) {
  const parsedDates = transactions
    .map((tx) => parseTxDate(tx.date))
    .filter(Boolean);

  const now = new Date();
  const latestDate = parsedDates.length
    ? parsedDates.sort((a, b) => b - a)[0]
    : now;

  const baseYear = latestDate.getFullYear();

  return MONTH_NAMES.map((label, monthIndex) => ({
    key: `${baseYear}-${String(monthIndex + 1).padStart(2, "0")}`,
    year: baseYear,
    month: monthIndex,
    label: `${label} ${baseYear}`,
  })).reverse();
}

const emptyForm = { name: "", amount: "", type: "send", category: "Other", status: "Pending", note: "", date: "" };

function AddModal({ onClose, onAdd }) {
  const [form, setForm] = useState(emptyForm);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handle = () => {
    if (!form.name || !form.amount) return;

    onAdd({
      id: Date.now(),
      name: form.name,
      amount: form.amount,
      iconType: form.type,
      category: form.category,
      status: form.status,
      note: form.note,
      statusColor: statusColor[form.status],
      date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
      type: form.type === "receive" ? "income" : form.type === "transfer" ? "transfer" : "expense",
    });
    onClose();
  };

  const field = "w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-fade-in">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Add Transaction</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted"><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Transaction Name *</label>
            <input className={field} placeholder="e.g. Netflix Subscription" value={form.name} onChange={set("name")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Amount (Rs) *</label>
              <input type="number" className={field} placeholder="0.00" value={form.amount} onChange={set("amount")} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Type</label>
              <select className={field} value={form.type} onChange={set("type")}>
                {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Category</label>
              <select className={field} value={form.category} onChange={set("category")}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Status</label>
              <select className={field} value={form.status} onChange={set("status")}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Date (leave blank for today)</label>
            <input type="date" className={field} value={form.date} onChange={set("date")} />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Note (optional)</label>
            <textarea className={`${field} resize-none`} rows={2} placeholder="Any additional details..." value={form.note} onChange={set("note")} />
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg bg-muted py-2.5 text-sm">Cancel</button>
          <button onClick={handle} disabled={!form.name || !form.amount} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40">
            Add Transaction
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TransactionTable({ search: globalSearch = "" }) {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useFinance();
  const [sortDirection, setSortDirection] = useState("latest");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const perPage = 5;

  const activeSearch = globalSearch?.length > 0 ? globalSearch : "";
  const normalizedTransactions = normalizeFinanceTransactions(transactions);
  const monthOptions = useMemo(() => buildMonthOptions(normalizedTransactions), [normalizedTransactions]);

  useEffect(() => {
    const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    if (!selectedMonth || !monthOptions.some((option) => option.key === selectedMonth)) {
      const defaultMonth = monthOptions.find((option) => option.key === currentMonthKey)?.key || monthOptions[0]?.key || currentMonthKey;
      setSelectedMonth(defaultMonth);
    }
  }, [monthOptions, selectedMonth]);

  useEffect(() => {
    setPage(1);
  }, [activeSearch, sortDirection, selectedMonth]);

  const filtered = normalizedTransactions.filter((tx) => {
    const parsed = parseTxDate(tx.date);
    const monthKey = parsed ? `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}` : "";
    const matchesMonth = !selectedMonth || monthKey === selectedMonth;
    const matchesSearch = (tx.name || "").toLowerCase().includes(activeSearch.toLowerCase());
    return matchesMonth && matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortDirection === "amount-desc") {
      return parseRupeeAmount(b.amount) - parseRupeeAmount(a.amount);
    }
    if (sortDirection === "amount-asc") {
      return parseRupeeAmount(a.amount) - parseRupeeAmount(b.amount);
    }
    return (parseTxDate(b.date)?.getTime() || 0) - (parseTxDate(a.date)?.getTime() || 0);
  });

  const paginated = sorted.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));

  const handleAdd = async (tx) => {
    try {
      await addTransaction(tx);
      toast.success("Transaction added");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Add failed");
    }
  };

  const removeTx = async (id) => {
    try {
      await deleteTransaction(id);
      toast.success("Transaction deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Delete failed");
    }
  };

  const startEdit = (tx) => {
    setEditingId(tx.id);
    setEditAmount(stripDisplayedAmount(tx.amount));
  };

  const saveEdit = async (id) => {
    const tx = normalizedTransactions.find((t) => t.id === id);
    try {
      await updateTransaction(id, {
        ...tx,
        amount: editAmount,
      });
      setEditingId(null);
      toast.success("Transaction updated");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Update failed");
    }
  };

  const cycleSort = () => {
    setSortDirection((current) => {
      if (current === "latest") return "amount-desc";
      if (current === "amount-desc") return "amount-asc";
      return "latest";
    });
  };

  const sortLabel = sortDirection === "latest"
    ? "Latest"
    : sortDirection === "amount-desc"
      ? "Amount High-Low"
      : "Amount Low-High";

  return (
    <div className="stat-card animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Transactions</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none rounded-lg bg-muted px-3 py-2 pr-9 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              {monthOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <button onClick={cycleSort} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${sortDirection !== "latest" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
            <ArrowDownUp className="h-4 w-4" /> {sortLabel}
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
            <Plus className="h-4 w-4" /> Add Transaction
          </button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-border">
              <th className="py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Name</th>
              <th className="py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Category</th>
              <th className="py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Date</th>
              <th className="py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Amount</th>
              <th className="py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Status</th>
              <th className="py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan="6" className="py-8 text-center text-muted-foreground text-sm">No transactions found</td></tr>
            ) : (
              paginated.map((tx) => (
                <Fragment key={tx.id}>
                  <tr className="cursor-pointer border-b border-border/50 hover:bg-muted/30 transition-colors" onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)}>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <TxIcon type={tx.iconType} />
                        <span className="font-medium text-sm">{tx.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground whitespace-nowrap">{tx.category || "-"}</td>
                    <td className="py-4 text-sm text-muted-foreground whitespace-nowrap">{tx.date}</td>
                    <td className="py-4 font-medium text-sm">
                      {editingId === tx.id ? (
                        <input value={editAmount} onChange={(e) => setEditAmount(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-24 rounded bg-muted px-2 py-1 text-sm" />
                      ) : (
                        <span className={tx.iconType === "send" ? "text-red-400" : tx.iconType === "receive" ? "text-green-400" : ""}>
                          {tx.iconType === "send" ? "-" : tx.iconType === "receive" ? "+" : ""}{tx.amount}
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${tx.statusColor || statusColor[tx.status] || "bg-muted text-muted-foreground"}`}>{tx.status}</span>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => editingId === tx.id ? saveEdit(tx.id) : startEdit(tx)} className="rounded-lg p-1.5 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary" aria-label={editingId === tx.id ? "Save edit" : "Edit transaction"}>
                          {editingId === tx.id ? <Check className="h-4 w-4 text-green-400" /> : <Pencil className="h-4 w-4 text-blue-500" />}
                        </button>
                        <button type="button" onClick={() => removeTx(tx.id)} className="rounded-lg p-1.5 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-destructive" aria-label="Delete transaction">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === tx.id && (
                    <tr className="bg-muted/20">
                      <td colSpan="6" className="px-6 py-3 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Note: </span>{tx.note || "No note added."}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg bg-muted px-4 py-2 text-sm font-medium disabled:opacity-40 transition-colors hover:bg-muted/80">Prev</button>
        <span className="self-center text-sm text-muted-foreground">Page {page} / {totalPages}</span>
        <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="rounded-lg bg-muted px-4 py-2 text-sm font-medium disabled:opacity-40 transition-colors hover:bg-muted/80">Next</button>
      </div>

      {showAddModal && <AddModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />}
    </div>
  );
}
