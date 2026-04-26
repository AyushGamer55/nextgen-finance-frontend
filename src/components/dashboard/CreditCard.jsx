import { useState, useCallback } from "react";
import { Eye, EyeOff, Snowflake, Unlock, CreditCard as CardIcon, ArrowRightLeft, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/utils/dashboardUtils.js";

function getProfileName() {
  try {
    const p = localStorage.getItem("settings_profile");
    return p ? JSON.parse(p).name : "Card Holder";
  } catch {
    return "Card Holder";
  }
}

function formatCardNumber(num, visible) {
  if (visible) return num;
  return num.replace(/\d{4} \d{4} \d{4} /, "•••• •••• •••• ");
}

function CardChip() {
  return (
    <div className="relative h-10 w-14 rounded-md bg-gradient-to-br from-amber-200 via-yellow-300 to-amber-400 shadow-inner overflow-hidden">
      <div className="absolute inset-0 opacity-40">
        <div className="grid grid-cols-3 grid-rows-3 h-full w-full gap-[1px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-amber-600/30" />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-5 w-7 rounded-sm border border-amber-600/40 bg-amber-300/50" />
      </div>
    </div>
  );
}

function NfcIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white/70" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 8.5a6.5 6.5 0 0 1 13 0V17a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8.5Z" />
      <path d="M9 12h.01M12 12h.01M15 12h.01" strokeLinecap="round" />
      <path d="M8 8.5c0-2.2 1.8-4 4-4s4 1.8 4 4" />
    </svg>
  );
}

function VisaLogo() {
  return (
    <svg viewBox="0 0 48 16" className="h-5 w-auto text-white/90" fill="currentColor">
      <path d="M17.68 1.5l-4.2 10h-2.8l-2-7.8c-.1-.5-.2-.7-.5-.9C6.9 2.2 5.5 1.7 4 1.4l.1-.4h4.6c.6 0 1.1.4 1.2 1.1l1 5.5L13.2 1.5h2.5zm13.4 6.7c0-2.6-3.6-2.8-3.6-3.9 0-.4.3-.8 1.1-.9.4 0 1.4-.1 2.6.5l.5-2.2c-.6-.2-1.4-.4-2.4-.4-2.5 0-4.3 1.3-4.3 3.2 0 1.4 1 2.2 2.2 2.6 1 .4 1.3.7 1.3 1.1 0 .6-.8.9-1.5.9-1.3 0-2-.3-2.6-.6l-.5 2.3c.6.3 1.7.5 2.8.5 2.7 0 4.4-1.3 4.4-3.1zm7.2 3.3h2.2l-1.9-10h-2c-.5 0-.9.3-1.1.7l-3.9 9.3h2.5l.5-1.5h3.1l.3 1.5zm-2.7-3.3l1.3-3.5.7 3.5h-2zm-9.3-6.7l-2 10h-2.4l2-10h2.4z" />
    </svg>
  );
}

export const CreditCard = ({ balance, onManageCard, onTransfer }) => {
  const cardHolder = getProfileName();
  const [showNumber, setShowNumber] = useState(false);
  const [isFrozen, setIsFrozen] = useState(() => {
    try {
      const saved = localStorage.getItem("dashboard_card_controls");
      return saved ? JSON.parse(saved).frozen : false;
    } catch {
      return false;
    }
  });

  const cardNumber = "1234 5678 9876 5432";
  const expiry = "12/28";
  const cvv = "842";

  const toggleFreeze = useCallback(() => {
    const next = !isFrozen;
    setIsFrozen(next);
    try {
      const saved = localStorage.getItem("dashboard_card_controls");
      const parsed = saved ? JSON.parse(saved) : { limit: "50000" };
      localStorage.setItem("dashboard_card_controls", JSON.stringify({ ...parsed, frozen: next }));
    } catch {
      localStorage.setItem("dashboard_card_controls", JSON.stringify({ frozen: next, limit: "50000" }));
    }
  }, [isFrozen]);

  return (
    <div className="space-y-5">
      {/* Realistic Card */}
      <div
        className="group relative flex h-56 flex-col justify-between overflow-hidden rounded-3xl p-6 text-white shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #4c1d95 50%, #701a75 75%, #0f172a 100%)",
        }}
      >
        {/* Noise texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Shine sweep on hover */}
        <div className="pointer-events-none absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white/10 opacity-0 transition-all duration-700 group-hover:animate-shine-sweep group-hover:opacity-100" />

        {/* Subtle border glow */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />

        {/* Top row: Chip + NFC + Visa */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <CardChip />
            <NfcIcon />
          </div>
          <VisaLogo />
        </div>

        {/* Card Number */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <p className="font-mono text-lg tracking-[0.2em] drop-shadow-md">
              {formatCardNumber(cardNumber, showNumber)}
            </p>
            <button
              onClick={() => setShowNumber(!showNumber)}
              className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label={showNumber ? "Hide card number" : "Show card number"}
              title={showNumber ? "Hide number" : "Show number"}
            >
              {showNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Bottom row: Holder + Expiry + CVV */}
        <div className="relative z-10 flex items-end justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-white/50">Card Holder</p>
            <p className="truncate text-sm font-semibold tracking-wide drop-shadow-md">{cardHolder}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-white/50">Expires</p>
            <p className="text-sm font-semibold tracking-wide drop-shadow-md">{expiry}</p>
          </div>
          {showNumber && (
            <div className="ml-4 text-right">
              <p className="text-[10px] uppercase tracking-wider text-white/50">CVV</p>
              <p className="text-sm font-semibold tracking-wide drop-shadow-md">{cvv}</p>
            </div>
          )}
        </div>

        {/* Frozen overlay */}
        {isFrozen && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-3xl bg-black/70 backdrop-blur-sm">
            <Snowflake className="mb-2 h-10 w-10 text-blue-300" />
            <span className="text-lg font-bold tracking-widest text-white">FROZEN</span>
          </div>
        )}
      </div>

      {/* Balance */}
      <div className="rounded-xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Available Balance</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(balance || 0)}</h2>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={toggleFreeze}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background ${
            isFrozen
              ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 focus:ring-green-500"
              : "bg-red-500/10 text-red-400 hover:bg-red-500/20 focus:ring-red-400"
          }`}
          aria-label={isFrozen ? "Unfreeze card" : "Freeze card"}
        >
          {isFrozen ? <Unlock className="h-3.5 w-3.5" /> : <Snowflake className="h-3.5 w-3.5" />}
          {isFrozen ? "Unfreeze" : "Freeze"}
        </button>

        <button
          onClick={onTransfer}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 px-3 py-2.5 text-xs font-medium text-primary transition-all duration-200 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
          aria-label="Transfer money"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          Transfer
        </button>

        <button
          onClick={onManageCard}
          className="flex items-center justify-center gap-2 rounded-xl bg-muted px-3 py-2.5 text-xs font-medium text-foreground transition-all duration-200 hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
          aria-label="Manage card settings"
        >
          <CardIcon className="h-3.5 w-3.5" />
          Manage
        </button>

        <button
          className="flex items-center justify-center gap-2 rounded-xl bg-muted px-3 py-2.5 text-xs font-medium text-foreground transition-all duration-200 hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
          aria-label="Card security"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Security
        </button>
      </div>
    </div>
  );
};

