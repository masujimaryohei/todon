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
    <div className="todon-card todon-card-sky p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="todon-eyebrow">今日のキャパシティ</p>
          <p className="text-sm text-todon-ink-muted">だいたいリピートの表示量を、気分に合わせて調整</p>
        </div>
        {saving ? <span className="text-xs font-bold text-todon-ink-muted">保存中…</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {levels.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => void onChange(item)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              level === item
                ? 'bg-todon-primary text-white shadow-md'
                : 'border-2 border-todon-border bg-white text-todon-ink-muted hover:border-todon-sky hover:bg-todon-sky-soft'
            }`}
          >
            {CAPACITY_LABELS[item]}
          </button>
        ))}
      </div>
    </div>
  );
}
