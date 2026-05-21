import type { PriorityLevel, TaskWeight } from './types';

export type PrioritySuggestion = {
  importance: PriorityLevel;
  urgency: PriorityLevel;
  reason: string;
};

const URGENT_WORDS = ['今日', '至急', 'asap', '締切', '期限', 'deadline', '急ぎ'];
const IMPORTANT_WORDS = ['重要', '必須', 'クライアント', '上司', '本番', 'リリース'];

/**
 * タイトルから重要度・緊急度を推定（v3 ルールベース）
 */
export function suggestPriority(title: string, weight?: TaskWeight): PrioritySuggestion {
  const n = title.trim().toLowerCase();

  let urgency: PriorityLevel = 'medium';
  let importance: PriorityLevel = 'medium';

  if (URGENT_WORDS.some((w) => n.includes(w))) {
    urgency = 'high';
  }

  if (IMPORTANT_WORDS.some((w) => n.includes(w))) {
    importance = 'high';
  }

  if (weight === 'heavy') {
    importance = importance === 'high' ? 'high' : 'medium';
  }

  if (weight === 'light' && urgency === 'medium') {
    urgency = 'low';
  }

  return {
    importance,
    urgency,
    reason: `キーワードと重さ（${weight ?? 'normal'}）から推定しました`,
  };
}
