import type { Action, GameEvent } from '@/lib/game/types';

export interface RendererProps<S = any> {
  state: S;
  actions: Action[];
  onAction: (type: string, payload?: Record<string, unknown>) => void;
  busy: boolean;
  /** Events from the latest action only. */
  events: GameEvent[];
}
