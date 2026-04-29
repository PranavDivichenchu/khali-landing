import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { khaliColors, khaliDisplayFonts, khaliFonts, rgba } from '@/theme/khali';

type Props = {
  busy: boolean;
  onGuestContinue: () => void;
  onGoogleContinue: () => void;
  onAppleContinue: () => void;
};

export function LoginGate({ busy, onGuestContinue, onGoogleContinue, onAppleContinue }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.root}>
      {/* Background Gradient matching the screenshot */}
      <LinearGradient
        colors={['#100A0A', '#4A2A20', '#1A1215', '#000000']}
        locations={[0, 0.4, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
        
        {/* Center Branding */}
        <View style={styles.brandContainer}>
          <Text style={styles.wordmark}>KHALI</Text>
          <Text style={styles.subhead}>A new way to consume news.</Text>
        </View>

        {/* Bottom Actions */}
        <View style={styles.actionsContainer}>
          {Platform.OS === 'ios' && (
            <Pressable
              disabled={busy}
              onPress={onAppleContinue}
              style={({ pressed }) => [styles.appleBtn, pressed && styles.buttonPressed]}>
              <View style={styles.btnContent}>
                <View style={styles.appleBtnIconBox}>
                  {busy ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.appleIconText}></Text>
                  )}
                </View>
                <View style={styles.btnTextCol}>
                  <Text style={styles.btnTitle}>Sign in with Apple</Text>
                  <Text style={styles.btnSubtitle}>Private &amp; secure login</Text>
                </View>
              </View>
            </Pressable>
          )}

          <Pressable
            disabled={busy}
            onPress={onGoogleContinue}
            style={({ pressed }) => [styles.googleBtn, pressed && styles.buttonPressed]}>
            <LinearGradient
              colors={['#4F8AF2', '#2A5BCC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
            />
            <View style={styles.btnContent}>
               <View style={styles.btnIconBox}>
                 {busy ? (
                   <ActivityIndicator color="#4F8AF2" size="small" />
                 ) : (
                   <Text style={styles.googleIconText}>G</Text>
                 )}
               </View>
               <View style={styles.btnTextCol}>
                 <Text style={styles.btnTitle}>Continue with Google</Text>
                 <Text style={styles.btnSubtitle}>Supabase secure login</Text>
               </View>
            </View>
          </Pressable>
          
          <Pressable
            disabled={busy}
            onPress={onGuestContinue}
            style={({ pressed }) => [styles.guestBtn, pressed && styles.buttonPressed]}>
            <Text style={styles.guestBtnText}>Continue as Guest</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: '40%',
    paddingBottom: 48,
  },
  brandContainer: {
    alignItems: 'center',
    gap: 16,
  },
  wordmark: {
    color: '#FFFFFF',
    fontSize: 56,
    fontFamily: khaliFonts.black,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subhead: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    fontFamily: khaliFonts.medium,
    fontWeight: '500',
  },
  actionsContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: 16,
  },
  appleBtn: {
    width: '100%',
    minHeight: 72,
    borderRadius: 16,
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  appleBtnIconBox: {
    width: 32,
    height: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleIconText: {
    color: '#000000',
    fontSize: 20,
    lineHeight: 24,
  },
  googleBtn: {
    width: '100%',
    minHeight: 72,
    borderRadius: 16,
    justifyContent: 'center',
    shadowColor: '#4F8AF2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  btnIconBox: {
    width: 32,
    height: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    color: '#4F8AF2',
    fontSize: 20,
    fontFamily: khaliFonts.bold,
    fontWeight: '700',
  },
  btnTextCol: {
    flex: 1,
  },
  btnTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: khaliFonts.bold,
    fontWeight: '700',
  },
  btnSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontFamily: khaliFonts.medium,
    fontWeight: '500',
    marginTop: 2,
  },
  guestBtn: {
    width: '100%',
    minHeight: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  guestBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontFamily: khaliFonts.semibold,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
