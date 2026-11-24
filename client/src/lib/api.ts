// Thin fetch wrapper for the Worqube API. The session is an httpOnly cookie, so the
// browser attaches it automatically; requests are same-origin (Vite proxies /api in dev).
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Options = { method?: string; body?: unknown; form?: FormData };

export async function api<T>(path: string, { method = 'GET', body, form }: Options = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.message ?? `Request failed (${res.status})`);
  return data as T;
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong';
