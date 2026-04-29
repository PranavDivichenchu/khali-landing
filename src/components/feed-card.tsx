import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Linking,
  PanResponder,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { CaptionStack } from '@/components/caption-stack';
import { khaliFonts, rgba } from '@/theme/khali';
import type { CaptionMode, NewsItem } from '@/types/news';

type VoteDirection = 'agree' | 'disagree';

type Props = {
  item: NewsItem;
  active: boolean;
  height: number;
  audioEnabled: boolean;
  captionMode: CaptionMode;
  onVote: (item: NewsItem, direction: VoteDirection) => Promise<void>;
  onOpenSettings: () => void;
  onAskQuestion: (item: NewsItem, question: string) => Promise<string>;
};

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
  return `${Math.floor(diffSeconds / 604800)}mo ago`;
}

function sourceCode(name: string, articleURL?: string | null) {
  if (articleURL) {
    try {
      const host = new URL(articleURL).host.replace(/^www\./, '');
      const primary = host.split('.')[0] ?? '';
      const letters = primary.replace(/[^a-z]/gi, '');
      if (letters) return letters.slice(0, 3).toUpperCase();
    } catch {
      // Ignore
    }
  }
  const letters = name.replace(/[^a-z0-9]/gi, '');
  return (letters || name).slice(0, 3).toUpperCase() || 'CNE';
}

function faviconUrl(articleURL?: string | null) {
  if (!articleURL) return null;
  const encoded = encodeURIComponent(articleURL);
  return `https://www.google.com/s2/favicons?sz=64&domain_url=${encoded}`;
}

