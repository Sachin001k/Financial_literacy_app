import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle2, Gift, Lightbulb } from 'lucide-react';
import { GameHero } from '@/components/games/game-hero';
import { PlayPanel } from '@/components/games/play-panel';
import { FadeIn } from '@/components/motion/fade-in';
import { StaggerItem, StaggerList } from '@/components/motion/stagger';
import { GAMES, getGame } from '@/lib/content/games';
import { LESSONS } from '@/lib/content/lessons';
import { toCard } from '@/lib/content/public-catalogue';

export function generateStaticParams() {
  return GAMES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const g = getGame(params.slug);
  return g ? { title: g.title, description: g.tagline } : {};
}

function ListBlock({ title, icon: Icon, items, tone }: { title: string; icon: typeof CheckCircle2; items: string[]; tone: string }) {
  return (
    <FadeIn className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
        <Icon className={`h-5 w-5 ${tone}`} /> {title}
      </h2>
      <StaggerList className="space-y-3">
        {items.map((r, i) => (
          <StaggerItem key={r} className="flex gap-3">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-bold">{i + 1}</span>
            <span className="text-fg/90">{r}</span>
          </StaggerItem>
        ))}
      </StaggerList>
    </FadeIn>
  );
}

export default function GameDetailPage({ params }: { params: { slug: string } }) {
  const def = getGame(params.slug);
  if (!def) notFound();
  const game = toCard(def);
  const related = LESSONS.filter((l) => l.practiseGameSlug === def.slug).slice(0, 4);

  return (
    <div className="container-page py-8">
      <Link href="/games" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> All games
      </Link>
      <GameHero game={game} />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <ListBlock title="How to play" icon={CheckCircle2} items={def.rules} tone="text-brand" />
          <div className="grid gap-6 md:grid-cols-2">
            <ListBlock title="Rewards" icon={Gift} items={def.rewards} tone="text-coin" />
            <ListBlock title="What you'll learn" icon={Lightbulb} items={def.learnOutcomes} tone="text-gain" />
          </div>
          <FadeIn className="flex flex-wrap gap-2">
            {def.skills.map((s) => (
              <span key={s} className="rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand">{s}</span>
            ))}
          </FadeIn>
          {related.length > 0 && (
            <FadeIn className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><BookOpen className="h-5 w-5 text-brand" /> Read first</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {related.map((l) => (
                  <li key={l.slug}>
                    <Link href={`/learn/${l.category}/${l.slug}`} className="block rounded-2xl bg-surface-2 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                      <p className="font-semibold">{l.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted">{l.summary}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </FadeIn>
          )}
        </div>
        <div>
          <PlayPanel game={game} />
        </div>
      </div>
    </div>
  );
}
