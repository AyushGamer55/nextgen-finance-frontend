import { useLayoutEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { IndianRupee, PiggyBank, TrendingDown, TrendingUp } from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import TransactionTable from "@/components/dashboard/TransactionTable.jsx";
import { InsightsPanel } from "@/components/insights/InsightsPanel";
import { useFinance } from "@/context/FinanceContext";
import {
  buildFinanceSummary,
  filterTransactionsByYear,
  getLatestTransactionYear,
  parseRupeeAmount,
  parseTxDate,
} from "@/lib/finance.js";
import { buildInsights } from "@/lib/insights.js";
import { formatCurrency } from "@/utils/dashboardUtils.js";

const PIE_COLORS = [
  "hsl(177 70% 54%)",
  "hsl(260 60% 55%)",
  "hsl(217 91% 60%)",
  "hsl(160 84% 39%)",
  "hsl(38 92% 50%)",
  "hsl(350 70% 55%)",
  "hsl(200 80% 50%)",
];

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-sm shadow-xl">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(Number(entry.value))}
        </p>
      ))}
    </div>
  );
};

const Analytics = () => {
  const { transactions, monthlyBarsForYear } = useFinance();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [search, setSearch] = useState("");

  useLayoutEffect(() => {
    setYear(String(getLatestTransactionYear(transactions, currentYear)));
  }, [transactions, currentYear]);

  const yearTx = useMemo(() => filterTransactionsByYear(transactions, year), [transactions, year]);
  const summary = useMemo(() => buildFinanceSummary(yearTx), [yearTx]);
  const monthly = useMemo(() => monthlyBarsForYear(year), [monthlyBarsForYear, year]);

  const netSeries = useMemo(
    () => monthly.map((month) => ({ month: month.month, net: month.main - month.others, income: month.main, expense: month.others })),
    [monthly]
  );

  const pieData = useMemo(() => {
    const map = new Map();
    for (const tx of yearTx) {
      if (tx.iconType === "receive") continue;
      const category = tx.category || "Other";
      map.set(category, (map.get(category) || 0) + parseRupeeAmount(tx.amount));
    }
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [yearTx]);

  const insights = useMemo(() => buildInsights(yearTx), [yearTx]);
  const hasActivity = useMemo(() => yearTx.some((tx) => parseTxDate(tx.date)), [yearTx]);

  const spendChange = useMemo(() => {
    if (String(year) !== String(currentYear)) return null;
    const monthIndex = new Date().getMonth();
    if (monthIndex === 0) return null;
    const bars = monthlyBarsForYear(year);
    const current = bars[monthIndex]?.others ?? 0;
    const previous = bars[monthIndex - 1]?.others ?? 0;
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }, [monthlyBarsForYear, year, currentYear]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <Header userName="Analytics" onSearch={setSearch} />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Year
            <select value={year} onChange={(e) => setYear(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-foreground">
              {Array.from({ length: 12 }, (_, i) => currentYear - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Income ({year})</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-emerald-500">
              <IndianRupee className="h-5 w-5" />
              {formatCurrency(summary.totalIncome)}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Expenses ({year})</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-red-400">
              <TrendingDown className="h-5 w-5" />
              {formatCurrency(summary.totalExpenses)}
            </p>
            {spendChange != null && String(year) === String(currentYear) && (
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                {spendChange >= 0 ? "+" : ""}{spendChange.toFixed(1)}% vs prior month
              </p>
            )}
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Net ({year})</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-bold">
              <PiggyBank className="h-5 w-5 text-primary" />
              {formatCurrency(summary.netSavings)}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <InsightsPanel insights={insights} compact title={`Insights | ${year}`} />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="stat-card">
            <h3 className="mb-4 text-lg font-semibold">Income vs spending by month</h3>
            {!hasActivity ? (
              <p className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">No data for {year}.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 20%)" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} />
                  <Tooltip content={<ChartTip />} />
                  <Legend />
                  <Area type="monotone" name="Income" dataKey="main" stroke="hsl(177 70% 54%)" fill="hsl(177 70% 54%)" fillOpacity={0.2} />
                  <Area type="monotone" name="Spending" dataKey="others" stroke="hsl(260 60% 55%)" fill="hsl(260 60% 55%)" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="stat-card">
            <h3 className="mb-4 text-lg font-semibold">Spending by category</h3>
            {!pieData.length ? (
              <p className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">No expense categories in {year}.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={56} outerRadius={88} paddingAngle={2}>
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="stat-card mb-8">
          <h3 className="mb-4 text-lg font-semibold">Net cash flow trend ({year})</h3>
          {!hasActivity ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No trend data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={netSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 20%)" />
                <XAxis dataKey="month" tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} />
                <Tooltip content={<ChartTip />} />
                <Line type="monotone" name="Net (income - spending)" dataKey="net" stroke="hsl(177 70% 54%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {search && (
          <div className="mt-6">
            <h2 className="mb-4 text-xl font-semibold">Search | all years</h2>
            <TransactionTable search={search} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;
