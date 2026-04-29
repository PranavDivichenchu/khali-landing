import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeedCard } from '@/components/feed-card';
import { LoginGate } from '@/components/login-gate';
import { SettingsModal } from '@/components/settings-modal';
import {
  askQuestion,
  fetchFeedPage,
  fetchLearnedWeights,
  fetchRecommendations,
  recordVote,
  savePreferences,
  signInWithApple,
  signInWithGoogle,
} from '@/lib/api';
import { supabase } from '@/lib/supabase';
import {
  getAudioEnabled,
  getCaptionMode,
  getGuestAllowed,
  getGuestId,
  getOnboardingSeen,
  getWeights,
  setAudioEnabled,
  setCaptionMode,
  setGuestAllowed,
  setOnboardingSeen,
  setWeights,
} from '@/lib/storage';
import {
  CATEGORY_OPTIONS,
  type CaptionMode,
  type CategoryWeights,
  type NewsItem,
  type Viewer,
} from '@/types/news';
import { khaliColors, khaliDisplayFonts, khaliFonts, rgba } from '@/theme/khali';

function defaultWeights(): CategoryWeights {
  return Object.fromEntries(CATEGORY_OPTIONS.map((category) => [category, 2])) as CategoryWeights;
}

function defaultCaptionMode(): CaptionMode {
  return Platform.OS === 'web' ? 'Subtitles' : 'Messages';
}

function mapSessionToViewer(session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']): Viewer | null {
  if (!session?.user) {
    return null;
  }

  const metadata = session.user.user_metadata ?? {};

  return {
    id: session.user.id,
    email: session.user.email,
    name:
      (typeof metadata.full_name === 'string' && metadata.full_name) ||
      (typeof metadata.name === 'string' && metadata.name) ||
      null,
    isGuest: false,
  };
}

