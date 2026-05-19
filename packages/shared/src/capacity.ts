/** 今日の作業余力（仕様 13章） */
export type CapacityLevel = 'relaxed' | 'normal' | 'busy' | 'overload';

export const CAPACITY_LABELS: Record<CapacityLevel, string> = {
  relaxed: '余裕あり',
  normal: '普通',
  busy: '忙しい',
  overload: '今日は無理',
};

export function isCapacityLevel(value: string): value is CapacityLevel {
  return value === 'relaxed' || value === 'normal' || value === 'busy' || value === 'overload';
}
