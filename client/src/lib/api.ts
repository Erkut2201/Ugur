// client/src/lib/api.ts
// Typed fetch wrapper. All requests go to /api/* which Vite proxies to Express.

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export async function apiRequest<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    let message = res.statusText;
    let errorData: any = null;
    try {
      errorData = await res.json();
      message = errorData?.error ?? errorData?.message ?? message;
    } catch {}
    const error = new ApiError(res.status, message);
    // Attach full error data for structured error handling
    (error as any).data = errorData;
    throw error;
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>("GET", path),
  post: <T>(path: string, body?: unknown) => apiRequest<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => apiRequest<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>("PATCH", path, body),
  delete: <T>(path: string) => apiRequest<T>("DELETE", path),
};
