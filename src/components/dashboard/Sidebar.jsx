import {
  LayoutDashboard,
  BarChart3,
  Wallet,
  Settings,
  Moon,
  Sun,
  UploadCloud,
  FileText,
  LineChart,
  Landmark,
  LogIn,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: UploadCloud, label: "Import CSV", path: "/upload" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: FileText, label: "Report", path: "/report" },
  { icon: LineChart, label: "Invest", path: "/invest" },
  { icon: Wallet, label: "Wallet", path: "/wallet" },
  { icon: Landmark, label: "Accounts", path: "/accounts" },
];

export function Sidebar() {
  const { theme, setTheme } = useTheme();
  const [isDark, setIsDark] = useState(true);
  const location = useLocation();
  const { session, logout, isAuthed } = useAuth();

  return (
    <aside className="w-56 min-h-screen bg-sidebar p-4 flex flex-col border-r border-sidebar-border">
      <Link
        to="/dashboard"
        className="flex items-center gap-2 px-2 mb-8 rounded-lg hover:opacity-90 transition-opacity"
      >
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary-foreground" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="font-semibold text-foreground text-lg">MountDash</span>
      </Link>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`w-full sidebar-item ${isActive ? "sidebar-item-active" : ""}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 pt-4 border-t border-sidebar-border">
        {isAuthed ? (
          <div className="px-3 py-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <p className="font-medium text-foreground truncate">{session?.name}</p>
            <p className="truncate">{session?.email}</p>
            <button
              type="button"
              onClick={() => logout()}
              className="mt-2 flex items-center gap-2 text-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className={`w-full sidebar-item ${location.pathname === "/login" ? "sidebar-item-active" : ""}`}
          >
            <LogIn className="w-5 h-5" />
            <span className="font-medium">Sign in</span>
          </Link>
        )}

        <Link
          to="/settings"
          className={`w-full sidebar-item ${location.pathname === "/settings" ? "sidebar-item-active" : ""}`}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </Link>

        <div className="flex items-center gap-2 px-4 py-2">
          <button
            type="button"
            onClick={() => {
              setIsDark(!isDark);
              setTheme(theme === "dark" ? "light" : "dark");
            }}
            className="flex items-center gap-2 text-muted-foreground"
          >
            <div className="relative w-12 h-6 bg-muted rounded-full p-1 transition-colors">
              <div
                className={`absolute w-4 h-4 rounded-full bg-primary transition-transform ${
                  isDark ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </div>
            {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
