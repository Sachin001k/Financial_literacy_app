'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Menu, Moon, Sun, User as UserIcon, Volume2, VolumeX, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from '@/components/providers/toaster';
import { useSound } from '@/components/providers/sound-provider';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Logo } from './logo';
import { WalletChip, XPChip } from './user-chips';

const LINKS = [
  { href: '/games', label: 'Games' },
  { href: '/learn', label: 'Learn' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/how-to-play', label: 'How to play' },
  { href: '/about', label: 'About' },
];

export function Avatar({ name, url, size = 36 }: { name: string; url?: string | null; size?: number }) {
  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" width={size} height={size} className="rounded-full object-cover ring-2 ring-brand/30" style={{ width: size, height: size }} />
  ) : (
    <span className="grid place-items-center rounded-full bg-gradient-to-br from-brand to-emerald-500 font-bold text-white ring-2 ring-brand/30" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials || '🙂'}
    </span>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { user, me, openGate, signOut, refreshMe } = useAuth();
  const { enabled, setEnabled } = useSound();
  const { resolvedTheme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Close the account menu on an outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  /** Signed-in users' choices are saved, so SettingsBridge/SoundProvider don't snap them back. */
  async function saveSetting(patch: { soundOn?: boolean; theme?: 'light' | 'dark' }, undo: () => void) {
    if (!user) return;
    try {
      await api('/me/settings', { method: 'PATCH', json: patch });
      await refreshMe();
    } catch (e) {
      undo();
      toast.error('Could not save setting', (e as Error).message);
    }
  }

  const toggleSound = () => {
    const next = !enabled;
    setEnabled(next);
    void saveSetting({ soundOn: next }, () => setEnabled(!next));
  };

  const toggleTheme = () => {
    const prev = resolvedTheme === 'dark' ? 'dark' : 'light';
    const next = prev === 'dark' ? 'light' : 'dark';
    setTheme(next);
    void saveSetting({ theme: next }, () => setTheme(me?.settings.theme ?? prev));
  };

  if (pathname?.startsWith('/play/')) return null;

  const links = user ? [{ href: '/home', label: 'Home' }, ...LINKS] : LINKS;

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className={cn('sticky top-0 z-50 transition-all duration-300', scrolled ? 'glass shadow-sm' : 'bg-transparent')}
    >
      <nav className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => {
            const active = pathname === l.href || pathname?.startsWith(`${l.href}/`);
            return (
              <li key={l.href}>
                <Link href={l.href} className={cn('relative rounded-xl px-3 py-2 text-sm font-medium transition-colors', active ? 'text-fg' : 'text-muted hover:text-fg')}>
                  {active && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl bg-surface-2" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                  <span className="relative">{l.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-2">
          {me && (
            <div className="hidden items-center gap-2 md:flex">
              <XPChip level={me.progress.level} xp={me.progress.totalXp} ratio={me.progress.ratio} />
              <WalletChip balance={me.wallet.balance} />
            </div>
          )}
          <button onClick={toggleSound} className="hidden rounded-xl p-2 text-muted hover:bg-surface-2 hover:text-fg sm:block" aria-label={enabled ? 'Mute sounds' : 'Unmute sounds'}>
            {enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
          <button onClick={toggleTheme} className="rounded-xl p-2 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Toggle dark mode">
            {mounted && resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          {user ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen((o) => !o)} className="rounded-full" aria-label="Account menu" aria-expanded={menuOpen}>
                <Avatar name={me?.displayName ?? user.email ?? 'P'} url={me?.avatarUrl} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-border bg-surface p-2 shadow-xl"
                  >
                    <p className="truncate px-3 py-2 text-sm font-semibold">{me?.displayName}</p>
                    <Link href="/profile" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-surface-2">
                      <UserIcon className="h-4 w-4" /> Profile & settings
                    </Link>
                    <button onClick={signOut} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-loss hover:bg-loss/10">
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" onClick={() => openGate('login')}>Log in</Button>
              <Button size="sm" onClick={() => openGate('signup')}>Sign up free</Button>
            </div>
          )}
          <button className="rounded-xl p-2 lg:hidden" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu" aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="glass overflow-hidden lg:hidden">
            <div className="container-page space-y-1 py-4">
              {me && (
                <div className="mb-3 flex gap-2">
                  <XPChip level={me.progress.level} xp={me.progress.totalXp} ratio={me.progress.ratio} />
                  <WalletChip balance={me.wallet.balance} />
                </div>
              )}
              {links.map((l, i) => (
                <motion.div key={l.href} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link href={l.href} className="block rounded-xl px-3 py-2.5 font-medium hover:bg-surface-2">{l.label}</Link>
                </motion.div>
              ))}
              {!user && (
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => openGate('login')}>Log in</Button>
                  <Button className="flex-1" onClick={() => openGate('signup')}>Sign up free</Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
