export interface Item { id: number; name: string; description: string }
export interface Pipeline { status: string; environment: string; last_build: string }
export interface ApiResult<T = unknown> { status: number; data: T }

// Returns HTTP errors (e.g. 404) as results; only network failures throw.
export async function call<T = unknown>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  return { status: res.status, data: (await res.json()) as T };
}
