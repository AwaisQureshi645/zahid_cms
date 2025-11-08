// Get API base URL from environment variable or use relative path
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Get the full API URL by prepending the base URL if provided
 */
function getApiUrl(path: string): string {
  if (API_BASE_URL && !path.startsWith('http')) {
    // Remove trailing slash from base URL and leading slash from path
    const base = API_BASE_URL.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  }
  return path;
}

export async function apiGet<T>(path: string): Promise<T> {
  const url = getApiUrl(path);
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `GET ${path} failed with ${res.status}`);
  }
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const url = getApiUrl(path);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `POST ${path} failed with ${res.status}`);
  }
  return res.json();
}


