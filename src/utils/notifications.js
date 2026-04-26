const KEY = "app_notifications";
const SESSION_KEY = "notis_seeded";

function normalizeNotification(input) {
  if (typeof input === "string") {
    return {
      id: Date.now(),
      title: "Activity",
      text: input,
      type: "activity",
      source: "local",
      createdAt: new Date().toISOString(),
      read: false,
    };
  }

  return {
    id: input.id || Date.now(),
    title: input.title || "Activity",
    text: input.text || "",
    type: input.type || "activity",
    source: input.source || "local",
    createdAt: input.createdAt || new Date().toISOString(),
    read: Boolean(input.read),
  };
}

export function seedSessionNotifications() {
  if (localStorage.getItem("auth_token")) return;
  if (sessionStorage.getItem(SESSION_KEY)) return;
  sessionStorage.setItem(SESSION_KEY, "1");

  const existing = getNotifications();
  const welcome = normalizeNotification({
    title: "Welcome",
    text: "Dashboard notifications are ready. New transaction activity will appear here.",
    type: "system",
    source: "system",
  });

  localStorage.setItem(KEY, JSON.stringify([welcome, ...existing]));
  window.dispatchEvent(new Event("notifications-updated"));
}

export function getNotifications() {
  try {
    const stored = localStorage.getItem(KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addNotification(input) {
  const notes = getNotifications();
  const updated = [normalizeNotification(input), ...notes];
  localStorage.setItem(KEY, JSON.stringify(updated));
  playNotificationSound();
  window.dispatchEvent(new Event("notifications-updated"));
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const times = [0, 0.12];
    times.forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime + t);
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + t + 0.08);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.18);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.18);
    });
  } catch {
    // Ignore audio failures.
  }
}

export function markNotificationRead(id) {
  const notes = getNotifications().map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  localStorage.setItem(KEY, JSON.stringify(notes));
  window.dispatchEvent(new Event("notifications-updated"));
}

export function clearNotifications() {
  localStorage.setItem(KEY, JSON.stringify([]));
  window.dispatchEvent(new Event("notifications-updated"));
}

export function resetSessionNotifications() {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("notifications-updated"));
}