export function FeedCard({
  item,
  active,
  height,
  audioEnabled,
  captionMode,
  onVote,
  onOpenSettings,
  onAskQuestion,
}: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 960;
  const isTablet = width >= 720;
  const isCompact = width < 420 || height < 760;
  
  const translateX = useRef(new Animated.Value(0)).current;
  
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<{id: string; text: string; isUser: boolean}[]>([]);
  const [asking, setAsking] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [claimRevealed, setClaimRevealed] = useState(false);
  
  const itemRef = useRef(item);
  const onVoteRef = useRef(onVote);

  const player = useVideoPlayer(item.clipUrl ?? null, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  itemRef.current = item;
  onVoteRef.current = onVote;

  useEffect(() => {
    if (!item.clipUrl) return;

    if (active) {
      player.play();
    } else {
      player.pause();
      setCurrentTime(0);
    }
  }, [active, item.clipUrl, player]);

  useEffect(() => {
    if (!active || !item.clipUrl) return;

    const id = setInterval(() => {
      setCurrentTime(player.currentTime ?? 0);
    }, 250);

    return () => clearInterval(id);
  }, [active, item.clipUrl, player]);

  const displayClaim = item.sampleQuestion || 'Should Mars resources be owned by the companies that find them?';

  const animateVote = (direction: VoteDirection) => {
    if (isVoting) return;

    setIsVoting(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const offscreenX = direction === 'agree' ? 260 : -260;
    void onVoteRef.current(itemRef.current, direction);

    Animated.timing(translateX, {
      toValue: offscreenX,
      duration: 180,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start(() => {
      translateX.setValue(0);
      setIsVoting(false);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        !isVoting && Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dy) < 18,
      onPanResponderMove: (_, gestureState) => {
        if (isVoting) return;
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isVoting) return;

        if (gestureState.dx > 120) {
          animateVote('agree');
          return;
        }

        if (gestureState.dx < -120) {
          animateVote('disagree');
          return;
        }

        Animated.spring(translateX, {
          toValue: 0,
          damping: 18,
          stiffness: 220,
          mass: 0.8,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  const swipeRightOpacity = translateX.interpolate({
    inputRange: [0, 120],
    outputRange: [0, 0.9],
    extrapolate: 'clamp',
  });

  const swipeLeftOpacity = translateX.interpolate({
    inputRange: [-120, 0],
    outputRange: [0.9, 0],
    extrapolate: 'clamp',
  });

  const handleShare = async () => {
    const url = item.articleURL || item.clipUrl || '';
    try {
      await Share.share({
        message: `${item.title}${url ? `\n${url}` : ''}`,
      });
    } catch {
      if (url) {
        await Linking.openURL(url);
      }
    }
  };

  const handleAsk = async () => {
    if (!question.trim() || asking) return;

    const userMsg = { id: `u-${Date.now()}`, text: question.trim(), isUser: true };
    setChatHistory(prev => [...prev, userMsg]);
    setAsking(true);
    setQuestion('');

    try {
      const response = await onAskQuestion(item, userMsg.text);
      setChatHistory(prev => [...prev, { id: `ai-${Date.now()}`, text: response, isUser: false }]);
    } catch {
      setChatHistory(prev => [...prev, { id: `ai-${Date.now()}`, text: 'Sorry, I could not generate an insight right now.', isUser: false }]);
    } finally {
      setAsking(false);
    }
  };

  return (
    <View style={[styles.frame, { height }]}>
      <Animated.View
        style={[
          styles.reelShell,
          isDesktop && styles.reelShellDesktop,
          isTablet && !isDesktop && styles.reelShellTablet,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}>
        {/* Media Background */}
        <View style={StyleSheet.absoluteFill}>
          {item.clipUrl ? (
             <VideoView
              allowsPictureInPicture={false}
              contentFit="cover"
              nativeControls={false}
              player={player}
              style={StyleSheet.absoluteFill}
            />
          ) : item.imageURL ? (
            <Image source={item.imageURL} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <LinearGradient
              colors={['#1c1c1c', '#000000']}
              style={StyleSheet.absoluteFill}
            />
          )}

          {/* Scrim Bottom */}
          <LinearGradient
            colors={[
              'transparent',
              'rgba(0,0,0,0.5)',
              'rgba(0,0,0,0.95)'
            ]}
            locations={[0, 0.4, 1]}
            style={styles.scrimBottom}
          />
        </View>

        {/* Top Center Category Pill */}
        <View style={styles.topBar}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{item.topic || item.category || 'technology'}</Text>
          </View>
        </View>

        {/* Flex Layout to prevent overlapping */}
        <View style={styles.flexContainer} pointerEvents="box-none">
          
          <View style={styles.captionContainer} pointerEvents="box-none">
            <CaptionStack
              captions={item.captionData}
              currentTime={currentTime}
              mode={captionMode}
              visible={active && audioEnabled}
              extraMessages={chatHistory}
              asking={asking}
            />
          </View>

          {/* Bottom Info Section */}
          <View style={styles.mainContent} pointerEvents="box-none">
            
            {/* Tags Row */}
            <View style={styles.tagsRow}>
               <View style={styles.timeTag}>
                 <Text style={styles.timeTagText}>{formatTimeAgo(item.date)}</Text>
               </View>
               <View style={styles.sourceTag}>
                 <View style={styles.sourceIconWrap}>
                   {faviconUrl(item.articleURL) && <Image source={faviconUrl(item.articleURL)} style={styles.sourceIcon} contentFit="cover" />}
                 </View>
                 <Text style={styles.sourceTagText}>{sourceCode(item.sourceAPI || 'CNE', item.articleURL)}</Text>
               </View>
            </View>

            {/* Headline and Right Actions */}
            <View style={styles.headlineRow}>
               <Text style={[styles.headline, isCompact && styles.headlineCompact]} numberOfLines={3}>
                 {item.title}
               </Text>
               
               <View style={styles.actionsColumn}>
                 <Pressable style={styles.actionBtn} onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); void handleShare(); }}>
                    <Ionicons name="share-outline" size={26} color="#FFFFFF" />
                 </Pressable>
                 <Pressable style={styles.actionBtn} onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onOpenSettings(); }}>
                    <Ionicons name="options-outline" size={26} color="#FFFFFF" />
                 </Pressable>
               </View>
            </View>

            {/* More Info */}
            <View style={styles.moreInfoRow}>
               <View style={styles.infoIconBox}>
                 <Text style={styles.infoIconText}>i</Text>
               </View>
               <Text style={styles.moreInfoText}>More Info</Text>
            </View>

            {/* Reveal Claim Button */}
            <Pressable 
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setClaimRevealed(!claimRevealed);
              }} 
              style={styles.revealClaimBtn}
            >
               <LinearGradient 
                  colors={['#4E4E50', '#2C2C2E']} 
                  style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} 
               />
               <View style={styles.revealClaimContent}>
                  {claimRevealed ? null : <MaterialCommunityIcons name="gesture-tap" size={24} color="#FFFFFF" />}
                  <Text style={styles.revealClaimText}>{claimRevealed ? displayClaim : 'Reveal Claim'}</Text>
               </View>
            </Pressable>

            {/* Ask Question Input */}
            <View style={styles.askInputContainer}>
               <TextInput
                 style={styles.askInput}
                 placeholder="Have a question about this story?"
                 placeholderTextColor="rgba(255, 255, 255, 0.4)"
                 value={question}
                 onChangeText={setQuestion}
                 onSubmitEditing={handleAsk}
                 readOnly={asking}
                 returnKeyType="send"
               />
            </View>
          </View>

        </View>

        {/* Vote Overlay Affordances */}
        <Animated.View style={[styles.voteAffordanceLeft, { opacity: swipeLeftOpacity }]} pointerEvents="none">
          <View style={[styles.voteAffordancePill, styles.voteAffordancePillLeft]}>
            <Text style={styles.voteAffordanceText}>NO</Text>
          </View>
        </Animated.View>
        <Animated.View style={[styles.voteAffordanceRight, { opacity: swipeRightOpacity }]} pointerEvents="none">
          <View style={[styles.voteAffordancePill, styles.voteAffordancePillRight]}>
            <Text style={[styles.voteAffordanceText, styles.voteAffordanceTextDark]}>YES</Text>
          </View>
        </Animated.View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  reelShell: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
  },
  reelShellDesktop: {
    maxWidth: 500,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    marginVertical: 10,
    borderRadius: 24,
  },
  reelShellTablet: {
    maxWidth: 560,
  },
  scrimBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '50%',
  },
  topBar: {
    position: 'absolute',
    top: 50, // Safe area approx
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  categoryPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: khaliFonts.bold,
    fontWeight: '700',
  },
  flexContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    zIndex: 20,
    paddingBottom: 24,
    paddingTop: 100, // Avoid top bar
  },
  captionContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  mainContent: {
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  timeTag: {
    backgroundColor: '#D9602C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    justifyContent: 'center',
  },
  timeTagText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: khaliFonts.bold,
    fontWeight: '700',
  },
  sourceTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  sourceIconWrap: {
    width: 14,
    height: 14,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceIcon: {
    width: 14,
    height: 14,
  },
  sourceTagText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: khaliFonts.bold,
    fontWeight: '700',
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 16,
  },
  headline: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 32,
    fontFamily: khaliFonts.bold,
    fontWeight: '700',
  },
  headlineCompact: {
    fontSize: 24,
    lineHeight: 28,
  },
  actionsColumn: {
    gap: 16,
  },
  actionBtn: {
    backgroundColor: '#3A6DED',
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  moreInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  infoIconBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#3A6DED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIconText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: khaliFonts.bold,
    fontWeight: '700',
  },
  moreInfoText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: khaliFonts.bold,
    fontWeight: '700',
  },
  revealClaimBtn: {
    width: '100%',
    height: 64,
    borderRadius: 16,
    marginBottom: 16,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  revealClaimContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
  },
  revealClaimText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: khaliFonts.bold,
    fontWeight: '700',
    textAlign: 'center',
  },
  askInputContainer: {
    width: '100%',
    height: 56,
    backgroundColor: '#242424',
    borderRadius: 999,
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  askInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: khaliFonts.regular,
    fontWeight: '400',
    textAlign: 'center',
  },
  voteAffordanceLeft: {
    position: 'absolute',
    top: '50%',
    left: 24,
    zIndex: 20,
  },
  voteAffordanceRight: {
    position: 'absolute',
    top: '50%',
    right: 24,
    zIndex: 20,
  },
  voteAffordancePill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  voteAffordancePillLeft: {
    backgroundColor: '#242424',
  },
  voteAffordancePillRight: {
    backgroundColor: '#3A6DED',
  },
  voteAffordanceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: khaliFonts.bold,
    fontWeight: '700',
  },
  voteAffordanceTextDark: {
    color: '#FFFFFF',
  },
});
