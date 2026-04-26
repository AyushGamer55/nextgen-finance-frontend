import { calculateGrowth } from "@/utils/dashboardUtils.js";

export const FINANCE_STORAGE_KEY = "finance_transactions_v1";
export const LEGACY_TX_KEY = "dashboard_transactions";

export const FINANCE_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const defaultFinanceTransactions = [
  { id: 1, name: "Twitter Verify Fee", iconType: "other", category: "Bills", date: "Sat, 20 Apr 2023", amount: "Rs 90", status: "Review", note: "" },
  { id: 2, name: "Facebook Ads Fee", iconType: "send", category: "Shopping", date: "Fri, 09 Apr 2022", amount: "Rs 100", status: "Pending", note: "" },
  { id: 3, name: "Instagram Ads Fee", iconType: "receive", category: "Other", date: "Tue, 18 Dec 2021", amount: "Rs 200", status: "Success", note: "" },
];

const STATUS_COLORS = {
  Success: "text-success bg-success/20",
  Pending: "text-warning bg-warning/20",
  Review: "text-info bg-info/20",
  Failed: "text-destructive bg-destructive/20",
};

export function parseRupeeAmount(amount) {
  if (amount == null) return 0;
  if (typeof amount === "number" && !Number.isNaN(amount)) return amount;

  const s = String(amount)
    .replace(/Rs\s*/gi, "")
    .replace(/[^0-9.-]/g, "")
    .replace(/,/g, "")
    .trim();

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export function parseTxDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function formatFinanceAmount(amount) {
  const value = parseRupeeAmount(amount);
  return `Rs ${value.toLocaleString("en-IN")}`;
}

export function formatFinanceDate(dateStr) {
  const parsed = parseTxDate(dateStr);
  if (!parsed) return dateStr || "No date";
  return parsed.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function normalizeFinanceTransaction(tx, index = 0) {
  const type = tx?.iconType || (tx?.type === "income" ? "receive" : tx?.type === "expense" ? "send" : tx?.type === "transfer" ? "transfer" : "other");
  const status = tx?.status || "Success";

  return {
    ...tx,
    id: tx?.id || tx?._id || `tx-${Date.now()}-${index}`,
    name: tx?.name || tx?.description || "Untitled transaction",
    description: tx?.description || tx?.name || "Untitled transaction",
    iconType: type,
    type: tx?.type || (type === "receive" ? "income" : type === "send" ? "expense" : "transfer"),
    category: tx?.category || "Other",
    date: formatFinanceDate(tx?.date),
    amount: formatFinanceAmount(tx?.amount),
    status,
    statusColor: tx?.statusColor || STATUS_COLORS[status] || "text-muted-foreground bg-muted",
    note: tx?.note || "",
  };
}

export function normalizeFinanceTransactions(list) {
  if (!Array.isArray(list)) return [];
  return list.map((tx, index) => normalizeFinanceTransaction(tx, index));
}

export function getLatestTransactionYear(transactions, fallbackYear) {
  let latest = null;
  for (const tx of normalizeFinanceTransactions(transactions)) {
    const d = parseTxDate(tx.date);
    if (!d) continue;
    if (!latest || d > latest) latest = d;
  }
  return latest ? latest.getFullYear() : fallbackYear;
}

export function loadFinanceTransactionsFromStorage() {
  try {
    const v1 = localStorage.getItem(FINANCE_STORAGE_KEY);
    if (v1) return JSON.parse(v1);

    const legacy = localStorage.getItem(LEGACY_TX_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(parsed));
      localStorage.removeItem(LEGACY_TX_KEY);
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function clearFinanceTransactionsFromStorage() {
  localStorage.removeItem(FINANCE_STORAGE_KEY);
  localStorage.removeItem(LEGACY_TX_KEY);
}

export function persistFinanceTransactions(list) {
  localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(list));
}

export function computeMonthlyBars(transactions, year) {
  const y = Number(year);
  const buckets = FINANCE_MONTHS.map((month) => ({ month, main: 0, others: 0 }));

  for (const tx of normalizeFinanceTransactions(transactions)) {
    const d = parseTxDate(tx.date);
    if (!d || d.getFullYear() !== y) continue;
    if (tx.type === "transfer") continue;
    const mi = d.getMonth();
    const amt = parseRupeeAmount(tx.amount);
    if (tx.type === "income" || tx.iconType === "receive") buckets[mi].main += amt;
    else if (tx.type === "expense" || tx.iconType === "send") buckets[mi].others += amt;
  }
  return buckets;
}

export function computeCategoryExpensePie(transactions) {
  const map = new Map();
  for (const tx of normalizeFinanceTransactions(transactions)) {
    if (tx.type !== "expense") continue;
    const cat = tx.category || "Other";
    map.set(cat, (map.get(cat) || 0) + parseRupeeAmount(tx.amount));
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function filterTransactionsByYear(transactions, year) {
  const y = Number(year);
  return normalizeFinanceTransactions(transactions).filter((tx) => {
    const d = parseTxDate(tx.date);
    return d && d.getFullYear() === y;
  });
}

export function buildFinanceSummary(transactions) {
  const normalized = normalizeFinanceTransactions(transactions);
  let totalIncome = 0;
  let totalExpenses = 0;
  for (const tx of normalized) {
    const amt = parseRupeeAmount(tx.amount);
    if (tx.type === "income" || tx.iconType === "receive") totalIncome += amt;
    else if (tx.type === "expense" || tx.iconType === "send") totalExpenses += amt;
  }
  const netSavings = totalIncome - totalExpenses;
  const totalTransactions = normalized.length;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const y = new Date().getFullYear();
  const m = new Date().getMonth();
  const bars = computeMonthlyBars(normalized, y);
  const expCurr = bars[m]?.others ?? 0;
  let expPrev = 0;
  if (m > 0) expPrev = bars[m - 1]?.others ?? 0;
  else {
    const prevDec = computeMonthlyBars(normalized, y - 1)[11];
    expPrev = prevDec?.others ?? 0;
  }
  const expenseMoMGrowth = calculateGrowth(expCurr, expPrev);
  const categoryExpensePie = computeCategoryExpensePie(normalized);

  const trailingMonths = [];
  const now = new Date();
  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const monthKey = date.toISOString().slice(0, 7);
    let income = 0;
    let expenses = 0;

    for (const tx of normalized) {
      const parsed = parseTxDate(tx.date);
      if (!parsed) continue;
      if (parsed.getFullYear() !== date.getFullYear() || parsed.getMonth() !== date.getMonth()) {
        continue;
      }

      const amount = parseRupeeAmount(tx.amount);
      if (tx.type === "income" || tx.iconType === "receive") income += amount;
      else if (tx.type === "expense" || tx.iconType === "send") expenses += amount;
    }

    trailingMonths.push({
      month: monthKey,
      label: date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      income,
      expenses,
      net: income - expenses,
    });
  }

  const activeExpenseMonths = trailingMonths.filter((month) => month.expenses > 0);
  const averageMonthlyExpenses = activeExpenseMonths.length
    ? activeExpenseMonths.reduce((sum, month) => sum + month.expenses, 0) / activeExpenseMonths.length
    : 0;
  const emergencyFundTarget = averageMonthlyExpenses * 6;
  const expenseRunwayMonths = averageMonthlyExpenses > 0 ? Math.max(0, netSavings) / averageMonthlyExpenses : 0;

  return {
    totalIncome,
    totalExpenses,
    netSavings,
    totalTransactions,
    savingsRate,
    expenseMoMGrowth,
    categoryExpensePie,
    topExpenseCategory: categoryExpensePie[0] || null,
    trailingMonths,
    averageMonthlyExpenses,
    emergencyFundTarget,
    expenseRunwayMonths,
  };
}

export function buildAccountPortfolio(totalBalance) {
  const safeBalance = Math.max(0, Math.round(parseRupeeAmount(totalBalance)));
  const operating = Math.round(safeBalance * 0.55);
  const savings = Math.round(safeBalance * 0.3);
  const card = Math.max(0, safeBalance - operating - savings);

  return [
    {
      key: "main",
      name: "Main account",
      type: "Checking",
      balance: operating,
    },
    {
      key: "savings",
      name: "Savings vault",
      type: "Savings",
      balance: savings,
    },
    {
      key: "card",
      name: "Card balance",
      type: "Debit card",
      balance: card,
    },
  ];
}
