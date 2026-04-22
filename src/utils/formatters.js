export function formatCurrency(amount, currency = 'INR') {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatCompactCurrency(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '₹0';
  if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
}
