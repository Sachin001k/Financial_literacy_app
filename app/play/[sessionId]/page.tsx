'use client';

import { GameShell } from '@/components/play/game-shell';

export default function PlayPage({ params }: { params: { sessionId: string } }) {
  return <GameShell sessionId={params.sessionId} />;
}
