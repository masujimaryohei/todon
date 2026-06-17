export type AppScope =
  | { mode: 'personal' }
  | { mode: 'team'; teamId: string; teamName?: string; teamIcon?: string | null };

export const SCOPE_STORAGE_KEY = 'todon:app-scope';

export function readAppScope(): AppScope | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SCOPE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as AppScope;
    if (parsed.mode === 'personal') {
      return { mode: 'personal' };
    }
    if (parsed.mode === 'team' && parsed.teamId) {
      return parsed;
    }
  } catch {
    // ignore
  }

  return null;
}

export function writeAppScope(scope: AppScope) {
  window.localStorage.setItem(SCOPE_STORAGE_KEY, JSON.stringify(scope));
}

export function scopeFromPathname(pathname: string): AppScope | null {
  const match = pathname.match(/^\/teams\/([^/]+)/);
  if (match?.[1]) {
    return { mode: 'team', teamId: match[1] };
  }

  if (
    pathname === '/dashboard' ||
    pathname.startsWith('/tasks') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/habits') ||
    pathname.startsWith('/templates') ||
    pathname.startsWith('/reviews') ||
    pathname.startsWith('/archive') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/gantt')
  ) {
    return { mode: 'personal' };
  }

  return null;
}

export function teamDisplayIcon(team: { icon?: string | null; name: string }) {
  if (team.icon?.trim()) {
    return team.icon.trim();
  }

  return team.name.trim().slice(0, 1) || '👥';
}
