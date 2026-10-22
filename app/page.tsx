import { FinalCTA } from '@/components/landing/final-cta';
import { HeroSection } from '@/components/landing/hero-section';
import { HowItWorks } from '@/components/landing/how-it-works';
import { LandingGames } from '@/components/landing/landing-games';
import { LearnTeaser } from '@/components/landing/learn-teaser';
import { MiniDemo } from '@/components/landing/mini-demo';
import { StatsMarquee } from '@/components/landing/stats-marquee';
import { Testimonials } from '@/components/landing/testimonials';

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <StatsMarquee />
      <HowItWorks />
      <LandingGames />
      <MiniDemo />
      <LearnTeaser />
      <Testimonials />
      <FinalCTA />
    </>
  );
}
