import type { ComponentType } from 'react';
import { BullBearChart } from './bull-bear-chart';
import { ChallengeDeck } from './challenge-deck';
import { InvestSimBoard } from './invest-sim-board';
import { LifeSimBoard } from './life-sim-board';
import { PortfolioBuilderBoard } from './portfolio-builder-board';
import { ScamSwipeDeck } from './scam-swipe-deck';
import type { RendererProps } from './types';

export type { RendererProps } from './types';

/** Game slug → board component. A new game adds one entry here and one engine on the server. */
export const RENDERERS: Record<string, ComponentType<RendererProps>> = {
  'life-simulator': LifeSimBoard,
  'investment-simulator': InvestSimBoard,
  'money-challenges': ChallengeDeck,
  'bull-or-bear': BullBearChart,
  'portfolio-builder': PortfolioBuilderBoard,
  'scam-or-legit': ScamSwipeDeck,
};

/** Renderers that draw their own controls, so the shell skips the generic ChoicePanel. */
export const SELF_CONTROLLED = new Set(Object.keys(RENDERERS));
