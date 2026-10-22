'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './logo';

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/play/')) return null;
  return (
    <footer className="mt-24 border-t border-border bg-surface/50">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-muted">Learn money and investing by playing. Short games, real lessons, zero risk.</p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Play</p>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/games" className="hover:text-fg">All games</Link></li>
            <li><Link href="/leaderboard" className="hover:text-fg">Leaderboard</Link></li>
            <li><Link href="/how-to-play" className="hover:text-fg">How to play</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Learn</p>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/learn" className="hover:text-fg">Learning hub</Link></li>
            <li><Link href="/about" className="hover:text-fg">About us</Link></li>
            <li><Link href="/about#feedback" className="hover:text-fg">Send feedback</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="container-page py-5 text-xs leading-relaxed text-muted">
          <strong>Disclaimer:</strong> FinPlay is an educational game. All money is virtual (₹) and all prices are simulated. Nothing here is investment advice or a stock tip. © <span suppressHydrationWarning>{new Date().getFullYear()}</span> FinPlay.
        </p>
      </div>
    </footer>
  );
}
