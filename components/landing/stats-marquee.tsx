const FACTS = [
  '₹1,000 a month at 12% for 20 years ≈ ₹10 lakh',
  'Prices roughly double every 12 years at 6% inflation',
  'The Rule of 72: years to double ≈ 72 ÷ return %',
  'Banks never ask for your OTP or UPI PIN',
  'An emergency fund = 3–6 months of expenses',
  'Index funds spread risk across dozens of companies',
  'Starting 10 years earlier can double your final corpus',
  'Paying with UPI? You only enter your PIN to send money, never to receive',
];

/** Infinite horizontal scroll of money facts; pauses on hover. */
export function StatsMarquee() {
  const row = [...FACTS, ...FACTS];
  return (
    <section aria-label="Money facts" className="group relative overflow-hidden border-y border-border bg-surface/60 py-4">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-bg to-transparent" />
      <div className="flex w-max animate-marquee gap-10 group-hover:[animation-play-state:paused]">
        {row.map((f, i) => (
          <span key={i} aria-hidden={i >= FACTS.length} className="flex items-center gap-3 whitespace-nowrap text-sm font-medium">
            <span className="text-coin">✦</span>
            {f}
          </span>
        ))}
      </div>
    </section>
  );
}
