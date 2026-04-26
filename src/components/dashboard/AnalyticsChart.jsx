import { useLayoutEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

import { useFinance } from "@/context/FinanceContext";
import { getLatestTransactionYear, parseTxDate } from "@/lib/finance.js";
import { formatCurrency } from "@/utils/dashboardUtils.js";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const revenue = payload.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      <p className="text-sm text-primary">Total: {formatCurrency(revenue)}</p>
    </div>
  );
};

export function AnalyticsChart() {
  const navigate = useNavigate();
  const { monthlyBarsForYear, transactions } = useFinance();

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [showIncome, setShowIncome] = useState(true);
  const [showSpending, setShowSpending] = useState(true);

  useLayoutEffect(() => {
    setYear(String(getLatestTransactionYear(transactions, currentYear)));
  }, [transactions, currentYear]);

  const data = useMemo(() => monthlyBarsForYear(year), [monthlyBarsForYear, year]);
  const hasAnyActivity = useMemo(() => transactions.some((tx) => {
    const date = parseTxDate(tx.date);
    return date && date.getFullYear() === Number(year);
  }), [transactions, year]);

  const totalIncome = data.reduce((sum, item) => sum + item.main, 0);
  const totalSpending = data.reduce((sum, item) => sum + item.others, 0);
  const total = totalIncome + totalSpending;
  const incomeShare = total > 0 ? Math.round((totalIncome / total) * 100) : 0;

  const exportChart = async () => {
    const chart = document.getElementById("chart-export");
    if (!chart) return;
    const canvas = await html2canvas(chart);
    const link = document.createElement("a");
    link.download = "analytics-chart.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="stat-card animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Cash flow</h3>
        <div className="flex flex-wrap items-center justify-end gap-4">
          <div className="flex items-center gap-4">
            <button type="button" className="flex cursor-pointer items-center gap-2" onClick={() => setShowIncome(!showIncome)}>
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Income</span>
            </button>
            <button type="button" className="flex cursor-pointer items-center gap-2" onClick={() => setShowSpending(!showSpending)}>
              <div className="h-3 w-3 rounded-full bg-secondary" />
              <span className="text-sm text-muted-foreground">Spending</span>
            </button>
          </div>

          <select value={year} onChange={(e) => setYear(e.target.value)} className="rounded-lg bg-muted px-3 py-1.5 text-sm text-muted-foreground">
            {Array.from({ length: 16 }, (_, i) => currentYear - i).map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>

          <button type="button" onClick={exportChart} className="rounded-lg bg-muted px-3 py-1.5 text-sm text-muted-foreground">Export</button>
        </div>
      </div>

      {!hasAnyActivity ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground">
          <p>No transactions dated in {year}.</p>
          <p className="mt-1">Add transactions or pick another year.</p>
        </div>
      ) : (
        <div className="h-64" id="chart-export">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 20%)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(222 30% 15%)" }} />
              {showIncome && <Bar dataKey="main" name="Income" fill="hsl(177 70% 54%)" radius={[4, 4, 0, 0]} maxBarSize={20} animationDuration={800} />}
              {showSpending && <Bar dataKey="others" name="Spending" fill="hsl(260 60% 55%)" radius={[4, 4, 0, 0]} maxBarSize={20} animationDuration={800} />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-6 text-center">
        <div className="text-2xl font-bold text-foreground">{incomeShare}%</div>
        <p className="mt-1 text-sm text-muted-foreground">Share of total volume coming from income in {year}</p>
        <button type="button" onClick={() => navigate("/analytics")} className="mt-4 w-full rounded-lg bg-muted py-2 text-sm">View full analytics</button>
      </div>
    </div>
  );
}
