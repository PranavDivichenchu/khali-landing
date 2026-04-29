import React, { useMemo, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

import { khaliColors, khaliFonts, rgba } from '@/theme/khali';
import type { CaptionMode, CaptionSegment } from '@/types/news';

type SentenceBubble = {
  id: string;
  start: number;
  end: number;
  segments: CaptionSegment[];
  speakerId: number;
};

type Props = {
  captions?: CaptionSegment[] | null;
  currentTime: number;
  mode: CaptionMode;
  visible: boolean;
  extraMessages?: { id: string; text: string; isUser: boolean }[];
  asking?: boolean;
};

function aggregateSentences(captions: CaptionSegment[]) {
  const merged: SentenceBubble[] = [];
  let currentSegments: CaptionSegment[] = [];
  let currentSpeaker = -1;
  let currentStart = 0;

  const flush = () => {
    if (!currentSegments.length) {
      return;
    }

    const nextBubble = {
      id: `${currentStart}`,
      start: currentStart,
      end: currentSegments[currentSegments.length - 1]?.end ?? currentStart,
      segments: currentSegments,
      speakerId: currentSpeaker,
    } satisfies SentenceBubble;

    const nextText = nextBubble.segments.map((segment) => segment.text.trim()).join(' ').trim();
    const previous = merged[merged.length - 1];
    const previousText = previous?.segments.map((segment) => segment.text.trim()).join(' ').trim();

    if (previous && previous.speakerId === nextBubble.speakerId && previousText === nextText) {
      previous.end = nextBubble.end;
    } else {
      merged.push(nextBubble);
    }

    currentSegments = [];
  };

  captions.forEach((segment) => {
    const speaker = segment.speakerId ?? -1;
    if (speaker !== currentSpeaker) {
      flush();
      currentStart = segment.start;
      currentSpeaker = speaker;
    }

    currentSegments.push(segment);
    const trimmed = segment.text.trim();
    if (/[.!?,;]$/.test(trimmed)) {
      flush();
    }
  });

  flush();
  return merged;
}

export function CaptionStack({ captions, currentTime, mode, visible, extraMessages, asking }: Props) {
  const merged = useMemo(() => aggregateSentences(captions ?? []), [captions]);
  const scrollViewRef = useRef<ScrollView>(null);

  const allMessages = useMemo(() => {
    // Keep a mapping of speaker IDs to left/right to ensure alternating colors
    // even if speaker IDs aren't exactly 0 and 1.
    const speakerMap = new Map<number, boolean>();
    let nextIsRight = true; // Start with right (blue)

    const videoSentences = merged
      .filter((sentence) => sentence.start <= currentTime + 0.2)
      .map((s) => {
        if (!speakerMap.has(s.speakerId)) {
          speakerMap.set(s.speakerId, nextIsRight);
          nextIsRight = !nextIsRight;
        }
        return {
          id: s.id,
          text: s.segments.map((seg) => seg.text).join(' '),
          isRight: speakerMap.get(s.speakerId) ?? true,
        };
      });

    const extras = (extraMessages || []).map((m) => ({
      id: m.id,
      text: m.text,
      isRight: m.isUser,
    }));

    return [...videoSentences, ...extras];
  }, [merged, currentTime, extraMessages]);

  useEffect(() => {
    if (allMessages.length > 0 || asking) {
       setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
       }, 100);
    }
  }, [allMessages.length, asking]);

  if (!visible || mode === 'Off') {
    return null;
  }

  if (mode === 'Subtitles') {
    const currentSegment = captions?.find(
      (segment) => currentTime >= segment.start && currentTime <= segment.end,
    );

    if (!currentSegment) {
      return null;
    }

    const color = '#FFFFFF';
    return (
      <View style={styles.subtitleWrap} pointerEvents="none">
        <View style={styles.subtitleBubble}>
          <Text style={[styles.subtitleText, { color }]}>{currentSegment.text}</Text>
        </View>
      </View>
    );
  }

  if (!allMessages.length && !asking) {
    return null;
  }

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.messagesWrap} 
      contentContainerStyle={styles.messagesContent}
      showsVerticalScrollIndicator={false}
      pointerEvents="box-none"
    >
      {allMessages.map((msg, index) => {
        const isRight = msg.isRight;
        const previousIsRight = allMessages[index - 1]?.isRight;
        const isNewSpeaker = previousIsRight !== isRight;
        
        // Exact screenshot colors
        const bgColor = isRight ? '#3A6DED' : '#D9602C';

        return (
          <View
            key={msg.id}
            style={[
              styles.messageRow,
              isRight ? styles.messageRowRight : styles.messageRowLeft,
              isNewSpeaker && styles.messageRowGap,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                {
                  alignSelf: isRight ? 'flex-end' : 'flex-start',
                  backgroundColor: bgColor,
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                  borderBottomRightRadius: isRight ? 4 : 12,
                  borderBottomLeftRadius: !isRight ? 4 : 12,
                },
              ]}
            >
              <Text style={styles.messageText}>{msg.text}</Text>
            </View>
          </View>
        );
      })}
      
      {asking && (
         <View style={[styles.messageRow, styles.messageRowLeft, styles.messageRowGap]}>
            <View style={[styles.messageBubble, { backgroundColor: '#D9602C', borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomRightRadius: 12, borderBottomLeftRadius: 4 }]}>
              <Text style={styles.messageText}>...</Text>
            </View>
         </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  messagesWrap: {
    flex: 1,
  },
  messagesContent: {
    justifyContent: 'flex-end',
    paddingHorizontal: 0,
    paddingBottom: 16,
    flexGrow: 1,
  },
  messageRow: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 8,
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageRowGap: {
    marginTop: 8,
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: khaliFonts.medium,
    fontWeight: '500',
    lineHeight: 22,
  },
  subtitleWrap: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  subtitleBubble: {
    borderRadius: 8,
    backgroundColor: rgba('#000000', 0.75),
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: 420,
  },
  subtitleText: {
    fontSize: 22,
    fontFamily: khaliFonts.bold,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
  },
});
