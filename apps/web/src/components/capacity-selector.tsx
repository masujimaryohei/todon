'use client';

import { CAPACITY_LABELS, type CapacityLevel } from '@todon/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const levels: CapacityLevel[] = ['relaxed', 'normal', 'busy', 'overload'];

type Props = {
  initial: CapacityLevel;
};

export function CapacitySelector({ initial }: Props) {
  const router = useRouter();
  const [level, setLevel] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function onChange(next: CapacityLevel) {
    setLevel(next);
    setSaving(true);

    try {
      await fetch('/api/capacity/today', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ level: next }),
      });

      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-700">今日のキャパシティ</p>
          <p className="text-sm text-slate-300">だいたいリピートの表示量を調整します</p>
        </div>
        {saving ? <span className="text-xs text-slate-500">保存中…</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {levels.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => void onChange(item)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              level === item
                ? 'bg-emerald-500 font-semibold text-emerald-950'
                : 'border border-slate-700 text-slate-300 hover:border-emerald-700'
            }`}
          >
            {CAPACITY_LABELS[item]}
          </button>
        ))}
      </div>
    </div>
  );
}
