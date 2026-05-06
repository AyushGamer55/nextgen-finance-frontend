import { useMemo, useState } from "react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import TransactionTable from "@/components/dashboard/TransactionTable";
import { CreditCard } from "@/components/dashboard/CreditCard";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { InsightsPanel } from "@/components/insights/InsightsPanel.jsx";
import ActivityChart from "@/components/dashboard/ActivityChart";
import { SendModal, ReceiveModal, CardsModal, WithdrawModal } from "@/components/dashboard/ActionModals";

import { ArrowDownToLine, IndianRupee, PiggyBank, Send, Download, CreditCard as CardIcon, TrendingDown } from "lucide-react";
import { formatCurrency, getTrendArrow } from "@/utils/dashboardUtils.js";
import { buildAiHighlights, buildInsights } from "@/lib/insights.js";
import { useFinance } from "@/context/FinanceContext";
import { useAuth } from "@/context/AuthContext";
import { useMlInsights } from "@/context/MlInsightsContext";

const actionButtons = [
  { key: "send", label: "Send", Icon: Send, color: "bg-primary text-primary-foreground" },
  { key: "receive", label: "Receive", Icon: Download, color: "bg-secondary text-white" },
  { key: "cards", label: "Cards", Icon: CardIcon, color: "bg-blue-500 text-white" },
  { key: "withdraw", label: "Withdraw", Icon: ArrowDownToLine, color: "bg-green-600 text-white" },
];

const Index = () => {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const { summary, transactions } = useFinance();
  const { session } = useAuth();
  const { predictionSummary } = useMlInsights();
  const insights = useMemo(() => buildInsights(transactions), [transactions]);
  const aiHighlights = useMemo(
    () => buildAiHighlights({ predictionSummary, summary }),
    [predictionSummary, summary]
  );
  const availableBalance = session?.balance ?? summary.netSavings;

  const profileName = session?.name || "Dashboard";

  const spendingChange = summary.expenseMoMGrowth;
  const spendingLabel = `${getTrendArrow(spendingChange)} ${Math.abs(spendingChange).toFixed(1)}% vs last month`;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 space-y-8 p-8">
        <Header userName={profileName} onSearch={setSearch} />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            title="Total Income"
            amount={formatCurrency(summary.totalIncome)}
            change=""
            isPositive
            icon={<IndianRupee className="h-6 w-6 text-primary" />}
            iconBg="bg-primary/20"
          />
          <StatCard
            title="Total Expenses"
            amount={formatCurrency(summary.totalExpenses)}
            change={spendingLabel}
            isPositive={spendingChange <= 0}
            icon={<TrendingDown className="h-6 w-6 text-secondary" />}
            iconBg="bg-secondary/20"
          />
          <StatCard
            title="Net Savings"
            amount={formatCurrency(summary.netSavings)}
            change={summary.netSavings >= 0 ? "Income exceeds spending" : "Spending exceeds income"}
            isPositive={summary.netSavings >= 0}
            icon={<PiggyBank className="h-6 w-6 text-primary" />}
            iconBg="bg-primary/20"
          />
        </div>

        <InsightsPanel insights={aiHighlights} title="AI outlook" />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {actionButtons.map(({ key, label, Icon, color }) => (
            <button
              key={key}
              onClick={() => setModal(key)}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background ${color}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <AnalyticsChart />

        <InsightsPanel insights={insights} />

        <TransactionTable search={search} />
      </main>

      <aside className="hidden w-80 border-l border-border p-8 xl:block">
        <div className="space-y-8">
          <CreditCard
            balance={availableBalance}
            onManageCard={() => setModal("cards")}
            onTransfer={() => setModal("send")}
          />
          <div className="h-px bg-border/50" />
          <ActivityChart categoryData={summary.categoryExpensePie} />
        </div>
      </aside>

      {modal === "send" && <SendModal onClose={() => setModal(null)} />}
      {modal === "receive" && <ReceiveModal onClose={() => setModal(null)} />}
      {modal === "cards" && <CardsModal onClose={() => setModal(null)} />}
      {modal === "withdraw" && <WithdrawModal onClose={() => setModal(null)} />}
    </div>
  );
};

export default Index;
