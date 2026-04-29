import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { completeAuthSession } from '@/lib/api';
import { khaliColors, khaliFonts, rgba } from '@/theme/khali';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width > 600;

  useEffect(() => {
    let active = true;

    const finishAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          await completeAuthSession(window.location.href);
        }
        if (active) {
          router.replace('/');
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : 'Could not complete sign-in.');
        }
      }
    };

    void finishAuth();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <SafeAreaView style={[styles.root, isWide && styles.rootWide]}>
      <View style={styles.card}>
        {errorMessage ? (
          <>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>✕</Text>
            </View>
            <Text style={styles.title}>Sign-in Failed</Text>
            <Text style={styles.body}>{errorMessage}</Text>
          </>
        ) : (
          <>
            <ActivityIndicator color={khaliColors.accent} size="large" />
            <Text style={styles.title}>Completing Sign-in</Text>
            <Text style={styles.body}>Handing your session back to Khali…</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: khaliColors.deep,
    padding: 20,
  },
  rootWide: {
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 4,
    padding: 28,
    alignItems: 'center',
    gap: 14,
    backgroundColor: rgba('#FFFFFF', 0.06),
    borderWidth: 1,
    borderColor: rgba('#FFFFFF', 0.08),
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: rgba(khaliColors.danger, 0.3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    color: '#FF8A80',
    fontSize: 20,
    fontWeight: '700',
  },
  title: {
    color: khaliColors.text,
    fontSize: 22,
    fontFamily: khaliFonts.bold,
    fontWeight: '700',
  },
  body: {
    color: rgba('#FFFFFF', 0.65),
    fontFamily: khaliFonts.regular,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 15,
  },
});
