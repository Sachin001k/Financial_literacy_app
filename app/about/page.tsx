import { BookOpen, Gamepad2, HeartHandshake, ShieldCheck, Target } from 'lucide-react';
import { FeedbackForm } from '@/components/about/feedback-form';
import { ProblemStats } from '@/components/about/problem-stats';
import { FadeIn } from '@/components/motion/fade-in';
import { StaggerItem, StaggerList } from '@/components/motion/stagger';

export const metadata = { title: 'About us', description: 'Why we built FinPlay, and how it teaches money through play.' };

// Placeholder team — replace with real people before launch.
const TEAM = [
  { name: 'Team member', role: 'Founder · Product', emoji: '🧑‍💼' },
  { name: 'Team member', role: 'Game design', emoji: '🎨' },
  { name: 'Team member', role: 'Engineering', emoji: '👩‍💻' },
  { name: 'Team member', role: 'Finance educator', emoji: '📚' },
];

const APPROACH = [
  { icon: BookOpen, title: 'Explain simply', body: 'One idea per lesson, with an Indian example — rupees, UPI, SIPs and FDs.' },
  { icon: Gamepad2, title: 'Practise by playing', body: 'Games turn ideas into decisions with consequences you can feel.' },
  { icon: Target, title: 'Measure progress', body: 'Quizzes and knowledge checks show what you actually learned over time.' },
  { icon: ShieldCheck, title: 'Stay safe', body: 'Virtual money only, no stock tips, no ads aimed at minors.' },
];

export default function AboutPage() {
  return (
    <div className="container-page py-10">
      <FadeIn className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">About FinPlay</p>
        <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">Money skills shouldn&apos;t be <span className="text-gradient">boring</span> — or learned the hard way.</h1>
        <p className="mt-5 text-lg text-muted">Most of us learn about money by making mistakes with real money. We think there&apos;s a better way: learn by playing, where the only thing you can lose is virtual coins.</p>
      </FadeIn>

      <section className="mt-16" aria-labelledby="problem">
        <FadeIn><h2 id="problem" className="mb-6 text-2xl font-bold">The problem</h2></FadeIn>
        <ProblemStats />
      </section>

      <section className="mt-16 grid items-center gap-8 rounded-[2rem] bg-gradient-to-br from-brand to-violet-600 p-8 text-white shadow-xl sm:p-12 md:grid-cols-[auto_1fr]" aria-labelledby="mission">
        <HeartHandshake className="h-16 w-16" />
        <FadeIn>
          <h2 id="mission" className="text-3xl font-extrabold">Our mission</h2>
          <p className="mt-3 text-lg text-white/90">Help a million young Indians make confident money decisions — budgeting, saving, investing and staying safe from scams — before real money is on the line.</p>
        </FadeIn>
      </section>

      <section className="mt-16" aria-labelledby="approach">
        <FadeIn><h2 id="approach" className="mb-6 text-2xl font-bold">Our approach</h2></FadeIn>
        <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {APPROACH.map((a, i) => (
            <StaggerItem key={a.title} className="relative rounded-3xl border border-border bg-surface p-6 shadow-sm">
              <span className="absolute right-5 top-4 font-display text-4xl font-extrabold text-surface-2">{i + 1}</span>
              <a.icon className="h-8 w-8 text-brand" />
              <h3 className="mt-3 text-lg font-bold">{a.title}</h3>
              <p className="mt-1 text-sm text-muted">{a.body}</p>
            </StaggerItem>
          ))}
        </StaggerList>
      </section>

      <section className="mt-16" aria-labelledby="team">
        <FadeIn>
          <h2 id="team" className="text-2xl font-bold">The team</h2>
          <p className="mb-6 mt-1 text-xs font-semibold uppercase tracking-wider text-muted">Placeholder profiles</p>
        </FadeIn>
        <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((t) => (
            <StaggerItem key={t.role} className="group rounded-3xl border border-border bg-surface p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-surface-2 text-4xl transition-transform group-hover:scale-110 group-hover:rotate-6" aria-hidden>{t.emoji}</span>
              <p className="mt-3 font-bold">{t.name}</p>
              <p className="text-sm text-muted">{t.role}</p>
            </StaggerItem>
          ))}
        </StaggerList>
      </section>

      <section className="mx-auto mt-16 max-w-2xl">
        <FeedbackForm />
      </section>
    </div>
  );
}
