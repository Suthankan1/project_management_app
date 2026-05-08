import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Colors } from '@/src/constants/colors';

interface Props {
  isConnected: boolean;
  shouldShowErrorBanner: boolean;
  error: string;
  onRetry: () => void;
}

export function ChatConnectionBanner({ isConnected, shouldShowErrorBanner, error, onRetry }: Props) {
  const height = useSharedValue(0);
  const showBanner = !isConnected || shouldShowErrorBanner;
  const isError = shouldShowErrorBanner && !isConnected;

  useEffect(() => {
    height.value = withTiming(showBanner ? 44 : 0, { duration: 200 });
  }, [showBanner]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    overflow: 'hidden',
  }));

  if (!showBanner) return null;

  return (
    <Animated.View style={animatedStyle}>
      <View style={[styles.banner, isError ? styles.errorBanner : styles.warnBanner]}>
        <View style={styles.contentRow}>
          {!isError && <Ionicons name="wifi-outline" size={14} color={Colors.bannerAmberText} />}
          <Text style={[styles.bannerText, isError ? styles.errorText : styles.warnText]} numberOfLines={1}>
            {isError ? error : 'Disconnected — reconnecting…'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onRetry}
          style={styles.retryBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.retryText, isError ? styles.errorText : styles.warnText]}>
            {isError ? 'Retry' : 'Reconnect'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    height: 44,
  },
  warnBanner: {
    backgroundColor: Colors.bannerAmberBg,
    borderBottomColor: Colors.bannerAmberBorder,
  },
  errorBanner: {
    backgroundColor: Colors.bannerRedBg,
    borderBottomColor: Colors.bannerRedBorder,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  warnText: {
    color: Colors.bannerAmberText,
  },
  errorText: {
    color: Colors.bannerRedText,
  },
  retryBtn: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
