// Shared game contracts used by engines (server), API routes and renderers (client).

export type Familiarity = 'BEGINNER' | 'SOME_EXPERIENCE';
export type AgeBand = 'UNDER_13' | 'TEEN_13_17' | 'ADULT_18_24' | 'ADULT_25_PLUS';
export type GameCategory = 'STOCKS' | 'LIFE' | 'CHALLENGE';
export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type SessionStatus = 'ACTIVE' | 'PAUSED' | 'FINISHED' | 'ABANDONED';

export interface GameState {
  turn: number;
  score: number;
  finished: boolean;
  [k: string]: unknown;
}

export interface Action {
  type: string;
  payload?: Record<string, unknown>;
  /** Optional label and hint the ChoicePanel renders; engines fill these in. */
  label?: string;
  hint?: string;
}

export type GameEventKind = 'CONSEQUENCE' | 'MARKET_NEWS' | 'TIP' | 'SCORE' | 'WALLET';

export interface GameEvent {
  kind: GameEventKind;
  message: string; // shown in ConsequenceFeed
  delta?: number;
}

export interface ActionOutcome<S extends GameState = GameState> {
  state: S;
  events: GameEvent[];
  availableActions: Action[];
}

export interface GameResult {
  finalScore: number;
  /** 0–1 share of the best possible score; drives XP and coins. */
  performance: number;
  learnings: string[];
  stats: Record<string, number | string>;
  goalReached: boolean;
}

export interface EngineUser {
  id: string;
  familiarity: Familiarity;
}

export interface GameEngine<S extends GameState = GameState> {
  readonly slug: string;
  init(config: unknown, user: EngineUser, seed: number): S;
  getAvailableActions(state: S): Action[];
  applyAction(state: S, action: Action): ActionOutcome<S>; // pure: same input = same output
  isFinished(state: S): boolean;
  computeResult(state: S): GameResult;
  /** The state as sent to the client: strips the RNG position, hidden answers and anything else that predicts outcomes. */
  publicState(state: S): GameState;
}

export class GameRuleError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

// ── API DTOs ──

export interface SessionDTO {
  sessionId: string;
  gameSlug: string;
  status: SessionStatus;
  turn: number;
  state: GameState;
  availableActions: Action[];
  context: SessionContext;
  result?: FinishedSummary | null;
}

export interface SessionContext {
  daily?: string;
  mission?: boolean;
}

export interface ProgressUpdate {
  xpEarned: number;
  coinsEarned: number; // paise
  totalXp: number;
  level: number;
  levelUp: boolean;
  newAchievements: { code: string; title: string; icon: string }[];
  streak: number;
}

export interface FinishedSummary {
  finalScore: number;
  learnings: string[];
  stats: Record<string, number | string>;
  goalReached: boolean;
  progress: ProgressUpdate;
}

export interface ActResponse extends ActionOutcome {
  turn: number;
  status: SessionStatus;
  result?: FinishedSummary;
}
