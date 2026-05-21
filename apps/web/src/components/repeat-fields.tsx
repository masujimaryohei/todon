'use client';

import type { RepeatType } from '@todon/shared';

type Props = {
  repeatType: RepeatType;
  onRepeatTypeChange: (value: RepeatType) => void;
  repeatIntervalDays: number;
  onRepeatIntervalDaysChange: (value: number) => void;
  flexibleMinDays: number;
  onFlexibleMinDaysChange: (value: number) => void;
  flexibleMaxDays: number;
  onFlexibleMaxDaysChange: (value: number) => void;
};

export function RepeatFields({
  repeatType,
  onRepeatTypeChange,
  repeatIntervalDays,
  onRepeatIntervalDaysChange,
  flexibleMinDays,
  onFlexibleMinDaysChange,
  flexibleMaxDays,
  onFlexibleMaxDaysChange,
}: Props) {
  return (
    <div className="space-y-3 todon-card p-4">
      <p className="text-sm font-bold text-todon-primary">リピート 🔁</p>

      <div className="space-y-2">
        <label className="todon-label">種別</label>
        <select
          className="todon-input"
          value={repeatType}
          onChange={(e) => onRepeatTypeChange(e.target.value as RepeatType)}
        >
          <option value="none">なし</option>
          <option value="fixed">固定（毎 N 日）</option>
          <option value="flexible">だいたい（最短〜最長日数）</option>
        </select>
      </div>

      {repeatType === 'fixed' ? (
        <div className="space-y-2">
          <label className="todon-label">間隔（日）</label>
          <input
            type="number"
            min={1}
            max={365}
            className="todon-input"
            value={repeatIntervalDays}
            onChange={(e) => onRepeatIntervalDaysChange(Number(e.target.value))}
          />
        </div>
      ) : null}

      {repeatType === 'flexible' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="todon-label">最短（日）</label>
            <input
              type="number"
              min={1}
              max={90}
              className="todon-input"
              value={flexibleMinDays}
              onChange={(e) => onFlexibleMinDaysChange(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <label className="todon-label">最長（日）</label>
            <input
              type="number"
              min={1}
              max={180}
              className="todon-input"
              value={flexibleMaxDays}
              onChange={(e) => onFlexibleMaxDaysChange(Number(e.target.value))}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
