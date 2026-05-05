import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';

interface Props {
  isConnected: boolean;
  shouldShowErrorBanner: boolean;
  error: string;
  onRetry: () => void;
}

export function ChatConnectionBanner({ isConnected, shouldShowErrorBanner, error, onRetry }: Props) {
  // Animate height 0 → 44 for the disconnected banner
  const disconnectedHeight = useRef(new Animated.Value(0)).current;
  const errorHeight        = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(disconnectedHeight, {
      toValue: isConnected ? 0 : 44,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isConnected]);

  useEffect(() => {
    Animated.timing(errorHeight, {
      toValue: shouldShowErrorBanner ? 56 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [shouldShowErrorBanner]);

  return (
    <>
      <Animated.View style={[styles.disconnectedBanner, { height: disconnectedHeight, overflow: 'hidden' }]}>
        <View style={styles.bannerRow}>
          <Ionicons name="wifi-outline" size={14} color={Colors.bannerAmberText} />
          <Text style={styles.disconnectedText}>Disconnected — messages may not deliver</Text>
          <TouchableOpacity onPress={onRetry} style={styles.retryBtn} hitSlop={{top:8,bottom:8,left:8,right:8}}>
            <Text style={styles.retryAmberText}>Reconnect</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View style={[styles.errorBanner, { height: errorHeight, overflow: 'hidden' }]}>
        <View style={styles.bannerRow}>
          <Text style={[styles.errorBannerText, { flex: 1 }]} numberOfLines={1}>{error}</Text>
          <TouchableOpacity onPress={onRetry} style={styles.retryBtn} hitSlop={{top:8,bottom:8,left:8,right:8}}>
            <Text style={styles.retryRedText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  disconnectedBanner: {
    backgroundColor: Colors.bannerAmberBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bannerAmberBorder,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  errorBanner: {
    backgroundColor: Colors.bannerRedBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bannerRedBorder,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  disconnectedText: { flex: 1, fontSize: 12, fontWeight: '500', color: Colors.bannerAmberText },
  errorBannerText:  { fontSize: 12, fontWeight: '600', color: Colors.bannerRedText },
  retryBtn: {
    minHeight: 44, minWidth: 44,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 10, borderRadius: 8,
  },
  retryAmberText: { fontSize: 12, fontWeight: '700', color: Colors.bannerAmberText },
  retryRedText:   { fontSize: 12, fontWeight: '700', color: Colors.bannerRedText },
});
