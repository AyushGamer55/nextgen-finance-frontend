const BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000";

function getAuthHeaders() {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || "Login failed");
  }

  return res.json();
}

export async function uploadTransactionsCsv(file, userId) {
  const form = new FormData();
  form.append("file", file);
  form.append("userId", userId);

  const res = await fetch(`${BASE}/api/upload/preview`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: form,
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = payload.message || payload.error || `Upload failed (${res.status})`;
    throw new Error(msg);
  }

  if (!payload.success || !payload.data?.previewId) {
    throw new Error("Unexpected response from server");
  }

  return payload;
}

export async function confirmTransactionsImport(previewId) {
  const res = await fetch(`${BASE}/api/upload/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ previewId }),
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = payload.message || payload.error || `Import failed (${res.status})`;
    throw new Error(msg);
  }

  if (!payload.success || !payload.data?.summary) {
    throw new Error("Unexpected response from server");
  }

  return payload;
}

export async function downloadGeneratedTransactionsCsv({ rows = 500, features = 4 } = {}) {
  const params = new URLSearchParams({
    rows: String(rows),
    features: String(features),
  });

  const res = await fetch(`${BASE}/api/upload/generate?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.message || payload.error || "CSV generation failed");
  }

  return res.blob();
}

export { BASE as API_BASE_URL };
