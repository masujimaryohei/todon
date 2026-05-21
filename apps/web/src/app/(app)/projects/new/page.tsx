'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) {
        throw new Error('作成に失敗');
      }
      const project = await res.json();
      router.push(`/projects/${project.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="todon-page-title">プロジェクト作成</h1>
      <form onSubmit={(e) => void onSubmit(e)} className="todon-card space-y-4 p-6">
        <input className="todon-input" placeholder="名前" value={name} onChange={(e) => setName(e.target.value)} required />
        <textarea
          className="todon-input min-h-[100px]"
          placeholder="説明（任意）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit" className="todon-btn-primary" disabled={loading}>
          作成
        </button>
      </form>
      <Link href="/projects" className="todon-link text-sm">
        一覧へ
      </Link>
    </div>
  );
}
