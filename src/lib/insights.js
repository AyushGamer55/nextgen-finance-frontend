import { buildFinanceSummary } from "@/lib/finance.js";
import { formatCurrency } from "@/utils/dashboardUtils.js";

/**
 * @typedef {{ id: string, kind: 'warning' | 'positive' | 'info' | 'tip', title: string, detail: string, action?: string }} Insight
 */

/**
 * @param {object[]} transactions
 * @returns {Insight[]}
 */
export function buildInsights(transactions) {
  if (!transactions.length) {
    return [
      {
        id: "empty",
        kind: "info",
        title: "No transactions yet",
        detail: "Add transactions manually or import a CSV to unlock spending insights.",
        action: "Go to Import CSV",
      },
    ];
  }

  const summary = buildFinanceSummary(transactions);
  /** @type {Insight[]} */
  const out = [];

  if (summary.netSavings < 0) {
    out.push({
      id: "deficit",
      kind: "warning",
      title: "Spending exceeds income",
      detail: `You are short about ${formatCurrency(Math.abs(summary.netSavings))} on recorded cash flow. Trim discretionary categories or increase income.`,
      action: "Review largest expense categories below.",
    });
  } else if (summary.netSavings > 0) {
    out.push({
      id: "surplus",
      kind: "positive",
      title: "Positive cash flow",
      detail: `Income covers expenses with roughly ${formatCurrency(summary.netSavings)} left—consider moving that to savings or investments regularly.`,
    });
  }

  const pie = summary.categoryExpensePie;
  if (pie.length && summary.totalExpenses > 0) {
    const [top] = pie;
    const pct = Math.round((top.value / summary.totalExpenses) * 100);
    if (pct >= 32) {
      out.push({
        id: "top-heavy",
        kind: "warning",
        title: `${top.name} drives a large share of spending`,
        detail: `${pct}% of expenses went to ${top.name}. A 10–15% cut there frees meaningful cash without touching essentials.`,
        action: `Try trimming ${top.name} by 12% this month.`,
      });
    }

    const foodEnt = pie
      .filter((c) => /food|entertainment/i.test(c.name))
      .reduce((s, c) => s + c.value, 0);
    const foodPct = Math.round((foodEnt / summary.totalExpenses) * 100);
    if (foodPct >= 40 && !out.some((x) => x.id === "food-ent")) {
      out.push({
        id: "food-ent",
        kind: "info",
        title: "Food & entertainment are a big slice",
        detail: `Together they are about ${foodPct}% of spending—meal planning and one fewer subscription often help.`,
      });
    }
  }

  if (summary.expenseMoMGrowth > 12) {
    out.push({
      id: "mom-up",
      kind: "warning",
      title: "Spending rose vs last month",
      detail: `Expenses are about ${summary.expenseMoMGrowth.toFixed(0)}% higher than the prior month. Pause discretionary purchases until the trend stabilizes.`,
    });
  } else if (summary.expenseMoMGrowth < -8) {
    out.push({
      id: "mom-down",
      kind: "positive",
      title: "Spending improved month over month",
      detail: `You spent roughly ${Math.abs(summary.expenseMoMGrowth).toFixed(0)}% less than last month—keep the habits that drove the drop.`,
    });
  }

  if (summary.totalExpenses > 0 && summary.netSavings >= 0) {
    const target = Math.round(summary.totalExpenses * 0.1);
    if (target > 0) {
      out.push({
        id: "save-target",
        kind: "tip",
        title: "Savings stretch goal",
        detail: `If you route about ${formatCurrency(target)} per cycle to savings (≈10% of expenses), you lock progress without a harsh budget reset.`,
      });
    }
  }

  if (out.length === 0) {
    out.push({
      id: "balanced",
      kind: "info",
      title: "Patterns look steady",
      detail: "No strong alerts from rule checks. Keep logging transactions so trends stay visible.",
    });
  }

  return out;
}

export function insightRecommendations(insights) {
  return insights
    .map((i) => i.action || i.detail)
    .filter(Boolean);
}

export function buildAiHighlights({ predictionSummary, summary }) {
  const highlights = [];
  const risk = predictionSummary?.overspending_risk;
  const confidence = Number(predictionSummary?.confidence || 0);
  const predictedExpense = Number(predictionSummary?.predicted_expense || 0);
  const avgExpense = Number(summary?.averageMonthlyExpenses || 0);
  const spendingChange = Number(summary?.expenseMoMGrowth || 0);
  const savingsRate = Number(summary?.savingsRate || 0);

  if (Number.isFinite(spendingChange) && spendingChange >= 10) {
    highlights.push({
      id: "ai-spend-up",
      kind: "warning",
      title: "Spending has accelerated this month",
      detail: `Expenses are up ${spendingChange.toFixed(0)}% versus last month. If this pace continues, your monthly budget can run tight.`,
      action: "Review the top two categories and cap non-essential spending this week.",
    });
  }

  if (risk === "high") {
    highlights.push({
      id: "ai-risk-high",
      kind: "warning",
      title: "Higher chance of overspending",
      detail: `Recent transaction behavior suggests elevated budget pressure${confidence > 0 ? ` (${confidence}% confidence)` : ""}.`,
      action: "Set a short-term limit for shopping and entertainment until trend cools.",
    });
  } else if (risk === "low") {
    highlights.push({
      id: "ai-risk-low",
      kind: "positive",
      title: "Spending risk looks controlled",
      detail: "Your recent pattern is stable and currently within a healthy range.",
      action: "Keep recurring transfers to savings active.",
    });
  }

  if (predictedExpense > 0 && avgExpense > 0) {
    const deltaPct = ((predictedExpense - avgExpense) / avgExpense) * 100;
    if (deltaPct >= 8) {
      highlights.push({
        id: "ai-forecast-up",
        kind: "warning",
        title: "Upcoming expenses may be higher than usual",
        detail: `Projected spend is around ${formatCurrency(predictedExpense)}, about ${deltaPct.toFixed(0)}% above your typical monthly level.`,
      });
    } else if (deltaPct <= -8) {
      highlights.push({
        id: "ai-forecast-down",
        kind: "positive",
        title: "Expense forecast is improving",
        detail: `Projected spend is near ${formatCurrency(predictedExpense)}, about ${Math.abs(deltaPct).toFixed(0)}% below your usual monthly level.`,
      });
    }
  }

  if (savingsRate >= 20) {
    highlights.push({
      id: "ai-savings-strong",
      kind: "positive",
      title: "Savings trend is strong",
      detail: `You are retaining about ${savingsRate.toFixed(0)}% of income after expenses, which is a solid cushion for goals and emergencies.`,
    });
  } else if (savingsRate > 0 && savingsRate <= 8) {
    highlights.push({
      id: "ai-savings-thin",
      kind: "tip",
      title: "Savings cushion is thin",
      detail: `Current savings rate is near ${savingsRate.toFixed(0)}%. A small category cut can noticeably improve month-end balance.`,
    });
  }

  return highlights.slice(0, 4);
}
