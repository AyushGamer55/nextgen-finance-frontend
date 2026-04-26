import { useMemo, useRef, useState } from "react";
import {
  Bell,
  Camera,
  Eye,
  EyeOff,
  Palette,
  Save,
  Shield,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { useAuth } from "@/context/AuthContext";
import { authAPI, userAPI } from "@/lib/authApi";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: Shield },
];

function initialsFromName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "AY";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { session, refreshSession, setSessionUser } = useAuth();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [profile, setProfile] = useState(() => ({
    name: session?.name || "Ayush",
    email: session?.email || "ayush@example.com",
    phone: session?.phone || "",
    bio: session?.bio || "",
    avatar: session?.avatar || "",
  }));

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("settings_notifications");
    return saved ? JSON.parse(saved) : {
      emailAlerts: true,
      pushAlerts: false,
      transactionAlerts: true,
      weeklyReport: true,
      securityAlerts: true,
    };
  });

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const profilePreview = useMemo(() => ({
    name: profile.name || session?.name || "Ayush",
    email: profile.email || session?.email || "ayush@example.com",
    avatar: profile.avatar || "",
  }), [profile, session]);

  const handlePickAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfile((prev) => ({ ...prev, avatar: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await userAPI.update(profile);
      const user = res.data?.data?.user;
      if (user) {
        setSessionUser(user);
        setProfile({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          bio: user.bio || "",
          avatar: user.avatar || "",
        });
      }
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Profile update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveNotifications = () => {
    localStorage.setItem("settings_notifications", JSON.stringify(notifications));
    toast.success("Notification preferences saved");
  };

  const handlePasswordChange = async () => {
    if (!security.newPassword || security.newPassword !== security.confirmPassword) return;
    setChangingPassword(true);
    try {
      await authAPI.changePassword({
        currentPassword: security.currentPassword,
        newPassword: security.newPassword,
      });
      setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Password change failed");
    } finally {
      setChangingPassword(false);
    }
  };

  const syncLatestProfile = async () => {
    const user = await refreshSession();
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
        avatar: user.avatar || "",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <Header userName="Settings" />

        <div className="mt-6 grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="stat-card h-fit">
            <div className="flex flex-col items-center text-center">
              {profilePreview.avatar ? (
                <img
                  src={profilePreview.avatar}
                  alt="Profile"
                  className="h-20 w-20 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-xl font-bold text-white">
                  {initialsFromName(profilePreview.name)}
                </div>
              )}
              <p className="mt-4 text-lg font-semibold">{profilePreview.name}</p>
              <p className="text-sm text-muted-foreground">{profilePreview.email}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium"
              >
                <Camera className="h-4 w-4" />
                Update photo
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePickAvatar} className="hidden" />
            </div>

            <div className="mt-6 space-y-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </aside>

          <section className="stat-card animate-fade-in">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-primary">Profile</p>
                  <h2 className="mt-1 text-2xl font-semibold">Personal details</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Keep your identity, contact information, and photo current so your finance workspace feels personal and trustworthy.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Full name</label>
                    <input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full rounded-xl bg-muted px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full rounded-xl bg-muted px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Phone</label>
                    <input
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full rounded-xl bg-muted px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Sandbox UPI</label>
                    <input
                      value={session?.sandboxUpiId || ""}
                      disabled
                      className="w-full rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={4}
                    className="w-full resize-none rounded-xl bg-muted px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Tell us a little about how you use MountDash"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
                  >
                    <Save className="h-4 w-4" />
                    {savingProfile ? "Saving..." : "Save profile"}
                  </button>
                  <button
                    onClick={syncLatestProfile}
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium"
                  >
                    <Upload className="h-4 w-4" />
                    Refresh from server
                  </button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-primary">Notifications</p>
                  <h2 className="mt-1 text-2xl font-semibold">Alert preferences</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Choose which updates should interrupt you and which can stay quietly inside your dashboard.
                  </p>
                </div>

                {[
                  { key: "emailAlerts", label: "Email alerts", desc: "Receive critical account updates by email" },
                  { key: "pushAlerts", label: "Push notifications", desc: "Allow browser alerts for new activity" },
                  { key: "transactionAlerts", label: "Transaction alerts", desc: "Get notified when money moves" },
                  { key: "weeklyReport", label: "Weekly report", desc: "Get a weekly summary of your financial activity" },
                  { key: "securityAlerts", label: "Security alerts", desc: "Get notified about sign-ins and password changes" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between rounded-xl border border-border px-4 py-4">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [key]: !notifications[key] })}
                      className={`relative h-6 w-11 rounded-full transition-colors ${notifications[key] ? "bg-primary" : "bg-muted"}`}
                    >
                      <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${notifications[key] ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                ))}

                <div className="border-t border-border pt-4">
                  <button
                    onClick={handleSaveNotifications}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                  >
                    <Save className="h-4 w-4" />
                    Save notification settings
                  </button>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-primary">Appearance</p>
                  <h2 className="mt-1 text-2xl font-semibold">Theme and feel</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Keep the workspace comfortable for long budgeting, analytics, and reporting sessions.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {["light", "dark", "system"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTheme(mode)}
                      className={`rounded-2xl border-2 p-5 text-left transition-all ${theme === mode ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}
                    >
                      <p className="text-sm font-semibold capitalize">{mode}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {mode === "light" ? "Clean daylight workspace" : mode === "dark" ? "Lower glare during long sessions" : "Follow your device setting"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-primary">Security</p>
                  <h2 className="mt-1 text-2xl font-semibold">Protect your account</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Change your password with real backend validation. This updates your actual account, not just local browser state.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { label: "Current password", key: "currentPassword" },
                    { label: "New password", key: "newPassword" },
                    { label: "Confirm new password", key: "confirmPassword" },
                  ].map(({ label, key }) => (
                    <div key={key} className={key === "confirmPassword" ? "md:col-span-2" : ""}>
                      <label className="mb-1 block text-sm text-muted-foreground">{label}</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={security[key]}
                          onChange={(e) => setSecurity({ ...security, [key]: e.target.value })}
                          className="w-full rounded-xl bg-muted px-4 py-3 pr-11 text-sm outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {security.newPassword && security.newPassword !== security.confirmPassword && (
                  <p className="text-sm text-red-400">New password and confirmation do not match.</p>
                )}

                <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  Use at least 6 characters. A longer password with a mix of letters, numbers, and symbols is much stronger.
                </div>

                <div className="border-t border-border pt-4">
                  <button
                    onClick={handlePasswordChange}
                    disabled={changingPassword || !security.currentPassword || !security.newPassword || security.newPassword !== security.confirmPassword}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
                  >
                    <Shield className="h-4 w-4" />
                    {changingPassword ? "Updating..." : "Update password"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
