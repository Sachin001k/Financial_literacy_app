import Link from 'next/link';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`group flex items-center gap-2 font-display text-xl font-extrabold ${className}`} aria-label="FinPlay home">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand via-violet-500 to-emerald-500 text-white shadow-lg shadow-brand/30 transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 17l5-5 4 3 8-9" />
          <path d="M15 6h5v5" />
        </svg>
      </span>
      Fin<span className="text-brand">Play</span>
    </Link>
  );
}
