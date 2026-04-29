import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CaptionMode, CategoryWeights } from '@/types/news';

const GUEST_ID_KEY = 'khali.guest-id';
const GUEST_ALLOWED_KEY = 'khali.guest-allowed';
const ONBOARDING_KEY = 'khali.onboarding-seen';
const AUDIO_KEY = 'khali.audio-enabled';
const CAPTION_MODE_KEY = 'khali.caption-mode';
const WEIGHTS_KEY = 'khali.category-weights';

export async function getString(key: string) {
  return AsyncStorage.getItem(key);
}

export async function setString(key: string, value: string) {
  await AsyncStorage.setItem(key, value);
}

export async function setBoolean(key: string, value: boolean) {
  await AsyncStorage.setItem(key, value ? 'true' : 'false');
}

export async function getBoolean(key: string, fallback = false) {
  const value = await AsyncStorage.getItem(key);
  if (value == null) {
    return fallback;
  }

  return value === 'true';
}

export async function getGuestId() {
  let guestId = await getString(GUEST_ID_KEY);
  if (!guestId) {
    guestId = `guest-${Math.random().toString(36).slice(2, 10)}`;
    await setString(GUEST_ID_KEY, guestId);
  }

  return guestId;
}

export function setGuestAllowed(value: boolean) {
  return setBoolean(GUEST_ALLOWED_KEY, value);
}

export function getGuestAllowed() {
  return getBoolean(GUEST_ALLOWED_KEY, false);
}

export function setOnboardingSeen(value: boolean) {
  return setBoolean(ONBOARDING_KEY, value);
}

export function getOnboardingSeen() {
  return getBoolean(ONBOARDING_KEY, false);
}

export function setAudioEnabled(value: boolean) {
  return setBoolean(AUDIO_KEY, value);
}

export function getAudioEnabled() {
  return getBoolean(AUDIO_KEY, true);
}

export async function setCaptionMode(value: CaptionMode) {
  await setString(CAPTION_MODE_KEY, value);
}

export async function getCaptionMode() {
  return (await getString(CAPTION_MODE_KEY)) as CaptionMode | null;
}

export async function setWeights(weights: CategoryWeights) {
  await AsyncStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights));
}

export async function getWeights() {
  const raw = await AsyncStorage.getItem(WEIGHTS_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CategoryWeights;
  } catch {
    return null;
  }
}
