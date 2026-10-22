export type AchievementEvent =
  | { kind: 'game.finished'; gameSlug: string; score: number; goalReached: boolean; stats: Record<string, number | string> }
  | { kind: 'lesson.completed'; lessonSlug: string; quizScore: number }
  | { kind: 'streak'; days: number }
  | { kind: 'level'; level: number };

export interface AchievementDef {
  code: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  /** Evaluated against the triggering event plus simple user counters. */
  rule: (e: AchievementEvent, ctx: { gamesFinished: number; lessonsCompleted: number }) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { code: 'FIRST_GAME', title: 'First Steps', description: 'Finish your first game', icon: '🎮', xpReward: 20,
    rule: (e, c) => e.kind === 'game.finished' && c.gamesFinished >= 1 },
  { code: 'FIRST_TRADE', title: 'First Trade', description: 'Buy your first asset in the Investment Simulator', icon: '💹', xpReward: 20,
    rule: (e) => e.kind === 'game.finished' && e.gameSlug === 'investment-simulator' && Number(e.stats.trades ?? 0) > 0 },
  { code: 'DIVERSIFIED', title: 'Diversified', description: 'Hold 4+ asset types at once', icon: '🧺', xpReward: 30,
    rule: (e) => e.kind === 'game.finished' && ['investment-simulator', 'portfolio-builder'].includes(e.gameSlug) && Number(e.stats.assetTypes ?? 0) >= 4 },
  { code: 'BUDGET_BOSS', title: 'Budget Boss', description: 'Hit the savings goal in Life Simulator', icon: '🏆', xpReward: 40,
    rule: (e) => e.kind === 'game.finished' && e.gameSlug === 'life-simulator' && e.goalReached },
  { code: 'SCAM_SPOTTER', title: 'Scam Spotter', description: 'Catch every scam in Scam or Legit with no false alarms', icon: '🕵️', xpReward: 30,
    rule: (e) => e.kind === 'game.finished' && e.gameSlug === 'scam-or-legit' && Number(e.stats.scamsMissed ?? 1) === 0 && Number(e.stats.falseAlarms ?? 1) === 0 },
  { code: 'CHART_READER', title: 'Chart Reader', description: 'Hit a 5-call streak in Bull or Bear', icon: '🐂', xpReward: 30,
    rule: (e) => e.kind === 'game.finished' && e.gameSlug === 'bull-or-bear' && Number(e.stats.bestStreak ?? 0) >= 5 },
  { code: 'QUIZ_WHIZ', title: 'Quiz Whiz', description: 'Score 100% on a lesson quiz', icon: '🧠', xpReward: 20,
    rule: (e) => e.kind === 'lesson.completed' && e.quizScore === 100 },
  { code: 'BOOKWORM', title: 'Bookworm', description: 'Complete 5 lessons', icon: '📚', xpReward: 40,
    rule: (e, c) => e.kind === 'lesson.completed' && c.lessonsCompleted >= 5 },
  { code: 'STREAK_3', title: 'On a Roll', description: 'Play 3 days in a row', icon: '🔥', xpReward: 20,
    rule: (e) => e.kind === 'streak' && e.days >= 3 },
  { code: 'STREAK_7', title: '7-Day Streak', description: 'Play 7 days in a row', icon: '⚡', xpReward: 50,
    rule: (e) => e.kind === 'streak' && e.days >= 7 },
  { code: 'LEVEL_5', title: 'Rising Star', description: 'Reach level 5', icon: '⭐', xpReward: 50,
    rule: (e) => e.kind === 'level' && e.level >= 5 },
  { code: 'ALL_GAMES', title: 'Explorer', description: 'Finish all 6 games', icon: '🧭', xpReward: 60,
    rule: (e, c) => e.kind === 'game.finished' && c.gamesFinished >= 6 },
];

export const getAchievement = (code: string) => ACHIEVEMENTS.find((a) => a.code === code);
