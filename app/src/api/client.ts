// Baza API a Worker-ului Cloudflare (proxy sigur către Sportmonks).
// Setează VITE_API_BASE în .env.production după ce publici Worker-ul.
export const API_BASE = import.meta.env.VITE_API_BASE as string | undefined;

export const isLiveApiConfigured = Boolean(API_BASE);

export async function apiGet<T>(path: string): Promise<T> {
  if (!API_BASE) {
    throw new Error('API_BASE nu este configurat — foloseste date mock.');
  }
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Eroare API: ${res.status}`);
  return res.json();
}
