import type { CapacityLevel } from './capacity';
import type { AuthResponse, Category, DashboardPayload, Task, User, WeeklyReview } from './types';

export type ApiClientOptions = {
  baseUrl: string;
  getToken?: () => string | null | undefined;
};

type Json = Record<string, unknown>;

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

export class TodoNApiClient {
  constructor(private readonly opts: ApiClientOptions) {}

  private url(path: string) {
    const base = normalizeBaseUrl(this.opts.baseUrl);
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private async request<T>(
    path: string,
    init: RequestInit & { parseJson?: boolean } = {},
  ): Promise<T> {
    const headers = new Headers(init.headers);
    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json');
    }

    const token = this.opts.getToken?.();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(this.url(path), {
      ...init,
      headers,
      credentials: 'include',
    });

    if (!res.ok) {
      let message = res.statusText;
      try {
        const err = (await res.json()) as Json;
        if (typeof err.message === 'string') {
          message = err.message;
        }
      } catch {
        // ignore
      }
      throw new Error(message || `Request failed: ${res.status}`);
    }

    if (res.status === 204) {
      return undefined as T;
    }

    return (await res.json()) as T;
  }

  register(body: { email: string; password: string; name?: string }) {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  login(body: { email: string; password: string }) {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  logout() {
    return this.request<void>('/api/auth/logout', { method: 'POST' });
  }

  me() {
    return this.request<User>('/api/auth/me');
  }

  listCategories() {
    return this.request<Category[]>('/api/categories');
  }

  createCategory(body: { name: string; color?: string }) {
    return this.request<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  listTasks(params?: { archived?: boolean }) {
    const q = new URLSearchParams();
    if (params?.archived) {
      q.set('archived', 'true');
    }
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return this.request<Task[]>(`/api/tasks${suffix}`);
  }

  createTask(body: Json) {
    return this.request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  getTask(id: string) {
    return this.request<Task>(`/api/tasks/${id}`);
  }

  updateTask(id: string, body: Json) {
    return this.request<Task>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  archiveTask(id: string) {
    return this.request<Task>(`/api/tasks/${id}/archive`, { method: 'POST' });
  }

  deleteTask(id: string) {
    return this.request<void>(`/api/tasks/${id}`, { method: 'DELETE' });
  }

  createSubtask(taskId: string, body: { title: string }) {
    return this.request<unknown>(`/api/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  updateSubtask(subtaskId: string, body: Json) {
    return this.request<unknown>(`/api/subtasks/${subtaskId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  dashboard() {
    return this.request<DashboardPayload>('/api/dashboard');
  }

  getTodayCapacity() {
    return this.request<{ level: CapacityLevel }>('/api/capacity/today');
  }

  setTodayCapacity(level: CapacityLevel) {
    return this.request<{ level: CapacityLevel }>('/api/capacity/today', {
      method: 'PATCH',
      body: JSON.stringify({ level }),
    });
  }

  estimateWeight(title: string) {
    const q = new URLSearchParams({ title });
    return this.request<{ weight: Task['weight'] }>(`/api/tasks/estimate-weight?${q.toString()}`);
  }

  skipFlexibleTask(taskId: string) {
    return this.request<Task>(`/api/tasks/${taskId}/skip-flexible`, { method: 'POST' });
  }

  listReviews() {
    return this.request<WeeklyReview[]>('/api/reviews');
  }

  generateWeeklyReview() {
    return this.request<WeeklyReview>('/api/reviews', { method: 'POST' });
  }
}
