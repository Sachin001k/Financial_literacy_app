export interface QuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  slug: string;
  category: string; // category slug
  title: string;
  summary: string;
  /** Lightweight markdown: paragraphs, "## " headings, "- " bullets, **bold**. */
  body: string;
  example: { title: string; body: string };
  readMinutes: number;
  xpReward: number;
  practiseGameSlug?: string;
  order: number;
  questions: QuizQuestion[];
}

export interface Category {
  slug: string;
  title: string;
  icon: string;
  blurb: string;
  color: string; // hex accent
  order: number;
}

export interface AssessmentQuestion extends QuizQuestion {
  topic: string; // category slug, used for the breakdown
}
