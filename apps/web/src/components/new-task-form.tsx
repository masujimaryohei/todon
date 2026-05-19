'use client';

import type { Category, RepeatType, TaskWeight, Team } from '@todon/shared';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { RepeatFields } from '@/components/repeat-fields';

type Props = {
  categories: Category[];
  teams: Team[];
};

export function NewTaskForm({ categories, teams }: Props) {
  const searchParams = useSearchParams();
  const initialTeamId = searchParams.get('teamId') ?? '';
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueType, setDueType] = useState<'none' | 'datetime' | 'anytime'>('none');
  const [dueAt, setDueAt] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [importance, setImportance] = useState<'low' | 'medium' | 'high'>('medium');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [weight, setWeight] = useState<TaskWeight>('normal');
  const [repeatType, setRepeatType] = useState<RepeatType>('none');
  const [repeatIntervalDays, setRepeatIntervalDays] = useState(7);
  const [flexibleMinDays, setFlexibleMinDays] = useState(2);
  const [flexibleMaxDays, setFlexibleMaxDays] = useState(4);
  const [scope, setScope] = useState<'personal' | 'team'>(initialTeamId ? 'team' : 'personal');
  const [teamId, setTeamId] = useState(initialTeamId);
  const [assigneeId, setAssigneeId] = useState('');
  const [teamMembers, setTeamMembers] = useState<{ userId: string; label: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (scope !== 'team' || !teamId) {
      return;
    }

    let cancelled = false;

    void fetch(`/api/teams/${teamId}/members`, { credentials: 'include' })
      .then((res) => res.json())
      .then((rows: { userId: string; user?: { name?: string | null; email?: string } }[]) => {
        if (cancelled) {
          return;
        }

        setTeamMembers(
          rows.map((m) => ({
            userId: m.userId,
            label: m.user?.name ?? m.user?.email ?? m.userId,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setTeamMembers([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [scope, teamId]);

  useEffect(() => {
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      return;
    }

    const timer = setTimeout(() => {
      void fetch(`/api/tasks/estimate-weight?title=${encodeURIComponent(trimmed)}`, {
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((body: { weight?: TaskWeight }) => {
          if (body.weight) {
            setWeight(body.weight);
          }
        })
        .catch(() => undefined);
    }, 400);

    return () => clearTimeout(timer);
  }, [title]);

  const duePayload = useMemo(() => {
    if (dueType !== 'datetime' || !dueAt) {
      return { dueType: dueType === 'datetime' ? 'none' : dueType, dueAt: undefined as string | undefined };
    }

    return { dueType: 'datetime' as const, dueAt: new Date(dueAt).toISOString() };
  }, [dueAt, dueType]);

  async function onSubmit(evt: React.FormEvent) {
    evt.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          importance,
          urgency,
          weight,
          scope,
          ...(scope === 'team' ? { teamId, assigneeId: assigneeId || undefined } : {}),
          categoryId: categoryId || undefined,
          dueType: repeatType === 'flexible' ? 'flexible' : duePayload.dueType,
          ...(duePayload.dueAt ? { dueAt: duePayload.dueAt } : {}),
          repeatType,
          ...(repeatType === 'fixed' ? { repeatIntervalDays } : {}),
          ...(repeatType === 'flexible' ? { flexibleMinDays, flexibleMaxDays } : {}),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? '作成に失敗しました');
      }

      const task = await res.json();

      router.push(`/tasks/${task.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '作成に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="space-y-2">
        <label className="text-sm text-slate-200">タイトル（必須）</label>
        <input
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-slate-200">詳細</label>
        <textarea
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-slate-200">スコープ</label>
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            value={scope}
            onChange={(e) => {
              const next = e.target.value as 'personal' | 'team';
              setScope(next);
              if (next !== 'team') {
                setTeamId('');
                setAssigneeId('');
                setTeamMembers([]);
              }
            }}
          >
            <option value="personal">個人</option>
            <option value="team">チーム</option>
          </select>
        </div>

        {scope === 'team' ? (
          <>
            <div className="space-y-2">
              <label className="text-sm text-slate-200">チーム</label>
              <select
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                value={teamId}
                onChange={(e) => {
                  setTeamId(e.target.value);
                  setAssigneeId('');
                }}
                required
              >
                <option value="">選択してください</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-200">担当者（任意）</label>
              <select
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">未割当</option>
                {teamMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm text-slate-200">期日タイプ</label>
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            value={dueType}
            onChange={(e) => setDueType(e.target.value as typeof dueType)}
          >
            <option value="none">なし</option>
            <option value="datetime">日時指定</option>
            <option value="anytime">いつでも</option>
          </select>
        </div>

        {dueType === 'datetime' ? (
          <div className="space-y-2">
            <label className="text-sm text-slate-200">期限</label>
            <input
              type="datetime-local"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm text-slate-200">カテゴリ</label>
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">なし</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-200">重要度</label>
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            value={importance}
            onChange={(e) => setImportance(e.target.value as typeof importance)}
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-200">緊急度</label>
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as typeof urgency)}
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-200">タスクの重さ</label>
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            value={weight}
            onChange={(e) => setWeight(e.target.value as typeof weight)}
          >
            <option value="light">軽い</option>
            <option value="normal">普通</option>
            <option value="heavy">重い</option>
          </select>
        </div>
      </div>

      <RepeatFields
        repeatType={repeatType}
        onRepeatTypeChange={setRepeatType}
        repeatIntervalDays={repeatIntervalDays}
        onRepeatIntervalDaysChange={setRepeatIntervalDays}
        flexibleMinDays={flexibleMinDays}
        onFlexibleMinDaysChange={setFlexibleMinDays}
        flexibleMaxDays={flexibleMaxDays}
        onFlexibleMaxDaysChange={setFlexibleMaxDays}
      />

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? '保存中…' : '作成する'}
        </button>
        <Link href="/tasks" className="text-sm text-emerald-300 hover:underline">
          キャンセル
        </Link>
      </div>
    </form>
  );
}
