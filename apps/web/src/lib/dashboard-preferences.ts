export const HIDE_EMPTY_SECTIONS_KEY = 'todon:dashboard-hide-empty-sections';

export function readHideEmptySections(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  const stored = window.localStorage.getItem(HIDE_EMPTY_SECTIONS_KEY);
  if (stored === null) {
    return true;
  }

  return stored === 'true';
}

export function writeHideEmptySections(value: boolean) {
  window.localStorage.setItem(HIDE_EMPTY_SECTIONS_KEY, String(value));
}
