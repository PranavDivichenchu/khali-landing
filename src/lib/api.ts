import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { API_BASE_URL } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import type { CategoryWeights, NewsItem, WeightLevel } from '@/types/news';

WebBrowser.maybeCompleteAuthSession();

function getRedirectUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }

  return Linking.createURL('/auth/callback');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string');
}

export function mapNewsItem(row: Record<string, unknown>): NewsItem {
  const claims = asStringArray(row.claims);
  const claim = typeof row.claim === 'string' ? row.claim : null;
  const sources = Array.isArray(row.sources) ? row.sources : null;
  const firstSource = sources?.find(isRecord);

  return {
    id: String(row.id ?? `${Date.now()}-${Math.random()}`),
    title: typeof row.title === 'string' ? row.title : 'Untitled story',
    summary: asStringArray(row.summary),
    imageURL:
      typeof row.imageURL === 'string'
        ? row.imageURL
        : typeof row.image_url === 'string'
          ? row.image_url
          : typeof firstSource?.iconURL === 'string'
            ? firstSource.iconURL
            : null,
    date: typeof row.date === 'string' ? row.date : new Date().toISOString(),
    category: typeof row.category === 'string' ? row.category : 'current',
    leftPerspective:
      typeof row.leftPerspective === 'string' ? row.leftPerspective : null,
    rightPerspective:
      typeof row.rightPerspective === 'string' ? row.rightPerspective : null,
    clipUrl:
      typeof row.clipUrl === 'string'
        ? row.clipUrl
        : typeof row.clip_url === 'string'
          ? row.clip_url
          : null,
    clipDuration:
      typeof row.clipDuration === 'number'
        ? row.clipDuration
        : typeof row.clip_duration === 'number'
          ? row.clip_duration
          : null,
    claims: claim && !claims.includes(claim) ? [...claims, claim] : claims,
    youtubeID: typeof row.youtubeID === 'string' ? row.youtubeID : null,
    articleURL:
      typeof row.articleURL === 'string'
        ? row.articleURL
        : typeof row.article_url === 'string'
          ? row.article_url
          : null,
    sourceAPI:
      typeof row.sourceAPI === 'string'
        ? row.sourceAPI
        : typeof row.source_api === 'string'
          ? row.source_api
          : null,
    sampleQuestion:
      typeof row.sampleQuestion === 'string'
        ? row.sampleQuestion
        : typeof row.sample_question === 'string'
          ? row.sample_question
          : null,
    aiGenerated: typeof row.aiGenerated === 'boolean' ? row.aiGenerated : true,
    topic: typeof row.topic === 'string' ? row.topic : typeof row.category === 'string' ? row.category : null,
    titleAudioPath:
      typeof row.titleAudioPath === 'string' ? row.titleAudioPath : null,
    descriptionAudioPath:
      typeof row.descriptionAudioPath === 'string'
        ? row.descriptionAudioPath
        : null,
    claimAudioPath:
      typeof row.claimAudioPath === 'string' ? row.claimAudioPath : null,
    podcastAudioPath:
      typeof row.podcastAudioPath === 'string'
        ? row.podcastAudioPath
        : typeof row.podcast_audio_path === 'string'
          ? row.podcast_audio_path
          : null,
    captionData: Array.isArray(row.caption_data)
      ? (row.caption_data as NewsItem['captionData'])
      : Array.isArray(row.podcast_captions)
        ? (row.podcast_captions as NewsItem['captionData'])
        : null,
    isMockData: typeof row.isMockData === 'boolean' ? row.isMockData : false,
    isAd: typeof row.isAd === 'boolean' ? row.isAd : false,
    isAggregated:
      typeof row.isAggregated === 'boolean' ? row.isAggregated : true,
    sourceCount:
      typeof row.sourceCount === 'number'
        ? row.sourceCount
        : typeof row.source_count === 'number'
          ? row.source_count
          : Array.isArray(sources)
            ? sources.length
            : null,
    sources: Array.isArray(sources) ? (sources as NewsItem['sources']) : null,
    agreeCount:
      typeof row.agreeCount === 'number'
        ? row.agreeCount
        : typeof row.agree_count === 'number'
          ? row.agree_count
          : 0,
    disagreeCount:
      typeof row.disagreeCount === 'number'
        ? row.disagreeCount
        : typeof row.disagree_count === 'number'
          ? row.disagree_count
          : 0,
    videoCredits: isRecord(row.videoCredits)
      ? (row.videoCredits as NewsItem['videoCredits'])
      : isRecord(row.video_credits)
        ? (row.video_credits as NewsItem['videoCredits'])
        : null,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (init?.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getAllowedCategories(weights: CategoryWeights) {
  const configured = Object.entries(weights);
  const enabled = configured
    .filter(([, weight]) => weight > 0)
    .map(([category]) => category);
  const blocked = configured.filter(([, weight]) => weight === 0);

  if (!blocked.length || !enabled.length) {
    return undefined;
  }

  return enabled;
}

export async function fetchFeedPage(options: {
  offset: number;
  limit: number;
  weights: CategoryWeights;
}) {
  let query = supabase
    .from('aggregated_stories')
    .select('*')
    .not('clipUrl', 'is', null)
    .order('date', { ascending: false })
    .range(options.offset, options.offset + options.limit - 1);

  const allowedCategories = getAllowedCategories(options.weights);
  if (allowedCategories?.length) {
    query = query.in('category', allowedCategories);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapNewsItem(row as Record<string, unknown>));
}

export async function fetchRecommendations(userId: string, limit = 30) {
  const response = await request<{ data: Record<string, unknown>[] }>(
    `/api/news/recommendations/${encodeURIComponent(userId)}?limit=${limit}`,
  );

  return (response.data ?? []).map(mapNewsItem);
}

export async function fetchLearnedWeights(userId: string) {
  return request<Record<string, WeightLevel>>(
    `/api/news/learned-weights/${encodeURIComponent(userId)}`,
  );
}

export async function savePreferences(userId: string, preferences: CategoryWeights) {
  await request<{ success: boolean }>('/api/news/preferences', {
    method: 'POST',
    body: JSON.stringify({ userId, preferences }),
  });
}

export async function recordVote(userId: string, storyId: string, vote: 'agree' | 'disagree') {
  return request<{ stats?: { agreeCount?: number; disagreeCount?: number } }>(
    '/api/news/vote',
    {
      method: 'POST',
      body: JSON.stringify({ userId, storyId, vote }),
    },
  );
}

async function askQuestionViaEdgeFunction(
  userId: string,
  newsId: string,
  question: string,
  context?: {
    title?: string | null;
    summary?: string[];
    claims?: string[];
  },
) {
  const { data, error } = await supabase.functions.invoke('ask-question', {
    body: {
      userId,
      newsId,
      question,
      title: context?.title ?? null,
      summary: context?.summary ?? [],
      claims: context?.claims ?? [],
    },
  });

  if (error) {
    throw new Error(error.message || 'Edge function invocation failed.');
  }

  if (!isRecord(data) || typeof data.answer !== 'string') {
    throw new Error('Edge function returned an invalid response payload.');
  }

  return data.answer;
}

export async function askQuestion(userId: string, item: NewsItem, question: string) {
  try {
    return await askQuestionViaEdgeFunction(userId, item.id, question, {
      title: item.title,
      summary: item.summary,
      claims: item.claims,
    });
  } catch {
    const response = await request<{ answer: string }>('/api/news/qa', {
      method: 'POST',
      body: JSON.stringify({ userId, newsId: item.id, question }),
    });

    return response.answer;
  }
}

export async function signInWithApple() {
  if (Platform.OS === 'web') {
    // Web: Apple OAuth redirect flow
    const redirectTo = getRedirectUrl();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo },
    });
    if (error) throw error;
    return;
  }

  // Native iOS: use expo-apple-authentication for the native Sign in with Apple sheet
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AppleAuth = require('expo-apple-authentication');
  const credential = await AppleAuth.signInAsync({
    requestedScopes: [
      AppleAuth.AppleAuthenticationScope.FULL_NAME,
      AppleAuth.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('Apple Sign In did not return an identity token.');
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });

  if (error) throw error;
}

export async function signInWithGoogle() {
  const redirectTo = getRedirectUrl();

  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      throw error;
    }

    return;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    throw error;
  }

  if (!data.url) {
    throw new Error('Supabase did not return an auth URL.');
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) {
    throw new Error('Google sign-in was cancelled.');
  }

  await completeAuthSession(result.url);
}

export async function completeAuthSession(url: string) {
  const parsed = new URL(url);
  const code = parsed.searchParams.get('code');
  const accessToken =
    parsed.hash
      .replace(/^#/, '')
      .split('&')
      .map((entry) => entry.split('='))
      .find(([key]) => key === 'access_token')?.[1] ?? null;
  const refreshToken =
    parsed.hash
      .replace(/^#/, '')
      .split('&')
      .map((entry) => entry.split('='))
      .find(([key]) => key === 'refresh_token')?.[1] ?? null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw error;
    }
    return;
  }

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: decodeURIComponent(accessToken),
      refresh_token: decodeURIComponent(refreshToken),
    });

    if (error) {
      throw error;
    }
  }
}
