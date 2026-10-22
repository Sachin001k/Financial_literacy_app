import { StaggerItem, StaggerList } from '@/components/motion/stagger';
import { FadeIn } from '@/components/motion/fade-in';

// Sample quotes for layout only — replace with real feedback before launch.
const QUOTES = [
  { name: 'Aarav, 17', text: 'I finally get what an index fund is. The Investment Simulator crash in year 3 taught me not to panic-sell.', emoji: '🧑‍🎓' },
  { name: 'Priya, 22', text: 'Scam or Legit is scary good. I caught a fake “KYC update” SMS the very next week.', emoji: '👩‍💻' },
  { name: 'Rohan, 19', text: 'Life Simulator made me start a real emergency fund. ₹500 a month, but it’s a start.', emoji: '🧑‍🍳' },
];

export function Testimonials() {
  return (
    <section className="container-page py-16" aria-labelledby="quotes-title">
      <FadeIn className="text-center">
        <h2 id="quotes-title" className="text-3xl font-extrabold sm:text-4xl">Players are levelling up</h2>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted">Sample testimonials (placeholders)</p>
      </FadeIn>
      <StaggerList className="mt-10 grid gap-5 md:grid-cols-3">
        {QUOTES.map((q) => (
          <StaggerItem key={q.name}>
            <figure className="h-full rounded-3xl border border-border bg-surface p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <span className="text-4xl leading-none text-brand/40" aria-hidden>“</span>
              <blockquote className="-mt-2 text-fg/90">{q.text}</blockquote>
              <figcaption className="mt-4 flex items-center gap-3 text-sm font-semibold">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-xl" aria-hidden>{q.emoji}</span>
                {q.name}
              </figcaption>
            </figure>
          </StaggerItem>
        ))}
      </StaggerList>
    </section>
  );
}
