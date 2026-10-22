/** Paise → "₹1,23,456" (Indian grouping). */
export function formatINR(paise: number, opts: { decimals?: boolean; sign?: boolean } = {}): string {
  const rupees = paise / 100;
  const s = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: opts.decimals ? 2 : 0,
    minimumFractionDigits: opts.decimals ? 2 : 0,
  }).format(Math.abs(rupees));
  if (opts.sign) return `${rupees >= 0 ? '+' : '−'}${s}`;
  return rupees < 0 ? `−${s}` : s;
}

export const formatNumber = (n: number) => new Intl.NumberFormat('en-IN').format(n);

export const formatPct = (ratio: number, digits = 1) => `${ratio >= 0 ? '+' : ''}${(ratio * 100).toFixed(digits)}%`;

export function todayIST(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
}
