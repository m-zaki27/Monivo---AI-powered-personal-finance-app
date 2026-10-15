import { daysInMonth, startOfMonth } from '@/lib/dates';
import type { CategoryColor } from '@/theme/tokens';

import { invokeAi } from './ai';

// The Edge Function computes all figures from the user's rows; Gemini only phrases the answer.

export type AnswerCard =
  | { kind: 'bars'; title: string; items: { label: string; value: number; color: CategoryColor }[] }
  | { kind: 'budget'; spent: number; limit: number; threshold: number; projected: number; daysLeft: number }
  | { kind: 'stat'; label: string; value: number; deltaPct?: number; caption?: string };

export interface AssistantReply {
  text: string;
  card?: AnswerCard;
  followUps?: string[];
}

export interface AskInput {
  question: string;
  /** Context for follow-ups like "and last month?" */
  history?: { role: 'user' | 'assistant'; text: string }[];
}

export const starterPrompts = ['How much did I spend on food?', 'Am I on budget?', 'Where does my money go?', 'What are my subscriptions?'];

export function ask({ question, history = [] }: AskInput): Promise<AssistantReply> {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  // Same day last month (clamped), for like-for-like comparisons.
  const prevSamePoint = new Date(prev.getFullYear(), prev.getMonth(), Math.min(now.getDate(), daysInMonth(prev)), 23, 59, 59);
  return invokeAi<AssistantReply>({
    action: 'assistant',
    question,
    history: history.slice(-6),
    // Local-time month boundaries, not UTC.
    monthFrom: startOfMonth(now).toISOString(),
    prevMonthFrom: prev.toISOString(),
    prevSamePoint: prevSamePoint.toISOString(),
    now: now.toISOString(),
    daysInMonth: daysInMonth(now),
  });
}
