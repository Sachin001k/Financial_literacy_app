// Category metadata only: safe to import from client components (no quiz answers here).
import type { Category } from './lesson-types';

export type { Category } from './lesson-types';

export const CATEGORIES: Category[] = [
  { slug: 'money-basics', title: 'Money Basics', icon: '💰', blurb: 'What money is, where it goes and why prices rise.', color: '#22c55e', order: 1 },
  { slug: 'budgeting-saving', title: 'Budgeting & Saving', icon: '🐷', blurb: 'Plan your spending and build a safety net.', color: '#f59e0b', order: 2 },
  { slug: 'banking-payments', title: 'Banking & UPI', icon: '🏦', blurb: 'Bank accounts, UPI and staying safe online.', color: '#0ea5e9', order: 3 },
  { slug: 'investing', title: 'Investing', icon: '📈', blurb: 'Stocks, diversification and compounding.', color: '#6366f1', order: 4 },
  { slug: 'risk-protection', title: 'Risk & Protection', icon: '🛡️', blurb: 'Insurance, loans and spotting scams.', color: '#ef4444', order: 5 },
];

export const getCategory = (slug: string) => CATEGORIES.find((c) => c.slug === slug);
