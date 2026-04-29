// Khali API utility
// - getFullUrl: resolves media asset URLs (images/videos) — always hits Railway directly
// - fetchFeed: uses the local Next.js proxy (/api/news/feed) to avoid CORS
export const RAILWAY_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://aydhi-production.up.railway.app";

/** Resolve a relative media path to an absolute Railway URL */
export function getFullUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${RAILWAY_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export interface NewsItem {
  id: string;
  title: string;
  summary?: string[];
  clipUrl?: string;
  imageURL?: string;
  category?: string;
  createdAt?: string;
}

export interface FeedResponse {
  data: NewsItem[];
}

/**
 * Fetch news feed items.
 * In the browser this calls the local Next.js proxy (/api/news/feed)
 * which forwards the request to Railway server-side, bypassing CORS.
 */
export async function fetchFeed(
  offset = 0,
  limit = 10
): Promise<FeedResponse> {
  // Use a relative URL so it hits the Next.js proxy when called from the browser,
  // and the env var when called from server components / route handlers.
  const base = typeof window !== "undefined" ? "" : RAILWAY_URL;
  const url = `${base}/api/news/feed?offset=${offset}&limit=${limit}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.warn(`Feed proxy responded ${res.status} — returning empty feed`);
      return { data: [] };
    }
    return await res.json();
  } catch (err) {
    console.error("Error fetching feed:", err);
    return { data: [] };
  }
}
