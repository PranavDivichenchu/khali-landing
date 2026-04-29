import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  CATEGORY_OPTIONS,
  type CaptionMode,
  type CategoryWeights,
  type Viewer,
} from '@/types/news';
import { khaliColors, khaliDisplayFonts, khaliFonts, rgba } from '@/theme/khali';

type Props = {
  visible: boolean;
  viewer: Viewer;
  weights: CategoryWeights;
  audioEnabled: boolean;
  captionMode: CaptionMode;
  onDismiss: () => void;
  onSave: () => void;
  onSignOut: () => void;
  onWeightChange: (category: string, value: 0 | 1 | 2 | 3) => void;
  onAudioChange: (value: boolean) => void;
  onCaptionModeChange: (mode: CaptionMode) => void;
};

const WEIGHT_LABELS = ['Off', 'Low', 'Med', 'High'] as const;
const CAPTION_MODES: CaptionMode[] = ['Messages', 'Subtitles', 'Off'];

const TOPIC_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  politics: 'flag',
  technology: 'cpu-64-bit',
  business: 'chart-line',
  sports: 'run',
  entertainment: 'popcorn',
  science: 'flask',
  health: 'heart-pulse',
};

const WEIGHT_COLORS = {
  0: '#4A4A4C',
  1: '#8A8A8E',
  2: '#A1A1A6',
  3: '#34C759', // Green for High
};

