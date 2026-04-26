// calculate percentage growth
export const calculateGrowth = (current, previous) => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// get trend color
export const getTrendColor = (value) => {
  return value >= 0
    ? "bg-green-500/20 text-green-400"
    : "bg-red-500/20 text-red-400";
};

// get arrow
export const getTrendArrow = (value) => {
  return value >= 0 ? "up" : "down";
};
