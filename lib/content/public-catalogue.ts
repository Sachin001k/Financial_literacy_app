import type { GameCardData } from '@/lib/server/catalogue';
import { GAME_SECTIONS, GAMES, gamesInSection, type GameDef } from './games';

/** Logged-out catalogue (no locks/progress) for static rendering. */
export const toCard = ({ config: _config, ...g }: GameDef): GameCardData => g;

export const publicSections = () => GAME_SECTIONS.map((s) => ({ ...s, games: gamesInSection(s.key).map(toCard) }));
export const publicGames = () => GAMES.map(toCard);
