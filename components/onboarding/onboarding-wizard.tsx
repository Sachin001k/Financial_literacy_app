'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Rocket } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { burstConfetti } from '@/components/motion/confetti';
import { useAuth } from '@/components/providers/auth-provider';
import { useSound } from '@/components/providers/sound-provider';
import { toast } from '@/components/providers/toaster';
import { Button } from '@/components/ui/button';
import { api, gameApi } from '@/lib/api';
import { ONBOARDING_MISSIONS } from '@/lib/content/games';
import type { Familiarity, SessionDTO } from '@/lib/game/types';
import { peekIntent, takeIntent } from '@/lib/intent';
import { cn } from '@/lib/utils';
import { AgeStep, AssessmentStep, FamiliarityStep, FirstMissionStep, IntroStep, RulesStep, TutorialStep, type AgeBand } from './steps';

const ALL_STEPS = ['intro', 'age', 'familiarity', 'assessment', 'tutorial', 'rules', 'mission'] as const;
type Step = (typeof ALL_STEPS)[number];

export function OnboardingWizard() {
  const router = useRouter();
  const { me, refreshMe } = useAuth();
  const { play } = useSound();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [familiarity, setFamiliarity] = useState<Familiarity | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [tutorialDone, setTutorialDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hasIntent, setHasIntent] = useState(false);
  const [ageBand, setAgeBand] = useState<AgeBand | null>(null);
  const [consent, setConsent] = useState(false);
  // Ask for age only when signup didn't capture it (e.g. Google sign-in)
  const STEPS = useMemo<readonly Step[]>(() => (me && !me.ageConfirmed ? ALL_STEPS : ALL_STEPS.filter((s) => s !== 'age')), [me]);

  useEffect(() => setHasIntent(Boolean(peekIntent())), []);

  useEffect(() => {
    if (me && !familiarity && me.onboarded) setFamiliarity(me.familiarity);
  }, [me, familiarity]);

  const { data: assess } = useQuery({
    queryKey: ['assessment-questions'],
    queryFn: () => api<{ questions: { prompt: string; options: string[]; topic: string }[] }>('/assessments'),
    staleTime: Infinity,
  });
  const questions = useMemo(() => assess?.questions ?? [], [assess]);
  useEffect(() => {
    if (questions.length && answers.length !== questions.length) setAnswers(questions.map(() => null));
  }, [questions, answers.length]);

  const current: Step = STEPS[Math.min(step, STEPS.length - 1)];
  const go = (delta: number) => {
    play('click');
    setDir(delta);
    setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + delta)));
  };

  const ageOk = ageBand !== null && ageBand !== 'UNDER_13' && (ageBand !== 'TEEN_13_17' || consent);
  const canNext =
    current === 'age' ? ageOk : current === 'familiarity' ? Boolean(familiarity) : current === 'tutorial' ? tutorialDone : true;
  const allAnswered = answers.length > 0 && answers.every((a) => a !== null);

  const postOnboarding = (startMission: boolean) =>
    api<{ mission: SessionDTO | null }>('/onboarding', {
      method: 'POST',
      json: {
        familiarity,
        tutorialDone: true,
        assessmentAnswers: allAnswered ? (answers as number[]) : undefined,
        startMission,
        ...(me && !me.ageConfirmed && ageBand ? { ageBand, parentConsent: consent } : {}),
      },
    });

  /** startMission=false is "Skip, take me home": never starts a game. */
  async function finish(startMission: boolean) {
    if (!familiarity) return;
    setBusy(true);
    const intent = startMission ? peekIntent() : null;
    let res: { mission: SessionDTO | null };
    try {
      res = await postOnboarding(startMission && !intent);
      await refreshMe();
    } catch (e) {
      toast.error('Something went wrong', (e as Error).message);
      setBusy(false);
      return;
    }
    burstConfetti('big');
    play('levelup');
    if (!startMission) return router.replace('/home');

    if (intent?.intent === 'PLAY') {
      takeIntent();
      try {
        const s = await gameApi.start(intent.slug, { daily: intent.daily });
        return router.replace(`/play/${s.sessionId}`);
      } catch (e) {
        // e.g. GAME_LOCKED for a brand-new player: fall back to the first mission (onboarding POST is idempotent)
        toast.info('That game isn’t open yet', `${(e as Error).message} Let’s start with your first mission.`);
        try {
          res = await postOnboarding(true);
        } catch {
          return router.replace('/home');
        }
      }
    }
    if (res.mission) return router.replace(`/play/${res.mission.sessionId}`);
    router.replace('/home');
  }

  const mission = ONBOARDING_MISSIONS[familiarity ?? 'BEGINNER'];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="grid-bg absolute inset-0 -z-10" />
      <motion.div aria-hidden className="absolute -left-32 top-10 -z-10 h-80 w-80 rounded-full bg-brand/25 blur-3xl" animate={{ x: [0, 60, 0] }} transition={{ duration: 14, repeat: Infinity }} />
      <motion.div aria-hidden className="absolute -right-32 bottom-0 -z-10 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" animate={{ y: [0, -60, 0] }} transition={{ duration: 12, repeat: Infinity }} />

      <div className="container-page max-w-3xl py-10">
        <div className="mb-8 flex items-center justify-center gap-2" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <motion.span key={s} className={cn('h-2 rounded-full', i <= step ? 'bg-brand' : 'bg-border')} animate={{ width: i === step ? 32 : 8 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} />
          ))}
        </div>

        <div className="relative min-h-[460px]">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={current}
              custom={dir}
              initial={{ opacity: 0, x: dir * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -60 }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            >
              {current === 'intro' && <IntroStep name={me?.displayName ?? 'there'} />}
              {current === 'age' && <AgeStep value={ageBand} consent={consent} onChange={(b) => { play('click'); setAgeBand(b); }} onConsent={setConsent} />}
              {current === 'familiarity' && <FamiliarityStep value={familiarity} onChange={(f) => { play('click'); setFamiliarity(f); }} />}
              {current === 'assessment' && (
                <AssessmentStep questions={questions} answers={answers} onAnswer={(i, c) => setAnswers((a) => a.map((v, j) => (j === i ? c : v)))} />
              )}
              {current === 'tutorial' && <TutorialStep onDone={() => { setTutorialDone(true); play('success'); }} />}
              {current === 'rules' && <RulesStep />}
              {current === 'mission' && <FirstMissionStep mission={mission} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => go(-1)} disabled={step === 0 || busy}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {current === 'assessment' && !allAnswered && <Button variant="ghost" onClick={() => go(1)}>Skip</Button>}
            {current === 'mission' ? (
              <>
                <Button variant="outline" onClick={() => finish(false)} disabled={busy}>Skip, take me home</Button>
                <Button size="lg" onClick={() => finish(true)} loading={busy}>
                  <Rocket className="h-4 w-4" /> {hasIntent ? 'Let’s play' : 'Start mission'}
                </Button>
              </>
            ) : (
              <Button onClick={() => go(1)} disabled={!canNext}>
                {current === 'assessment' && allAnswered ? 'Done' : 'Continue'} <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
