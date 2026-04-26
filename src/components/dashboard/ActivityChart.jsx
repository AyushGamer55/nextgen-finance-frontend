import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/utils/dashboardUtils.js";

const COLORS = ["#3B82F6", "#22C55E", "#A855F7", "#F97316", "#E11D48", "#14B8A6", "#FBBF24"];

const ActivityChart = ({ categoryData = [] }) => {
  const [showChart, setShowChart] = useState(true);
  const navigate = useNavigate();

  const chartData = categoryData.length ? categoryData : [{ name: "No spending yet", value: 1 }];
  const totalSpent = categoryData.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Spending by category</h2>

      <p className="text-sm text-muted-foreground">
        {totalSpent > 0 ? `${chartData.length} categories | ${formatCurrency(totalSpent)} total` : "Add expense transactions to see a breakdown."}
      </p>

      <button type="button" onClick={() => setShowChart(!showChart)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        {showChart ? "Hide chart" : "Show chart"}
      </button>

      {showChart && totalSpent > 0 && (
        <div className="mt-4 flex justify-center">
          <PieChart width={250} height={250}>
            <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {chartData.map((entry, index) => (
                <Cell key={entry.name + index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          </PieChart>
        </div>
      )}

      {showChart && totalSpent === 0 && (
        <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          No expense categories yet.
        </div>
      )}

      <button type="button" onClick={() => navigate("/analytics")} className="w-full rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground">
        View full analytics
      </button>
    </div>
  );
};

export default ActivityChart;
