import { Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { notificationAPI } from "@/lib/authApi";
import { connectNotificationSocket, disconnectNotificationSocket } from "@/lib/notificationSocket";
import { clearNotifications, getNotifications, markNotificationRead, resetSessionNotifications } from "@/utils/notifications";

function formatNotificationTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function Header({ userName }) {
  const { session } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(() => []);

  useEffect(() => {
    if (session) {
      resetSessionNotifications();
      setNotifications([]);
      return undefined;
    }

    setNotifications(getNotifications());
    const sync = () => setNotifications(getNotifications());
    window.addEventListener("notifications-updated", sync);
    return () => window.removeEventListener("notifications-updated", sync);
  }, [session]);

  useEffect(() => {
    if (!session) {
      disconnectNotificationSocket();
      return undefined;
    }

    let active = true;
    const syncFromServer = async () => {
      try {
        const res = await notificationAPI.list();
        if (active) {
          setNotifications(res.data?.data?.notifications || []);
        }
      } catch (error) {
        console.error("Notification fetch failed:", error);
      }
    };

    syncFromServer();

    const token = localStorage.getItem("auth_token");
    const socket = connectNotificationSocket(token);
    const handleNew = (payload) => {
      if (!active || !payload) return;
      setNotifications((current) => {
        const next = [payload, ...current.filter((item) => String(item._id || item.id) !== String(payload._id || payload.id))];
        return next.slice(0, 40);
      });
    };

    const handleUpdated = (payload) => {
      if (!active || !payload) return;
      setNotifications((current) =>
        current.map((item) => (
          String(item._id || item.id) === String(payload._id || payload.id) ? { ...item, ...payload } : item
        ))
      );
    };

    const handleAllRead = () => {
      if (!active) return;
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    };

    const handleCleared = () => {
      if (!active) return;
      setNotifications([]);
    };

    socket?.on("notification:new", handleNew);
    socket?.on("notification:updated", handleUpdated);
    socket?.on("notification:all-read", handleAllRead);
    socket?.on("notification:cleared", handleCleared);

    return () => {
      active = false;
      socket?.off("notification:new", handleNew);
      socket?.off("notification:updated", handleUpdated);
      socket?.off("notification:all-read", handleAllRead);
      socket?.off("notification:cleared", handleCleared);
    };
  }, [session]);

  const handleMarkRead = (id) => {
    if (session) {
      notificationAPI
        .markRead(id)
        .then((res) => setNotifications((current) =>
          current.map((note) => (note._id === id || note.id === id ? res.data?.data?.notification || note : note))
        ))
        .catch((error) => console.error("Notification read failed:", error));
      return;
    }
    markNotificationRead(id);
    setNotifications(getNotifications());
  };

  const handleClear = () => {
    if (session) {
      notificationAPI
        .clear()
        .then(() => setNotifications([]))
        .catch((error) => console.error("Notification clear failed:", error));
      return;
    }
    clearNotifications();
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mb-8 flex items-center justify-between animate-fade-in">
      <h1 className="text-3xl font-bold text-foreground">{userName}</h1>

      <div className="relative flex items-center gap-4">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-muted/50"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-14 z-50 w-72 rounded-lg border border-border bg-card p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">Notifications</p>
              {notifications.length > 0 && (
                <button onClick={handleClear} className="text-xs text-primary">
                  Clear all
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <p className="py-2 text-xs text-muted-foreground">No notifications</p>
            ) : (
              <div className="max-h-72 space-y-1 overflow-y-auto">
                {notifications.map((note) => (
                  <div
                    key={note._id || note.id}
                    onClick={() => handleMarkRead(note._id || note.id)}
                    className={`cursor-pointer rounded border-b border-border px-2 py-2 text-sm transition-opacity last:border-none hover:bg-muted ${
                      note.read ? "opacity-50" : "font-medium"
                    }`}
                  >
                    <p>{note.title || "Activity"}</p>
                    <p className="mt-0.5 text-xs font-normal text-muted-foreground">{note.text}</p>
                    {note.createdAt && (
                      <p className="mt-1 text-[11px] font-normal text-muted-foreground/80">
                        {formatNotificationTime(note.createdAt)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
