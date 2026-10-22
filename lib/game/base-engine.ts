import { SeededRandom } from './seeded-random';
import {
  GameRuleError,
  type Action,
  type ActionOutcome,
  type EngineUser,
  type GameEngine,
  type GameEvent,
  type GameResult,
  type GameState,
} from './types';

/** Every engine state carries its PRNG position so applyAction is a pure function of (state, action). */
export interface BaseState extends GameState {
  rngState: number;
  learned: string[];
}

export abstract class BaseGameEngine<S extends BaseState> implements GameEngine<S> {
  abstract readonly slug: string;

  abstract init(config: unknown, user: EngineUser, seed: number): S;
  abstract getAvailableActions(state: S): Action[];
  abstract isFinished(state: S): boolean;
  abstract computeResult(state: S): GameResult;

  /** Mutates the cloned state and returns the events produced. */
  protected abstract step(state: S, action: Action, rng: SeededRandom): GameEvent[];

  applyAction(state: S, action: Action): ActionOutcome<S> {
    this.validate(state, action);
    const next = structuredClone(state) as S;
    const rng = new SeededRandom(next.rngState);
    const events = this.step(next, action, rng);
    next.rngState = rng.state;
    next.turn = state.turn + 1;
    next.finished = this.isFinished(next);
    return { state: next, events, availableActions: next.finished ? [] : this.getAvailableActions(next) };
  }

  /** Default redaction: drop the PRNG position. Engines with hidden answers extend this. */
  publicState(state: S): GameState {
    const { rngState: _rng, ...rest } = state;
    return rest as unknown as GameState;
  }

  protected validate(state: S, action: Action): void {
    if (state.finished) throw new GameRuleError('GAME_FINISHED', 'This game has already ended.');
    const allowed = this.getAvailableActions(state).map((a) => a.type);
    if (!allowed.includes(action.type)) {
      throw new GameRuleError('INVALID_ACTION', `Action ${action.type} is not allowed right now.`);
    }
  }

  protected summarizeLearnings(state: S, fallback: string[]): string[] {
    const unique = Array.from(new Set([...state.learned, ...fallback]));
    return unique.slice(0, 4);
  }

  protected baseState(seed: number): Pick<BaseState, 'turn' | 'score' | 'finished' | 'rngState' | 'learned'> {
    return { turn: 0, score: 0, finished: false, rngState: seed >>> 0, learned: [] };
  }
}

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
