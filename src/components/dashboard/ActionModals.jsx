import { useMemo, useState } from "react";
import { Check, Copy, CreditCard, Download, Loader2, Send, ArrowDownToLine, X } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import { transferAPI, userAPI } from "@/lib/authApi";
import { formatFinanceAmount } from "@/lib/finance.js";

function Modal({ title, icon: Icon, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-fade-in">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-sm text-muted-foreground">{label}</label>
      <input
        {...props}
        className="w-full rounded-lg bg-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

function PrimaryBtn({ children, ...props }) {
  return (
    <button
      {...props}
      className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function resolveRecipientPayload(value) {
  const input = String(value || "").trim();
  if (!input) return {};
  if (/^\d{10,18}$/.test(input)) return { recipientAccountNumber: input };
  if (/@mountdash$/i.test(input)) return { recipientUpiId: input.toLowerCase() };
  return { recipientEmail: input.toLowerCase() };
}

function useCardControls() {
  const STORAGE_KEY = "dashboard_card_controls";
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { frozen: false, limit: "50000" };
    } catch {
      return { frozen: false, limit: "50000" };
    }
  });

  const update = (patch) => {
    const next = { ...state, ...patch };
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return [state, update];
}

export function SendModal({ onClose }) {
  const { refreshTransactions } = useFinance();
  const { refreshSession } = useAuth();
  const [form, setForm] = useState({ recipient: "", amount: "", note: "" });
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const searchRecipients = async (query) => {
    if (query.trim().length < 2) {
      setRecipients([]);
      return;
    }

    try {
      setSearching(true);
      const res = await userAPI.lookup(query.trim());
      setRecipients(res.data?.data?.users || []);
    } catch {
      setRecipients([]);
    } finally {
      setSearching(false);
    }
  };

  const handle = async () => {
    if (!form.recipient || !form.amount) return;
    setLoading(true);
    try {
      const payload = {
        ...resolveRecipientPayload(form.recipient),
        amount: Number(form.amount),
        description: form.note,
      };
      const res = await transferAPI.send(payload);
      const transfer = res.data?.data?.transfer;
      toast.success(`?${Number(transfer?.amount || 0).toLocaleString("en-IN")} sent to ${transfer?.recipient?.name || "recipient"}`);
      await Promise.all([refreshTransactions(), refreshSession()]);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Send failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Send Money" icon={Send} onClose={onClose}>
      <Input
        label="Recipient email, sandbox UPI, or account number"
        placeholder="name@example.com or user.123456@mountdash"
        value={form.recipient}
        onChange={(e) => {
          set("recipient")(e);
          searchRecipients(e.target.value);
        }}
      />
      {searching && <p className="-mt-2 mb-3 text-xs text-muted-foreground">Searching users...</p>}
      {recipients.length > 0 && (
        <div className="mb-4 rounded-xl border border-border bg-muted/30 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Matching users</p>
          <div className="space-y-2">
            {recipients.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, recipient: user.sandboxUpiId }))}
                className="flex w-full items-center justify-between rounded-lg bg-background px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span>
                  <span className="font-medium text-foreground">{user.name}</span>
                  <span className="ml-2 text-muted-foreground">{user.email}</span>
                </span>
                <span className="text-xs text-primary">{user.sandboxUpiId}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <Input label="Amount (Rs)" type="number" placeholder="0.00" value={form.amount} onChange={set("amount")} />
      <Input label="Note (optional)" placeholder="e.g. Rent payment" value={form.note} onChange={set("note")} />
      <PrimaryBtn onClick={handle} disabled={loading || !form.recipient || !form.amount}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Transfer Now
      </PrimaryBtn>
    </Modal>
  );
}

export function ReceiveModal({ onClose }) {
  const { session, refreshSession } = useAuth();
  const { addTransaction, refreshTransactions } = useFinance();
  const [copied, setCopied] = useState(null);
  const [form, setForm] = useState({ sender: "", amount: "", note: "" });
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const profile = useMemo(() => session || {}, [session]);

  const copy = async (value, key) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleReceive = async () => {
    if (!form.sender || !form.amount) return;

    try {
      await addTransaction({
        id: Date.now(),
        name: `Received from ${form.sender}`,
        iconType: "receive",
        category: "Income",
        date: new Date().toISOString(),
        amount: form.amount,
        status: "Success",
        note: form.note || "Incoming transfer",
        type: "income",
      });
      await Promise.all([refreshTransactions(), refreshSession()]);
      toast.success(`${formatFinanceAmount(form.amount)} received from ${form.sender}`);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Receive failed");
    }
  };

  return (
    <Modal title="Receive Money" icon={Download} onClose={onClose}>
      <p className="mb-4 text-sm text-muted-foreground">
        Share your live sandbox details or log an incoming payment that already happened.
      </p>

      {[
        { label: "UPI ID", value: profile?.sandboxUpiId || "-", key: "upi" },
        { label: "Account Number", value: profile?.sandboxAccountNumber || "-", key: "acc" },
        { label: "IFSC", value: profile?.sandboxIfsc || "-", key: "ifsc" },
      ].map(({ label, value, key }) => (
        <div key={key} className="mb-3 flex items-center justify-between rounded-lg bg-muted px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium">{value}</p>
          </div>
          {value !== "-" && (
            <button onClick={() => copy(value, key)} className="rounded-lg p-1.5 hover:bg-background">
              {copied === key ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
            </button>
          )}
        </div>
      ))}

      <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4">
        <p className="mb-3 text-sm font-medium">Record received money</p>
        <Input label="Sender Name" placeholder="e.g. Rahul Kumar" value={form.sender} onChange={set("sender")} />
        <Input label="Amount (Rs)" type="number" placeholder="0.00" value={form.amount} onChange={set("amount")} />
        <Input label="Note (optional)" placeholder="e.g. Refund or transfer" value={form.note} onChange={set("note")} />
        <PrimaryBtn onClick={handleReceive} disabled={!form.sender || !form.amount}>Add Received Payment</PrimaryBtn>
      </div>
    </Modal>
  );
}

export function CardsModal({ onClose }) {
  const { session } = useAuth();
  const [controls, setControls] = useCardControls();
  const [saved, setSaved] = useState(false);

  const cardHolder = session?.name || "Card Holder";

  const saveLimit = () => {
    setControls({ limit: controls.limit });
    toast.success(`Card spending limit updated to ${formatFinanceAmount(controls.limit)}`);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleFreeze = () => {
    const next = !controls.frozen;
    setControls({ frozen: next });
    toast.success(next ? "Card frozen" : "Card unfrozen");
  };

  return (
    <Modal title="Manage Card" icon={CreditCard} onClose={onClose}>
      <div
        className="relative mb-5 overflow-hidden rounded-2xl p-5 text-white shadow-xl"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #4c1d95 50%, #701a75 75%, #0f172a 100%)",
        }}
      >
        {/* Noise overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-11 rounded bg-gradient-to-br from-amber-200 via-yellow-300 to-amber-400 shadow-inner overflow-hidden">
              <div className="absolute inset-0 opacity-40">
                <div className="grid grid-cols-3 grid-rows-3 h-full w-full gap-[1px]">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-amber-600/30" />
                  ))}
                </div>
              </div>
            </div>
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/60" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 8.5a6.5 6.5 0 0 1 13 0V17a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8.5Z" />
              <path d="M8 8.5c0-2.2 1.8-4 4-4s4 1.8 4 4" />
            </svg>
          </div>
          <svg viewBox="0 0 48 16" className="h-4 w-auto text-white/80" fill="currentColor">
            <path d="M17.68 1.5l-4.2 10h-2.8l-2-7.8c-.1-.5-.2-.7-.5-.9C6.9 2.2 5.5 1.7 4 1.4l.1-.4h4.6c.6 0 1.1.4 1.2 1.1l1 5.5L13.2 1.5h2.5zm13.4 6.7c0-2.6-3.6-2.8-3.6-3.9 0-.4.3-.8 1.1-.9.4 0 1.4-.1 2.6.5l.5-2.2c-.6-.2-1.4-.4-2.4-.4-2.5 0-4.3 1.3-4.3 3.2 0 1.4 1 2.2 2.2 2.6 1 .4 1.3.7 1.3 1.1 0 .6-.8.9-1.5.9-1.3 0-2-.3-2.6-.6l-.5 2.3c.6.3 1.7.5 2.8.5 2.7 0 4.4-1.3 4.4-3.1zm7.2 3.3h2.2l-1.9-10h-2c-.5 0-.9.3-1.1.7l-3.9 9.3h2.5l.5-1.5h3.1l.3 1.5zm-2.7-3.3l1.3-3.5.7 3.5h-2zm-9.3-6.7l-2 10h-2.4l2-10h2.4z" />
          </svg>
        </div>

        <p className="relative z-10 mt-4 mb-1 font-mono text-sm tracking-[0.15em]">1234 5678 **** 5432</p>
        <div className="relative z-10 flex justify-between text-xs opacity-80">
          <span className="font-medium">{cardHolder}</span>
          <span>12/28</span>
        </div>

        {controls.frozen && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/60 backdrop-blur-sm">
            <span className="text-lg font-bold tracking-widest text-white">FROZEN</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <button
          onClick={toggleFreeze}
          className={`w-full rounded-lg py-2.5 text-sm font-medium ${controls.frozen ? "bg-green-600 text-white" : "border border-red-500/30 bg-red-500/20 text-red-400"}`}
        >
          {controls.frozen ? "Unfreeze Card" : "Freeze Card"}
        </button>

        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Monthly Spending Limit (Rs)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={controls.limit}
              onChange={(e) => setControls({ limit: e.target.value })}
              className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <button onClick={saveLimit} className="rounded-lg bg-primary px-4 py-2.5 text-sm text-primary-foreground">
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        <div className="space-y-2 rounded-lg bg-muted p-4 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Card Type</span><span>VISA Debit</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={controls.frozen ? "text-red-400" : "text-green-400"}>{controls.frozen ? "Frozen" : "Active"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Linked Holder</span><span>{cardHolder}</span></div>
        </div>
      </div>
    </Modal>
  );
}

export function WithdrawModal({ onClose }) {
  const { addTransaction, refreshTransactions } = useFinance();
  const { refreshSession } = useAuth();
  const [form, setForm] = useState({ amount: "", method: "bank", account: "" });
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const methods = [
    { value: "bank", label: "Bank Transfer" },
    { value: "upi", label: "UPI" },
    { value: "atm", label: "ATM Withdrawal" },
  ];

  const handle = async () => {
    if (!form.amount) return;
    try {
      await addTransaction({
        id: Date.now(),
        name: `Withdrawal via ${form.method.toUpperCase()}`,
        iconType: "send",
        category: "Transfer",
        date: new Date().toISOString(),
        amount: form.amount,
        status: "Pending",
        note: form.account || `${form.method.toUpperCase()} withdrawal`,
        type: "expense",
      });
      await Promise.all([refreshTransactions(), refreshSession()]);
      toast.success(`${formatFinanceAmount(form.amount)} withdrawal initiated`);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Withdrawal failed");
    }
  };

  return (
    <Modal title="Withdraw Funds" icon={ArrowDownToLine} onClose={onClose}>
      <div className="mb-4">
        <label className="mb-2 block text-sm text-muted-foreground">Withdrawal Method</label>
        <div className="grid grid-cols-3 gap-2">
          {methods.map((m) => (
            <button
              key={m.value}
              onClick={() => setForm((prev) => ({ ...prev, method: m.value }))}
              className={`rounded-lg border py-2 text-xs font-medium transition-colors ${form.method === m.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <Input label="Amount (Rs)" type="number" placeholder="0.00" value={form.amount} onChange={set("amount")} />
      <Input
        label={form.method === "upi" ? "UPI ID" : form.method === "bank" ? "Account Number" : "ATM Location (optional)"}
        placeholder={form.method === "upi" ? "you@upi" : form.method === "bank" ? "Account number" : "Nearest ATM"}
        value={form.account}
        onChange={set("account")}
      />

      <div className="mb-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        Processing time: {form.method === "atm" ? "Instant" : form.method === "upi" ? "Within minutes" : "1-2 business days"}
      </div>

      <PrimaryBtn onClick={handle} disabled={!form.amount}>Confirm Withdrawal</PrimaryBtn>
    </Modal>
  );
}
