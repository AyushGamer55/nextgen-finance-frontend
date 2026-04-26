import {
  clearFinanceTransactionsFromStorage,
  buildFinanceSummary,
  computeMonthlyBars,
  defaultFinanceTransactions,
  normalizeFinanceTransaction,
  normalizeFinanceTransactions,
  parseRupeeAmount,
} from "@/lib/finance.js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { transactionAPI } from "@/lib/authApi";
import { loadFinanceTransactionsFromStorage } from "@/lib/finance.js";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const FinanceContext = createContext(null);

const CATEGORY_MAP = {
  Bills: "Bills & Utilities",
  "Bills & Utilities": "Bills & Utilities",
  Shopping: "Shopping",
  Other: "Other",
  Food: "Food & Dining",
  "Food & Dining": "Food & Dining",
  Travel: "Travel",
  Healthcare: "Healthcare",
  Education: "Education",
  Savings: "Savings",
  Income: "Income",
  Salary: "Income",
  Transfer: "Transfer",
  Entertainment: "Other",
  Investment: "Savings",
};

function mapDisplayTypeToApi(iconType) {
  if (iconType === "receive") return "income";
  if (iconType === "transfer") return "transfer";
  return "expense";
}

function mapLocalTransactionToApi(transaction) {
  const amount = parseRupeeAmount(transaction.amount);
  const parsedDate = transaction.date ? new Date(transaction.date) : new Date();
  const iconType = transaction.iconType || (transaction.type === "income" ? "receive" : transaction.type === "transfer" ? "transfer" : "send");

  return {
    amount: amount > 0 ? amount : 0.01,
    description: transaction.name || transaction.description || "Imported transaction",
    category: CATEGORY_MAP[transaction.category] || "Other",
    type: transaction.type || mapDisplayTypeToApi(iconType),
    date: Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
    paymentMethod: "other",
    tags: [],
    isRecurring: false,
  };
}

export function FinanceProvider({ children }) {
  const [transactions, setTransactions] = useState(() => {
    try {
      const token = localStorage.getItem("auth_token");
      if (token) {
        return [];
      }
      const saved = localStorage.getItem("persistent_finance_data");
      return saved ? normalizeFinanceTransactions(JSON.parse(saved)) : normalizeFinanceTransactions(defaultFinanceTransactions);
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    if (!session) {
      setMigrationDone(false);
    }
  }, [session]);

  const replaceTransactions = useCallback((list) => {
    setTransactions(normalizeFinanceTransactions(list));
  }, []);

  const refreshTransactions = useCallback(async () => {
    if (!session) return [];
    const res = await transactionAPI.getAll();
    const next = res.data?.data?.transactions || [];
    replaceTransactions(next);
    return next;
  }, [session, replaceTransactions]);

  const addTransaction = useCallback(async (tx) => {
    if (!session) {
      setTransactions((prev) => [normalizeFinanceTransaction(tx), ...prev]);
      return null;
    }

    const payload = mapLocalTransactionToApi(tx);
    const res = await transactionAPI.create(payload);
    const created = res.data?.data?.transaction;

    setTransactions((prev) => [
      normalizeFinanceTransaction(created || tx),
      ...prev.filter((item) => String(item.id) !== String(created?._id || tx.id)),
    ]);

    return created;
  }, [session]);

  const updateTransaction = useCallback(async (id, patch) => {
    if (!session) {
      setTransactions((prev) =>
        prev.map((t) => String(t.id) === String(id) ? normalizeFinanceTransaction({ ...t, ...patch }) : t)
      );
      return null;
    }

    const existing = transactions.find((t) => String(t.id) === String(id));
    if (!existing) return null;

    const payload = mapLocalTransactionToApi({ ...existing, ...patch });
    const res = await transactionAPI.update(id, payload);
    const updated = res.data?.data?.transaction;

    setTransactions((prev) =>
      prev.map((t) => String(t.id) === String(id) ? normalizeFinanceTransaction(updated || { ...t, ...patch }) : t)
    );

    return updated;
  }, [session, transactions]);

  const deleteTransaction = useCallback(async (id) => {
    if (!session) {
      setTransactions((prev) => prev.filter((t) => String(t.id) !== String(id)));
      return;
    }

    await transactionAPI.remove(id);
    setTransactions((prev) => prev.filter((t) => String(t.id) !== String(id)));
  }, [session]);

  const summary = useMemo(() => buildFinanceSummary(transactions), [transactions]);

  const monthlyBarsForYear = useCallback((year) => computeMonthlyBars(transactions, year), [transactions]);

  useEffect(() => {
    if (!session || migrationDone || isLoading) {
      return;
    }

    const migrateLocalData = async () => {
      setIsLoading(true);
      try {
        const localData = loadFinanceTransactionsFromStorage();
        if (localData.length > 0) {
          await Promise.all(localData.map((transaction) => transactionAPI.create(mapLocalTransactionToApi(transaction))));
          clearFinanceTransactionsFromStorage();
          toast.success(`Migrated ${localData.length} transactions from local storage`);
        }

        await refreshTransactions();
      } catch (error) {
        console.error("Migration failed:", error);
        toast.error(error.response?.data?.message || "Data sync failed, using local demo data");
      } finally {
        setMigrationDone(true);
        setIsLoading(false);
      }
    };

    migrateLocalData();
  }, [session, migrationDone, isLoading, refreshTransactions]);

  const value = useMemo(
    () => ({
      transactions,
      summary,
      monthlyBarsForYear,
      replaceTransactions,
      refreshTransactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      isLoading,
    }),
    [transactions, summary, monthlyBarsForYear, replaceTransactions, refreshTransactions, addTransaction, updateTransaction, deleteTransaction, isLoading]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) {
    throw new Error("useFinance must be used within FinanceProvider");
  }
  return ctx;
}
