import { NextRequest, NextResponse } from "next/server";

// Try Railway first; fall back to local server if Railway is down / 404s
const UPSTREAMS = [
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aydhi-production.up.railway.app",
  "http://127.0.0.1:3001",
  "http://localhost:3001",
];

async function tryFetch(base: string, offset: string, limit: string) {
  const url = `${base}/api/news/feed?offset=${offset}&limit=${limit}`;
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${base} → ${res.status}`);
  return res.json();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const offset = searchParams.get("offset") ?? "0";
  const limit  = searchParams.get("limit")  ?? "10";

  const errors: string[] = [];

  for (const upstream of UPSTREAMS) {
    try {
      const data = await tryFetch(upstream, offset, limit);
      // Log which host served the request
      console.log(`[feed proxy] served from ${upstream}`);
      return NextResponse.json(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      console.warn(`[feed proxy] ${upstream} failed: ${msg}`);
    }
  }

  console.error("[feed proxy] all upstreams failed:", errors);
  return NextResponse.json(
    { data: [], error: "All upstream servers are unreachable.", details: errors },
    { status: 503 }
  );
}
