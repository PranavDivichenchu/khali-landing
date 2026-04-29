/**
 * GET /api/news/feed
 *
 * Queries Supabase directly — no Express server needed.
 * Mirrors dbService.getReadyFeed() from the Express server.
 * Works on Vercel, local dev, and everywhere else.
 * Videos are Pexels CDN URLs stored in Supabase — they load from any deployment.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = process.env.SUPABASE_URL  ?? "https://nqdgvghrzoerdojgakkc.supabase.co";
const SUPABASE_KEY  = process.env.SUPABASE_ANON_KEY ?? "";

const MAIN_CATS = ["politics","technology","business","health","science","environment","world","lifestyle"];
const MIX_CATS  = ["sports","entertainment"];

function mapStory(item: Record<string, unknown>) {
  let agreeCount = 0, disagreeCount = 0;
  const voteStats = item.story_vote_stats as { agree_count?: number; disagree_count?: number }[] | { agree_count?: number; disagree_count?: number } | null;
  if (Array.isArray(voteStats) && voteStats.length > 0) {
    agreeCount   = voteStats[0].agree_count   ?? 0;
    disagreeCount = voteStats[0].disagree_count ?? 0;
  } else if (voteStats && !Array.isArray(voteStats)) {
    agreeCount   = voteStats.agree_count   ?? 0;
    disagreeCount = voteStats.disagree_count ?? 0;
  }

  const sources = item.sources as { iconURL?: string }[] | null;
  return {
    ...item,
    isAggregated: true,
    isOptimized: true,
    imageURL: sources && sources.length > 0 ? sources[0].iconURL ?? null : null,
    claims: (item.claims as unknown[] | null)?.length
      ? item.claims
      : item.claim ? [item.claim] : [],
    agreeCount,
    disagreeCount,
    videoCredits: item.video_credits,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);

  if (!SUPABASE_KEY) {
    console.error("[feed] SUPABASE_ANON_KEY not set");
    return NextResponse.json({ data: [] });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const [mainRes, mixRes] = await Promise.all([
      supabase
        .from("aggregated_stories")
        .select("*, story_vote_stats(agree_count, disagree_count)")
        .eq("status", "CLIP_READY")
        .in("category", MAIN_CATS)
        .order("date", { ascending: false })
        .limit(limit),

      supabase
        .from("aggregated_stories")
        .select("*, story_vote_stats(agree_count, disagree_count)")
        .eq("status", "CLIP_READY")
        .in("category", MIX_CATS)
        .order("date", { ascending: false })
        .limit(Math.max(5, Math.floor(limit * 0.3))),
    ]);

    const mainItems = mainRes.data ?? [];
    const mixItems  = mixRes.data  ?? [];

    // Interleave: 2 main, 1 mix, 2 main, 1 mix …
    const mixed: ReturnType<typeof mapStory>[] = [];
    let i = 0, j = 0;
    while (i < mainItems.length || j < mixItems.length) {
      if (i < mainItems.length) mixed.push(mapStory(mainItems[i++] as Record<string, unknown>));
      if (i < mainItems.length) mixed.push(mapStory(mainItems[i++] as Record<string, unknown>));
      if (j < mixItems.length)  mixed.push(mapStory(mixItems[j++]  as Record<string, unknown>));
    }

    return NextResponse.json({ data: mixed });
  } catch (err) {
    console.error("[feed] Supabase error:", err);
    return NextResponse.json({ data: [] });
  }
}

