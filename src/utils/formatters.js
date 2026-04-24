const CURRENCY_LOCALE = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'en-IE',
  GBP: 'en-GB',
  AED: 'en-AE',
};

const BASE_CURRENCY = 'INR';

let _currency = BASE_CURRENCY;
let _rates = { [BASE_CURRENCY]: 1 };
const subscribers = new Set();

function notify() {
  subscribers.forEach((fn) => { try { fn(_currency); } catch { /* ignore */ } });
}

export function setPlatformCurrency(code) {
  if (!code || code === _currency) return;
  _currency = code;
  notify();
}

export function setExchangeRates(rates) {
  if (rates && typeof rates === 'object') {
    _rates = { ...rates, [BASE_CURRENCY]: 1 };
    notify();
  }
}

export function getPlatformCurrency() {
  return _currency;
}

export function subscribeCurrency(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

function getLocale(currency) {
  return CURRENCY_LOCALE[currency] || 'en-US';
}

function convert(amount, toCurrency) {
  const n = Number(amount) || 0;
  if (toCurrency === BASE_CURRENCY) return n;
  const rate = _rates[toCurrency];
  if (!rate) return n;
  return n * rate;
}

export function getCurrencySymbol(currency = _currency) {
  try {
    const parts = new Intl.NumberFormat(getLocale(currency), {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    return parts.find((p) => p.type === 'currency')?.value || currency;
  } catch {
    return currency;
  }
}

export function formatCurrency(amount, currency = _currency) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return formatCurrency(0, currency);
  const converted = convert(n, currency);
  try {
    return new Intl.NumberFormat(getLocale(currency), {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(converted);
  } catch {
    return `${currency} ${Math.round(converted).toLocaleString('en-US')}`;
  }
}

export function formatCompactCurrency(amount, currency = _currency) {
  const n = Number(amount);
  const symbol = getCurrencySymbol(currency);
  if (!Number.isFinite(n)) return `${symbol}0`;
  const v = convert(n, currency);
  if (currency === 'INR') {
    if (Math.abs(v) >= 10000000) return `${symbol}${(v / 10000000).toFixed(1)}Cr`;
    if (Math.abs(v) >= 100000) return `${symbol}${(v / 100000).toFixed(1)}L`;
  } else {
    if (Math.abs(v) >= 1000000000) return `${symbol}${(v / 1000000000).toFixed(1)}B`;
    if (Math.abs(v) >= 1000000) return `${symbol}${(v / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(v) >= 1000) return `${symbol}${(v / 1000).toFixed(0)}k`;
  return `${symbol}${Math.round(v)}`;
}
