import { Platform } from 'react-native';
import Constants from 'expo-constants';

const extra =
  (Constants.expoConfig?.extra as
    | {
        apiBaseUrl?: string;
        supabaseUrl?: string;
        supabasePublishableKey?: string;
      }
    | undefined) ?? {};

const localWebApiBaseUrl =
  Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : null;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  localWebApiBaseUrl ??
  extra.apiBaseUrl ??
  'https://aydhi-production.up.railway.app';

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  extra.supabaseUrl ??
  'https://nqdgvghrzoerdojgakkc.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  extra.supabasePublishableKey ??
  'sb_publishable__AGRz2iS5m8ZkFVcg9LyoA_wpyAb6f-';
