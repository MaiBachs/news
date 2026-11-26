export async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const headers = new Headers(options.headers);
  if (method !== 'GET') headers.set('X-Radar-Request', '1');
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');

  const response = await fetch(path, { ...options, headers }).catch(() => {
    throw new Error('Không kết nối được với Radar.');
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(typeof body?.error === 'string' ? body.error : 'Không kết nối được với Radar.');
  }

  return response.status === 204 ? (undefined as T) : response.json();
}

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
