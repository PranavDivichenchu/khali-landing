export type WeightLevel = 0 | 1 | 2 | 3;

export type CaptionMode = 'Messages' | 'Subtitles' | 'Off';

export interface NewsSource {
  sourceAPI?: string | null;
  iconURL?: string | null;
  articleURL?: string | null;
  originalTitle?: string | null;
  leaning?: string | null;
}

export interface CaptionSegment {
  text: string;
  start: number;
  end: number;
  speakerId?: number | null;
  speaker?: string | null;
}

export interface VideoCredits {
  photographer?: string | null;
  photographer_url?: string | null;
  source?: string | null;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string[];
  imageURL?: string | null;
  date: string;
  category: string;
  leftPerspective?: string | null;
  rightPerspective?: string | null;
  clipUrl?: string | null;
  clipDuration?: number | null;
  claims: string[];
  youtubeID?: string | null;
  articleURL?: string | null;
  sourceAPI?: string | null;
  sampleQuestion?: string | null;
  aiGenerated?: boolean | null;
  topic?: string | null;
  titleAudioPath?: string | null;
  descriptionAudioPath?: string | null;
  claimAudioPath?: string | null;
  podcastAudioPath?: string | null;
  captionData?: CaptionSegment[] | null;
  isMockData?: boolean | null;
  isAd?: boolean | null;
  isAggregated?: boolean | null;
  sourceCount?: number | null;
  sources?: NewsSource[] | null;
  agreeCount: number;
  disagreeCount: number;
  videoCredits?: VideoCredits | null;
}

export interface Viewer {
  id: string;
  email?: string | null;
  name?: string | null;
  isGuest: boolean;
}

export const CATEGORY_OPTIONS = [
  'politics',
  'technology',
  'business',
  'sports',
  'entertainment',
  'health',
  'science',
  'lifestyle',
  'environment',
  'world',
] as const;

export type CategoryName = (typeof CATEGORY_OPTIONS)[number];

export type CategoryWeights = Record<string, WeightLevel>;
