// Helper que usa el fetch EXTENDIDO de Next.js (con cache + revalidate)
// Este fetch es exclusivo de Next.js — react puro no lo tiene.
const API = process.env.NEXT_PUBLIC_API_URL || 'http://44.252.104.3:8080';

export async function apiGet<T = any>(path: string, revalidate: number = 60): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    next: { revalidate },  // ISR: cache ISR estilo Next
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

export async function apiPost<T = any>(path: string, body: any, cache: 'no-store' | 'default' = 'no-store'): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache,
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

export async function apiPostForm<T = any>(path: string, formData: FormData): Promise<T> {
  const r = await fetch(`${API}${path}`, { method: 'POST', body: formData, cache: 'no-store' });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}
