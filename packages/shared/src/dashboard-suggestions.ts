import type { CapacityLevel } from './capacity';

export type DashboardSuggestionContext = {
  capacity: CapacityLevel;
  overdueCount: number;
  dueTodayCount: number;
  heavyOpenCount: number;
  flexibleShowCount: number;
  stalledPendingCount: number;
  highPriorityOpenCount: number;
  anytimeStalledCount: number;
};

/**
 * ダッシュボードの一言提案（v1.5 ルールベース）
 */
export function buildDashboardSuggestion(ctx: DashboardSuggestionContext): string {
  if (ctx.capacity === 'overload') {
    if (ctx.overdueCount > 0) {
      return `今日は無理モードです。期限切れ ${ctx.overdueCount} 件と、本当に重要なものだけに絞りましょう。`;
    }

    return '今日は無理モードです。期限切れと最重要タスクだけを表示しています。';
  }

  if (ctx.overdueCount > 0) {
    return `期限切れが ${ctx.overdueCount} 件あります。まず1件だけ着手するのがおすすめです。`;
  }

  if (ctx.heavyOpenCount >= 2 && ctx.flexibleShowCount > 0) {
    return `今日は重いタスクが ${ctx.heavyOpenCount} 件あるため、だいたいリピートの軽いタスクは明日に回してもよさそうです。`;
  }

  if (ctx.stalledPendingCount >= 3) {
    return '保留タスクが増えています。確認待ちのものを一度整理すると進みやすくなります。';
  }

  if (ctx.highPriorityOpenCount >= 3) {
    return `重要度が高いタスクが ${ctx.highPriorityOpenCount} 件残っています。まずは1つだけ進める時間を確保しましょう。`;
  }

  if (ctx.anytimeStalledCount >= 5) {
    return 'いつでもタスクが溜まっています。今週は3件だけ片付ける日を作るのがおすすめです。';
  }

  if (ctx.dueTodayCount > 0) {
    return `今日が期限のタスクが ${ctx.dueTodayCount} 件あります。重いものからではなく、短いものから1つ片付けましょう。`;
  }

  if (ctx.capacity === 'relaxed') {
    return '今日は余裕がありそうです。後回しにしていたタスクに少しだけ手を付けてみましょう。';
  }

  return '今日のタスク量はおおむねバランスが取れています。このまま1つずつ進めましょう。';
}