function EmptyPulse() {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.9,
          duration: 1700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 1700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [pulse]);

  return (
    <Animated.View style={[styles.emptyIcon, { opacity: pulse }]}>
      <View style={styles.emptyIconCore} />
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { height, width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width > 960;
  const isCompact = width < 720;
  const listRef = useRef<FlatList<NewsItem>>(null);
  const [booting, setBooting] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [audioEnabled, setAudioEnabledState] = useState(true);
  const [captionMode, setCaptionModeState] = useState<CaptionMode>(defaultCaptionMode());
  const [weights, setWeightsState] = useState<CategoryWeights>(defaultWeights());
  const [feed, setFeed] = useState<NewsItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const currentItem = feed[activeIndex];

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const [
          sessionResult,
          guestAllowed,
          guestId,
          onboardingSeen,
          storedAudioEnabled,
          storedCaptionMode,
          storedWeights,
        ] = await Promise.all([
          supabase.auth.getSession(),
          getGuestAllowed(),
          getGuestId(),
          getOnboardingSeen(),
          getAudioEnabled(),
          getCaptionMode(),
          getWeights(),
        ]);

        if (!mounted) {
          return;
        }

        const sessionViewer = mapSessionToViewer(sessionResult.data.session);
        setViewer(
          sessionViewer ||
            (guestAllowed
              ? {
                  id: guestId,
                  name: 'Guest',
                  email: null,
                  isGuest: true,
                }
              : null),
        );
        setShowOnboarding(!onboardingSeen && (!!sessionViewer || guestAllowed));
        setAudioEnabledState(storedAudioEnabled);
        setCaptionModeState(storedCaptionMode ?? defaultCaptionMode());
        setWeightsState(storedWeights ?? defaultWeights());
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to bootstrap app.');
      } finally {
        if (mounted) {
          setBooting(false);
        }
      }
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionViewer = mapSessionToViewer(session);
      setViewer((current) => sessionViewer ?? (current?.isGuest ? current : null));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!viewer) {
      return;
    }

    let active = true;
    const syncWeights = async () => {
      try {
        const remoteWeights = await fetchLearnedWeights(viewer.id);
        if (!active) {
          return;
        }

        const merged = { ...defaultWeights(), ...remoteWeights };
        setWeightsState(merged);
        await setWeights(merged);
      } catch {
        // Local storage fallback is already loaded.
      }
    };

    void syncWeights();

    return () => {
      active = false;
    };
  }, [viewer]);

  const refreshFeed = useCallback(
    async (reset = false) => {
      if (!viewer) {
        return;
      }

      const startOffset = reset ? 0 : offset;
      if (reset) {
        setRefreshing(true);
      } else {
        setLoadingFeed(true);
      }
      setErrorMessage(null);

      try {
        let nextItems: NewsItem[] = [];
        if (reset) {
          const recommended = await fetchRecommendations(viewer.id, 30).catch(() => []);
          if (recommended.length) {
            nextItems = recommended;
          } else {
            nextItems = await fetchFeedPage({
              offset: 0,
              limit: 20,
              weights,
            });
          }
        } else {
          nextItems = await fetchFeedPage({
            offset: startOffset,
            limit: 20,
            weights,
          });
        }

        const deduped = nextItems.filter(
          (item, index, array) => array.findIndex((entry) => entry.id === item.id) === index,
        );

        if (reset) {
          setFeed(deduped);
          setOffset(deduped.length);
          setHasMore(deduped.length >= 20);
          setActiveIndex(0);
          listRef.current?.scrollToOffset({ offset: 0, animated: false });
        } else {
          setFeed((current) => {
            const seen = new Set(current.map((entry) => entry.id));
            const merged = [...current, ...deduped.filter((entry) => !seen.has(entry.id))];
            setOffset(merged.length);
            return merged;
          });
          setHasMore(deduped.length >= 20);
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load feed.');
      } finally {
        setRefreshing(false);
        setLoadingFeed(false);
      }
    },
    [offset, viewer, weights],
  );

  const advanceToNextReel = useCallback(
    async (currentIndex: number) => {
      const nextIndex = currentIndex + 1;

      if (nextIndex < feed.length) {
        listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        setActiveIndex(nextIndex);
        return;
      }

      if (hasMore && !loadingFeed) {
        await refreshFeed(false);
      }
    },
    [feed.length, hasMore, loadingFeed, refreshFeed],
  );

  useEffect(() => {
    if (!viewer) {
      return;
    }

    void refreshFeed(true);
  }, [refreshFeed, viewer]);

  const handleContinueGuest = async () => {
    const guestId = await getGuestId();
    await setGuestAllowed(true);
    setViewer({
      id: guestId,
      name: 'Guest',
      email: null,
      isGuest: true,
    });
    setShowOnboarding(true);
  };

  const handleAppleContinue = async () => {
    setAuthBusy(true);
    setErrorMessage(null);
    try {
      await signInWithApple();
      await setGuestAllowed(false);
      const sessionResult = await supabase.auth.getSession();
      const sessionViewer = mapSessionToViewer(sessionResult.data.session);
      if (sessionViewer) {
        setViewer(sessionViewer);
        setShowOnboarding(true);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Apple sign-in failed.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleGoogleContinue = async () => {
    setAuthBusy(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
      await setGuestAllowed(false);
      const sessionResult = await supabase.auth.getSession();
      const sessionViewer = mapSessionToViewer(sessionResult.data.session);
      if (sessionViewer) {
        setViewer(sessionViewer);
        setShowOnboarding(true);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Google sign-in failed.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleVote = async (
    item: NewsItem,
    direction: 'agree' | 'disagree',
    index: number,
  ) => {
    if (!viewer) {
      return;
    }

    setFeed((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              agreeCount: entry.agreeCount + (direction === 'agree' ? 1 : 0),
              disagreeCount: entry.disagreeCount + (direction === 'disagree' ? 1 : 0),
            }
          : entry,
      ),
    );
    await advanceToNextReel(index);

    void recordVote(viewer.id, item.id, direction)
      .then((stats) => {
        setFeed((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  agreeCount: stats.stats?.agreeCount ?? entry.agreeCount,
                  disagreeCount: stats.stats?.disagreeCount ?? entry.disagreeCount,
                }
              : entry,
          ),
        );
      })
      .catch(() => {
        // Keep optimistic counts if the write fails.
      });
  };

  const handleAskQuestion = async (item: NewsItem, question: string) => {
    if (!viewer) {
      return 'Sign in or continue as guest to ask a question.';
    }

    try {
      return await askQuestion(viewer.id, item, question);
    } catch {
      const fallbackParts = [
        'Quick insight:',
        item.summary[0] ?? item.title,
        item.summary[1] ?? '',
        item.claims[0] ? `Key debate: ${item.claims[0]}` : '',
      ];

      return fallbackParts.filter(Boolean).join(' ');
    }
  };

  const handleSaveSettings = async () => {
    if (!viewer) {
      return;
    }

    await Promise.all([
      setWeights(weights),
      setAudioEnabled(audioEnabled),
      setCaptionMode(captionMode),
    ]);

    try {
      await savePreferences(viewer.id, weights);
    } catch {
      // Server unreachable. Local preferences remain applied.
    }

    setSettingsVisible(false);
    void refreshFeed(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    await setGuestAllowed(false);
    setViewer(null);
    setFeed([]);
    setOffset(0);
    setSettingsVisible(false);
  };

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      const index = viewableItems[0]?.index ?? 0;
      setActiveIndex(index);
    },
  ).current;

  if (booting) {
    return (
      <View style={styles.shell}>
        <SafeAreaView style={styles.loadingShell}>
          <StatusBar style="light" />
          <ActivityIndicator color={khaliColors.highlight} size="large" />
        </SafeAreaView>
      </View>
    );
  }

  if (!viewer) {
    return (
      <View style={styles.shell}>
        <View style={styles.root}>
          <StatusBar style="light" />
          
          <LoginGate
            busy={authBusy}
            onAppleContinue={() => void handleAppleContinue()}
            onGuestContinue={() => void handleContinueGuest()}
            onGoogleContinue={() => void handleGoogleContinue()}
          />
          {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      <View style={styles.root}>
        <StatusBar style="light" />

        {feed.length ? (
          <FlatList
            ref={listRef}
            data={feed}
            getItemLayout={(_, index) => ({
              index,
              length: height,
              offset: height * index,
            })}
            keyExtractor={(item) => item.id}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            windowSize={5}
            removeClippedSubviews={Platform.OS === 'android' || Platform.OS === 'ios'}
            onEndReached={() => {
              if (!loadingFeed && hasMore) {
                void refreshFeed(false);
              }
            }}
            onEndReachedThreshold={0.5}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            pagingEnabled
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                tintColor={khaliColors.highlight}
                onRefresh={() => void refreshFeed(true)}
              />
            }
            renderItem={({ item, index }) => (
              <FeedCard
                active={index === activeIndex}
                audioEnabled={audioEnabled}
                captionMode={captionMode}
                height={height}
                item={item}
                onAskQuestion={handleAskQuestion}
                onOpenSettings={() => setSettingsVisible(true)}
                onVote={(votedItem, direction) => handleVote(votedItem, direction, index)}
              />
            )}
            showsVerticalScrollIndicator={false}
            snapToAlignment="start"
            snapToInterval={height}
            decelerationRate="fast"
            style={styles.feedList}
          />
        ) : (
          <View style={styles.emptyState}>
            {loadingFeed ? (
              <ActivityIndicator color={khaliColors.highlight} size="large" />
            ) : (
              <>
                <EmptyPulse />
                <Text style={styles.emptyTitle}>Your reel is warming up</Text>
                <Text style={styles.emptyBody}>
                  We&apos;re pulling fresh stories and source clusters now. Pull down to refresh or
                  tune your interests to reshape the stream.
                </Text>
                <Pressable
                  onPress={() => void refreshFeed(true)}
                  style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]}>
                  <Text style={styles.emptyButtonText}>Refresh feed</Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}

        <SettingsModal
          audioEnabled={audioEnabled}
          captionMode={captionMode}
          onAudioChange={(value) => setAudioEnabledState(value)}
          onCaptionModeChange={(mode) => setCaptionModeState(mode)}
          onDismiss={() => setSettingsVisible(false)}
          onSave={() => void handleSaveSettings()}
          onSignOut={() => void handleSignOut()}
          onWeightChange={(category, value) =>
            setWeightsState((current) => ({
              ...current,
              [category]: value,
            }))
          }
          viewer={viewer}
          visible={settingsVisible}
          weights={weights}
        />


      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: khaliColors.deep,
  },
  root: {
    flex: 1,
    width: '100%',
    backgroundColor: khaliColors.deep,
  },
  loadingShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: khaliColors.deep,
  },
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
    pointerEvents: 'box-none',
  },
  chrome: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  chromeWide: {
    left: '50%',
    right: 'auto',
    width: 720,
    marginLeft: -360,
  },
  chromeBrand: {
    gap: 2,
  },
  brandWordmark: {
    color: khaliColors.text,
    fontSize: 34,
    lineHeight: 34,
    fontFamily: khaliDisplayFonts.bold,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  brandWordmarkCompact: {
    fontSize: 28,
    lineHeight: 30,
  },
  brandSubhead: {
    color: khaliColors.textMuted,
    fontSize: 11,
    fontFamily: khaliFonts.medium,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  chromeCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: rgba('#081425', 0.74),
    borderWidth: 1,
    borderColor: rgba('#FFFFFF', 0.08),
  },
  chromeCenterPrimary: {
    color: khaliColors.text,
    fontSize: 13,
    fontFamily: khaliFonts.bold,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  chromeCenterSecondary: {
    color: khaliColors.textMuted,
    fontSize: 12,
    fontFamily: khaliFonts.medium,
    fontWeight: '500',
  },
  chromeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: rgba('#081425', 0.74),
    borderWidth: 1,
    borderColor: rgba('#FFFFFF', 0.08),
  },
  chromeButtonCompact: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chromeButtonPressed: {
    opacity: 0.84,
  },
  chromeButtonText: {
    color: khaliColors.text,
    fontSize: 13,
    fontFamily: khaliFonts.bold,
    fontWeight: '700',
  },
  feedList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    gap: 16,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rgba(khaliColors.highlight, 0.12),
    borderWidth: 1,
    borderColor: rgba(khaliColors.highlight, 0.2),
  },
  emptyIconCore: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: khaliColors.highlight,
    shadowColor: rgba(khaliColors.highlight, 0.8),
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 22,
  },
  emptyTitle: {
    color: khaliColors.text,
    fontSize: 30,
    textAlign: 'center',
    fontFamily: khaliDisplayFonts.bold,
    fontWeight: '700',
  },
  emptyBody: {
    color: khaliColors.textMuted,
    fontSize: 15,
    fontFamily: khaliFonts.medium,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: 380,
  },
  emptyButton: {
    marginTop: 6,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: khaliColors.highlight,
  },
  emptyButtonPressed: {
    opacity: 0.86,
  },
  emptyButtonText: {
    color: khaliColors.deep,
    fontSize: 15,
    fontFamily: khaliFonts.black,
    fontWeight: '900',
  },
  errorBanner: {
    position: 'absolute',
    bottom: 18,
    left: 18,
    right: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: rgba(khaliColors.danger, 0.94),
    color: '#FFF4F1',
    fontFamily: khaliFonts.medium,
    fontWeight: '500',
    textAlign: 'center',
    zIndex: 10,
    overflow: 'hidden',
  },
});