export function SettingsModal({
  visible,
  viewer,
  weights,
  audioEnabled,
  captionMode,
  onDismiss,
  onSave,
  onSignOut,
  onWeightChange,
  onAudioChange,
  onCaptionModeChange,
}: Props) {
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width > 720;

  return (
    <Modal animationType="slide" presentationStyle="fullScreen" visible={visible}>
      <View style={styles.root}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onDismiss} style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
            <Text style={styles.headerCancelText}>Cancel</Text>
          </Pressable>
          <Pressable onPress={onSave} style={({ pressed }) => [styles.headerSaveBtn, pressed && styles.pressed]}>
            <Text style={styles.headerSaveText}>Update Feed</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, isWide && styles.contentWide]}
          showsVerticalScrollIndicator={false}
        >
          {/* User Block */}
          <View style={styles.cardBlock}>
            <Text style={styles.cardTitle}>User</Text>
            <Text style={styles.cardBody}>
              {viewer.email || (viewer.isGuest ? 'Guest User' : 'Unknown User')}
            </Text>
            <Pressable 
               style={styles.signOutBtn}
               onPress={() => {
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  onSignOut();
               }}
            >
               <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </View>

          {/* Focus Your Feed Header */}
          <View style={styles.headerBlock}>
            <Text style={styles.mainHeadline}>Focus Your Feed</Text>
            <Text style={styles.mainSubhead}>
              Adjust weights to prioritize topics. Individual topics can be fine-tuned via the dropdown.
            </Text>
          </View>

          {/* Audio & Captions Card */}
          <View style={styles.cardBlock}>
            <Text style={styles.cardHeadline}>Audio & Captions</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingTitle}>Voiceover narrates each story</Text>
                <Text style={styles.settingDesc}>Turn off to keep things silent by default.</Text>
              </View>
              <Switch
                value={audioEnabled}
                onValueChange={onAudioChange}
                trackColor={{ false: '#3A3A3C', true: '#3A6DED' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRowCol}>
               <Text style={styles.settingTitle}>Caption Style</Text>
               <Text style={styles.settingDesc}>Choose how captions appear.</Text>
               
               <View style={styles.segmentControl}>
                  {CAPTION_MODES.map((mode) => {
                     const isActive = captionMode === mode;
                     return (
                        <Pressable
                           key={mode}
                           onPress={() => {
                              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              onCaptionModeChange(mode);
                           }}
                           style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
                        >
                           <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{mode}</Text>
                        </Pressable>
                     );
                  })}
               </View>
            </View>
          </View>

          {/* Topic Weights */}
          <View style={styles.topicsContainer}>
            {CATEGORY_OPTIONS.map((category) => {
               const weight = weights[category] ?? 1;
               const weightLabel = WEIGHT_LABELS[weight].toUpperCase();
               const iconName = TOPIC_ICONS[category.toLowerCase()] || 'shape';
               const iconColor = weight === 0 ? '#4A4A4C' : '#3A6DED';
               
               return (
                  <View key={category} style={styles.topicCard}>
                     <View style={styles.topicLeft}>
                        <MaterialCommunityIcons name={iconName} size={24} color={iconColor} style={styles.topicIcon} />
                        <View>
                           <Text style={styles.topicName}>{category}</Text>
                           <Text style={[styles.topicWeightLabel, {color: weight === 3 ? '#34C759' : '#8A8A8E'}]}>{weightLabel}</Text>
                        </View>
                     </View>
                     
                     <View style={styles.topicRight}>
                        <View style={styles.customSlider}>
                           <View style={styles.sliderTrack} />
                           {[0, 1, 2, 3].map((val) => (
                              <Pressable 
                                 key={val} 
                                 style={styles.sliderDotHitbox}
                                 onPress={() => {
                                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    onWeightChange(category, val as 0|1|2|3);
                                 }}
                              >
                                 <View style={[
                                    styles.sliderDot, 
                                    weight === val && styles.sliderDotActive,
                                    weight === val && weight === 3 && { borderColor: '#3A6DED' } // Extra blue border for High
                                 ]} />
                              </Pressable>
                           ))}
                        </View>
                        <MaterialCommunityIcons name="chevron-down" size={24} color="#8A8A8E" />
                     </View>
                  </View>
               );
            })}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
  },
  pressed: {
    opacity: 0.7,
  },
  headerBtn: {
    padding: 8,
  },
  headerCancelText: {
    color: '#8A8A8E',
    fontSize: 17,
    fontFamily: khaliFonts.medium,
    fontWeight: '500',
  },
  headerSaveBtn: {
    backgroundColor: '#3A6DED',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  headerSaveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: khaliFonts.bold,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
    gap: 20,
  },
  contentWide: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  cardBlock: {
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: khaliFonts.bold,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardBody: {
    color: '#8A8A8E',
    fontSize: 15,
    fontFamily: khaliFonts.regular,
    fontWeight: '400',
  },
  signOutBtn: {
     marginTop: 16,
     backgroundColor: 'rgba(255, 59, 48, 0.1)',
     alignSelf: 'flex-start',
     paddingHorizontal: 16,
     paddingVertical: 8,
     borderRadius: 8,
  },
  signOutText: {
     color: '#FF3B30',
     fontSize: 14,
     fontFamily: khaliFonts.bold,
  },
  headerBlock: {
    marginTop: 12,
    marginBottom: 4,
    gap: 8,
  },
  mainHeadline: {
    color: '#FFFFFF',
    fontSize: 34,
    fontFamily: khaliDisplayFonts.black,
    fontWeight: '900',
  },
  mainSubhead: {
    color: '#8A8A8E',
    fontSize: 15,
    lineHeight: 20,
    fontFamily: khaliFonts.medium,
    fontWeight: '500',
  },
  cardHeadline: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: khaliFonts.bold,
    fontWeight: '700',
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingRowCol: {
     flexDirection: 'column',
     gap: 16,
  },
  settingTextCol: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: khaliFonts.medium,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDesc: {
    color: '#8A8A8E',
    fontSize: 13,
    fontFamily: khaliFonts.regular,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: '#3A3A3C',
    marginVertical: 16,
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: '#3A3A3C',
    borderRadius: 24,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#3A6DED',
  },
  segmentText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: khaliFonts.medium,
    fontWeight: '500',
  },
  segmentTextActive: {
    fontFamily: khaliFonts.bold,
    fontWeight: '700',
  },
  topicsContainer: {
    gap: 12,
  },
  topicCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topicLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  topicIcon: {
    opacity: 0.9,
  },
  topicName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: khaliFonts.bold,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  topicWeightLabel: {
    fontSize: 12,
    fontFamily: khaliFonts.bold,
    fontWeight: '700',
    letterSpacing: 1,
  },
  topicRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customSlider: {
     width: 100,
     height: 24,
     position: 'relative',
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     paddingHorizontal: 6,
  },
  sliderTrack: {
     position: 'absolute',
     left: 6, right: 6,
     height: 4,
     backgroundColor: '#3A3A3C',
     borderRadius: 2,
  },
  sliderDotHitbox: {
     width: 24,
     height: 24,
     justifyContent: 'center',
     alignItems: 'center',
  },
  sliderDot: {
     width: 6,
     height: 6,
     borderRadius: 3,
     backgroundColor: '#8A8A8E',
  },
  sliderDotActive: {
     width: 18,
     height: 18,
     borderRadius: 9,
     backgroundColor: '#FFFFFF',
     borderWidth: 4,
     borderColor: '#3A3A3C',
  },
  bottomSpacer: {
    height: 40,
  },
});
