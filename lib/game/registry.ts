import type { GameEngine, GameState } from './types';
import { lifeSimulatorEngine } from './engines/life-simulator';
import { investmentSimulatorEngine } from './engines/investment-simulator';
import { moneyChallengesEngine } from './engines/money-challenges';
import { bullOrBearEngine } from './engines/bull-or-bear';
import { portfolioBuilderEngine } from './engines/portfolio-builder';
import { scamOrLegitEngine } from './engines/scam-or-legit';

/** Strategy + Registry: adding a game = one engine class + one register() line. */
export class GameEngineRegistry {
  private engines = new Map<string, GameEngine<GameState>>();

  register(engine: GameEngine<any>) {
    this.engines.set(engine.slug, engine as GameEngine<GameState>);
    return this;
  }

  get(slug: string): GameEngine<GameState> | undefined {
    return this.engines.get(slug);
  }
}

export const registry = new GameEngineRegistry()
  .register(lifeSimulatorEngine)
  .register(investmentSimulatorEngine)
  .register(moneyChallengesEngine)
  .register(bullOrBearEngine)
  .register(portfolioBuilderEngine)
  .register(scamOrLegitEngine);
