'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/auth-provider';
import { useSound } from '@/components/providers/sound-provider';
import { toast } from '@/components/providers/toaster';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ApiClientError, gameApi, queryKeys } from '@/lib/api';
import { getGame } from '@/lib/content/games';
import type { FinishedSummary, GameEvent, SessionDTO } from '@/lib/game/types';
import { ChoicePanel } from './choice-panel';
import { ConsequenceFeed, type FeedItem } from './consequence-feed';
import { GameHUD } from './game-hud';
import { GameOverScreen } from './game-over-screen';
import { hudStats } from './hud-stats';
import { RENDERERS, SELF_CONTROLLED } from './renderers';

let feedSeq = 0;

export function GameShell({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { refreshMe } = useAuth();
  const { play } = useSound();
  const [busy, setBusy] = useState(false);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [lastEvents, setLastEvents] = useState<GameEvent[]>([]);
  const [result, setResult] = useState<FinishedSummary | null>(null);
  const [quitOpen, setQuitOpen] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [ending, setEnding] = useState(false);
  const [recovery, setRecovery] = useState<'idle' | 'running' | 'failed'>('idle');
  const leaving = useRef(false);
  const inFlight = useRef(false);
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: session, error, refetch } = useQuery({
    queryKey: queryKeys.session(sessionId),
    queryFn: () => gameApi.get(sessionId),
    staleTime: Infinity,
  });

  useEffect(() => () => {
    if (endTimer.current) clearTimeout(endTimer.current);
  }, []);

  const afterFinish = useCallback(() => {
    void refreshMe();
    void qc.invalidateQueries({ queryKey: queryKeys.home });
    void qc.invalidateQueries({ queryKey: queryKeys.games });
    void qc.invalidateQueries({ queryKey: queryKeys.progress });
    void qc.invalidateQueries({ queryKey: queryKeys.achievements });
  }, [qc, refreshMe]);

  // A finished session loaded from the server shows its saved result.
  useEffect(() => {
    if (session?.status === 'FINISHED' && session.result && !result && !ending) setResult(session.result);
  }, [session, result, ending]);

  // FINISHED but no result saved (settling failed or is still running): ask the server to settle it.
  const recover = useCallback(async () => {
    setRecovery('running');
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const summary = await gameApi.finish(sessionId);
        qc.setQueryData<SessionDTO>(queryKeys.session(sessionId), (s) => (s ? { ...s, result: summary } : s));
        afterFinish();
        setResult(summary);
        setRecovery('idle');
        return;
      } catch (e) {
        if (e instanceof ApiClientError && e.code === 'SETTLING') {
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        break;
      }
    }
    setRecovery('failed');
  }, [sessionId, qc, afterFinish]);

  const recoveryStarted = useRef(false);
  useEffect(() => {
    if (session?.status === 'FINISHED' && !session.result && !result && !ending && !recoveryStarted.current) {
      recoveryStarted.current = true;
      void recover();
    }
  }, [session, result, ending, recover]);

  // Best-effort pause when the player leaves mid-game; resume (refetch) when they come back.
  const statusRef = useRef(session?.status);
  statusRef.current = session?.status;
  useEffect(() => {
    let mounted = true;
    const pause = () => {
      if (statusRef.current === 'ACTIVE' && !leaving.current) navigator.sendBeacon?.(`/api/v1/game-sessions/${sessionId}/pause`);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') pause();
      else if (statusRef.current === 'ACTIVE' || statusRef.current === 'PAUSED') void refetch();
    };
    window.addEventListener('pagehide', pause);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      mounted = false;
      window.removeEventListener('pagehide', pause);
      document.removeEventListener('visibilitychange', onVisibility);
      // StrictMode unmounts and remounts immediately in dev; only pause on a real unmount.
      setTimeout(() => {
        if (!mounted && !document.querySelector(`[data-play-session="${sessionId}"]`)) pause();
      }, 0);
    };
  }, [sessionId, refetch]);

  const onAction = useCallback(
    async (type: string, payload?: Record<string, unknown>) => {
      // Ref guard: state updates lag a tick behind, so a fast second tap could reuse a stale turn.
      if (inFlight.current || ending) return;
      const current = qc.getQueryData<SessionDTO>(queryKeys.session(sessionId)) ?? session;
      if (!current) return;
      inFlight.current = true;
      setBusy(true);
      play('click');
      try {
        const res = await gameApi.act(sessionId, { turn: current.turn, type, payload });
        const next: SessionDTO = { ...current, state: res.state, turn: res.turn, status: res.status, availableActions: res.availableActions, result: res.result ?? null };
        qc.setQueryData(queryKeys.session(sessionId), next);
        setLastEvents(res.events);
        setFeed((f) => [...res.events.map((e) => ({ ...e, id: ++feedSeq })).reverse(), ...f].slice(0, 30));

        if (res.events.some((e) => e.kind === 'SCORE' && (e.delta ?? 0) > 0 && !e.message.startsWith('Score'))) play('success');
        else if (res.events.some((e) => (e.delta ?? 0) < 0 && e.kind === 'CONSEQUENCE')) play('fail');
        else if (res.events.some((e) => e.kind === 'WALLET' && (e.delta ?? 0) > 0)) play('coin');

        if (res.result) {
          const summary = res.result;
          afterFinish();
          // Let the last reveal land before the end screen.
          setEnding(true);
          endTimer.current = setTimeout(() => {
            setResult(summary);
            setEnding(false);
          }, 1600);
        }
      } catch (e) {
        if (e instanceof ApiClientError && e.code === 'TURN_MISMATCH') {
          toast.info('Game updated', 'This game moved on in another tab — reloaded the latest state.');
          await refetch();
        } else if (e instanceof ApiClientError && e.status === 409) {
          await refetch();
        } else {
          play('fail');
          toast.error('That move didn’t work', (e as Error).message);
        }
      } finally {
        inFlight.current = false;
        setBusy(false);
      }
    },
    [session, ending, sessionId, qc, play, afterFinish, refetch],
  );

  const pauseAndLeave = async () => {
    leaving.current = true;
    try {
      await gameApi.pause(sessionId);
    } catch {}
    router.push('/games');
  };

  const quit = async () => {
    leaving.current = true;
    try {
      await gameApi.abandon(sessionId);
    } catch {}
    void qc.invalidateQueries({ queryKey: queryKeys.games });
    router.push('/games');
  };

  const replay = async () => {
    if (!session || replaying) return;
    setReplaying(true);
    try {
      // A daily replays today's daily; a mission (or a normal game) starts a normal fresh run.
      const s = await gameApi.start(session.gameSlug, { fresh: true, daily: session.context.daily ? true : undefined });
      router.push(`/play/${s.sessionId}`);
    } catch (e) {
      toast.error('Could not restart', (e as Error).message);
      setReplaying(false);
    }
  };

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="text-5xl">🧭</p>
          <h1 className="mt-3 text-2xl font-bold">We couldn’t load this game</h1>
          <p className="mt-1 text-muted">{(error as Error).message}</p>
          <Link href="/games"><Button className="mt-5">Back to games</Button></Link>
        </div>
      </div>
    );
  }

  if (!session) return <PlayLoading />;

  const game = getGame(session.gameSlug);
  if (!game) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="text-5xl">🧩</p>
          <h1 className="mt-3 text-2xl font-bold">This game isn’t available any more</h1>
          <Link href="/games"><Button className="mt-5">Back to games</Button></Link>
        </div>
      </div>
    );
  }

  if (result) {
    return <GameOverScreen game={game} summary={result} mission={Boolean(session.context.mission)} onReplay={replay} replaying={replaying} />;
  }

  if (session.status === 'ABANDONED') {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="text-5xl">🚪</p>
          <h1 className="mt-3 text-2xl font-bold">You left this game</h1>
          <div className="mt-5 flex justify-center gap-3">
            <Button onClick={replay} loading={replaying}>Start a new run</Button>
            <Link href="/games"><Button variant="outline">All games</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const state = session.state as any;
  const hud = hudStats(game.slug, state);
  const ratio = state.totalTurns ? Math.min(1, session.turn / state.totalTurns) : 0;
  const Renderer = RENDERERS[game.slug];
  const selfControlled = SELF_CONTROLLED.has(game.slug);

  return (
    <div className="min-h-screen" data-play-session={sessionId}>
      <GameHUD game={game} score={state.score ?? 0} progressLabel={hud.progress} ratio={state.finished ? 1 : ratio} stats={hud.stats} onPause={pauseAndLeave} onQuit={() => setQuitOpen(true)} disabled={busy || ending || session.status === 'FINISHED'} />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_320px]">
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-w-0 space-y-5">
          {Renderer ? (
            <Renderer state={state} actions={session.availableActions} onAction={onAction} busy={busy} events={lastEvents} />
          ) : null}
          {!selfControlled && session.availableActions.length > 0 && <ChoicePanel actions={session.availableActions} onAction={onAction} busy={busy} />}
          {state.finished && recovery !== 'failed' && <p className="animate-pulse text-center text-muted">Tallying your results…</p>}
          {recovery === 'failed' && (
            <div className="rounded-2xl border border-loss/30 bg-loss/5 p-4 text-center">
              <p className="font-semibold">We couldn’t save your results yet.</p>
              <div className="mt-3 flex justify-center gap-3">
                <Button size="sm" onClick={() => void recover()}>Try again</Button>
                <Link href="/games"><Button size="sm" variant="outline">All games</Button></Link>
              </div>
            </div>
          )}
        </motion.section>
        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">What’s happening</h2>
          {feed.length ? <ConsequenceFeed items={feed} /> : <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">Make your first move. Consequences and tips will appear here.</p>}
          <p className="pt-2 text-xs text-muted">All money in FinPlay is virtual. No real trading.</p>
        </aside>
      </div>

      <Dialog open={quitOpen} onClose={() => setQuitOpen(false)} labelledBy="quit-title">
        <h2 id="quit-title" className="text-xl font-bold">Quit this game?</h2>
        <p className="mt-2 text-sm text-muted">Your progress in this run will be lost and you won’t earn XP. Use pause instead to come back later.</p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={pauseAndLeave}>Pause instead</Button>
          <Button variant="loss" className="flex-1" onClick={quit}>Quit</Button>
        </div>
      </Dialog>
    </div>
  );
}

export function PlayLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <motion.div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand to-emerald-500 shadow-lg" animate={{ rotate: [0, 180, 360], scale: [1, 0.85, 1], borderRadius: ['24%', '50%', '24%'] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} />
      <p className="text-muted">Loading game…</p>
    </div>
  );
}
