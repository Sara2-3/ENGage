export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// GET without a body, POST with one. The server's message becomes the error.
export async function api(path, body) {
  const res = await fetch(`${API_URL}${path}`, body === undefined ? undefined : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? `Request failed (${res.status})`);
  }
  return res.json();
}
