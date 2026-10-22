import Link from 'next/link';
import { Coins, Flame, Gamepad2, Keyboard, Lightbulb, MousePointerClick, ShieldCheck, Target, TrendingUp, Trophy } from 'lucide-react';
import { FadeIn } from '@/components/motion/fade-in';
import { StaggerItem, StaggerList } from '@/components/motion/stagger';
import { ACHIEVEMENTS } from '@/lib/content/achievements';
import { formatNumber } from '@/lib/format';
import { XP_REWARDS, xpForLevel } from '@/lib/progress/level-curve';

export const metadata = { title: 'How to play', description: 'Rules, rewards, levels and controls for every FinPlay game.' };

const LOOP = [
  { icon: Target, title: 'A goal', body: 'Every game opens with one clear target, like “save ₹15,000 in 12 months”.' },
  { icon: MousePointerClick, title: 'Choices', body: 'Each turn you pick from a few options. There is rarely one perfect answer.' },
  { icon: TrendingUp, title: 'Consequences', body: 'The game shows what your choice did — to your wallet, your score, or your happiness.' },
  { icon: Trophy, title: 'A score', body: 'Scores reward smart, balanced play, not reckless risk.' },
  { icon: Lightbulb, title: 'What you learned', body: 'The end screen sums up the money ideas you just used.' },
];

const XP_ROWS = [
  ['Lesson read', `${XP_REWARDS.lesson} XP`],
  ['Lesson quiz', `${XP_REWARDS.quizMin}–${XP_REWARDS.quizMax} XP`],
  ['Short game', '30–60 XP'],
  ['Simulator', '80–150 XP'],
  ['Daily challenge', `${XP_REWARDS.daily} XP + streak bonus`],
];

const KEYS = [
  ['Tab / Shift+Tab', 'Move between choices'],
  ['Enter / Space', 'Pick the focused choice'],
  ['1 – 4', 'Pick a numbered choice in most games'],
  ['← / →', 'Scam or Legit: scam / legit'],
  ['↑ / ↓', 'Bull or Bear: bull / bear'],
  ['Esc', 'Close dialogs'],
];

function Section({ id, icon: Icon, title, children }: { id: string; icon: typeof Target; title: string; children: React.ReactNode }) {
  return (
    <FadeIn id={id} className="scroll-mt-24 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <h2 className="mb-5 flex items-center gap-3 text-2xl font-bold">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand"><Icon className="h-5 w-5" /></span>
        {title}
      </h2>
      {children}
    </FadeIn>
  );
}

export default function HowToPlayPage() {
  return (
    <div className="container-page max-w-4xl py-10">
      <FadeIn className="mb-10 text-center">
        <span className="text-5xl" aria-hidden>🎮</span>
        <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">How to play</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">Everything you need to know about games, XP, coins, achievements and streaks.</p>
        <nav className="mt-6 flex flex-wrap justify-center gap-2 text-sm" aria-label="On this page">
          {[['games', 'Games'], ['xp', 'XP & levels'], ['coins', 'Coins'], ['achievements', 'Achievements'], ['daily', 'Daily & streaks'], ['controls', 'Controls']].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-full border border-border bg-surface px-3 py-1.5 font-medium hover:border-brand/50 hover:text-brand">{label}</a>
          ))}
        </nav>
      </FadeIn>

      <div className="space-y-6">
        <Section id="games" icon={Gamepad2} title="Every game works the same way">
          <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LOOP.map((s, i) => (
              <StaggerItem key={s.title} className="rounded-2xl bg-surface-2 p-4">
                <s.icon className="mb-2 h-6 w-6 text-brand" />
                <p className="font-semibold">{i + 1}. {s.title}</p>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </StaggerItem>
            ))}
          </StaggerList>
          <p className="mt-5 text-sm text-muted">Leave mid-game? Your progress is saved — hit <strong>Continue</strong> on the game card. Some games unlock at a higher level or after a lesson.</p>
        </Section>

        <Section id="xp" icon={TrendingUp} title="XP and levels">
          <p className="mb-4 text-muted">You earn XP for lessons, quizzes, games and achievements. Each level needs a little more XP than the last.</p>
          <div className="grid gap-6 md:grid-cols-2">
            <table className="w-full text-sm">
              <caption className="mb-2 text-left font-semibold">Total XP needed</caption>
              <thead><tr className="border-b border-border text-left text-muted"><th className="py-2 font-medium">Level</th><th className="py-2 text-right font-medium">XP</th></tr></thead>
              <tbody>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((l) => (
                  <tr key={l} className="border-b border-border/60 last:border-0">
                    <td className="py-1.5">Level {l}</td>
                    <td className="py-1.5 text-right tabular-nums">{formatNumber(xpForLevel(l))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="w-full self-start text-sm">
              <caption className="mb-2 text-left font-semibold">What earns XP</caption>
              <tbody>
                {XP_ROWS.map(([k, v]) => (
                  <tr key={k} className="border-b border-border/60 last:border-0">
                    <td className="py-1.5">{k}</td>
                    <td className="py-1.5 text-right font-semibold text-coin">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="coins" icon={Coins} title="Coins and your virtual wallet">
          <p className="text-muted">You start with <strong className="text-fg">₹1,000</strong> in virtual money. Games pay out coins based on how well you play. Coins will buy avatar items later. Your wallet is shown in the top bar.</p>
        </Section>

        <Section id="achievements" icon={Trophy} title="Achievements">
          <StaggerList className="grid gap-3 sm:grid-cols-2">
            {ACHIEVEMENTS.map((a) => (
              <StaggerItem key={a.code} className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface text-2xl shadow-sm" aria-hidden>{a.icon}</span>
                <div className="min-w-0">
                  <p className="font-semibold">{a.title} <span className="text-xs font-semibold text-coin">+{a.xpReward} XP</span></p>
                  <p className="text-sm text-muted">{a.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </Section>

        <Section id="daily" icon={Flame} title="Daily challenge and streaks">
          <p className="text-muted">A new challenge appears every day at midnight IST, and everyone gets the same round. Finish it for {XP_REWARDS.daily} XP plus a streak bonus of {XP_REWARDS.streakBonusPerDay} XP per streak day (up to {XP_REWARDS.streakBonusCap}). Play or learn on consecutive days to keep your streak 🔥 alive.</p>
        </Section>

        <Section id="controls" icon={Keyboard} title="Controls and accessibility">
          <dl className="grid gap-2 sm:grid-cols-2">
            {KEYS.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2 text-sm">
                <dt><kbd className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-xs">{k}</kbd></dt>
                <dd className="text-muted">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-muted">Turn off animations, sound or switch to high contrast in <Link href="/profile" className="font-semibold text-brand hover:underline">Profile → Settings</Link>. Gains and losses always show ▲/▼ symbols, not just colour.</p>
        </Section>

        <FadeIn className="flex items-start gap-3 rounded-3xl border border-gain/30 bg-gain/10 p-5 text-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gain" />
          <p><strong>All money is virtual.</strong> Prices are simulated, nothing is real trading, and nothing in FinPlay is a stock tip or investment advice.</p>
        </FadeIn>

        <FadeIn className="text-center">
          <Link href="/games" className="inline-flex items-center gap-2 rounded-2xl bg-brand px-7 py-3.5 font-semibold text-white shadow-lg shadow-brand/30 transition hover:brightness-110">
            <Gamepad2 className="h-5 w-5" /> Pick a game
          </Link>
        </FadeIn>
      </div>
    </div>
  );
}
