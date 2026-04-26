const ALLOWED_CATEGORIES = new Set([
  "Shopping",
  "Food",
  "Salary",
  "Transfer",
  "Bills",
  "Entertainment",
  "Investment",
  "Other",
]);

export const DEMO_USER_ID_STORAGE_KEY = "finance_demo_user_id";
export const DEFAULT_DEMO_USER_ID = "demo-user";

export function getDemoUserId() {
  try {
    let id = localStorage.getItem(DEMO_USER_ID_STORAGE_KEY);
    if (!id || !id.trim()) {
      id = DEFAULT_DEMO_USER_ID;
      localStorage.setItem(DEMO_USER_ID_STORAGE_KEY, id);
    }
    return id.trim();
  } catch {
    return DEFAULT_DEMO_USER_ID;
  }
}

export function setDemoUserId(id) {
  const v = String(id || "").trim() || DEFAULT_DEMO_USER_ID;
  localStorage.setItem(DEMO_USER_ID_STORAGE_KEY, v);
  return v;
}

function normalizeCategory(raw) {
  const s = String(raw || "other").trim();
  if (!s) return "Other";
  const titled = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return ALLOWED_CATEGORIES.has(titled) ? titled : "Other";
}

function pickName(row) {
  const candidates = [
    row.description,
    row.narration,
    row.name,
    row.merchant,
    row.payee,
    row.details,
    row.particulars,
    row.memo,
    row.note,
  ];
  for (const c of candidates) {
    if (c != null && String(c).trim()) {
      return String(c).trim().slice(0, 200);
    }
  }
  return "Imported transaction";
}

function pickRawDate(row) {
  const candidates = [
    row.date,
    row.Date,
    row.transaction_date,
    row.txn_date,
    row.posted_date,
    row.value_date,
  ];
  for (const c of candidates) {
    if (c != null && String(c).trim()) return String(c).trim();
  }
  return "";
}

function formatTxDate(raw) {
  if (!raw) {
    return new Date().toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return new Date().toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Map backend cleaned CSV row → dashboard transaction shape.
 */
export function mapServerRowToTransaction(row, index) {
  const amountNum = Math.abs(Number(row.amount) || 0);
  const isIncome = row.type === "income";

  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `import-${Date.now()}-${index}`,
    name: pickName(row),
    iconType: isIncome ? "receive" : "send",
    category: normalizeCategory(row.category),
    date: formatTxDate(pickRawDate(row)),
    amount: `₹${amountNum}`,
    status: "Success",
    statusColor: "text-success bg-success/20",
    note: "",
  };
}

export function mapImportPayloadToTransactions(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row, i) => mapServerRowToTransaction(row?.normalized || row, i));
}
