import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
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
  const isError = shouldShowErrorBanner;

  useEffect(() => {
    height.value = withTiming(showBanner ? 44 : 0, { duration: 200 });
  }, [height, showBanner]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    overflow: 'hidden',
  }));

  if (!showBanner) return null;

  const tone = isError ? 'error' : 'warning';
  const iconName = isError ? 'alert-circle-outline' : 'wifi-outline';
  const textColor = isError ? Colors.bannerRedText : Colors.bannerAmberText;
  const message = isError ? error : 'Reconnecting…';
  const actionLabel = isError ? 'Retry' : 'Reconnect';

  return (
    <Animated.View style={animatedStyle}>
      <View style={[styles.banner, tone === 'error' ? styles.errorBanner : styles.warningBanner]}>
        <View style={styles.content}>
          <Ionicons name={iconName} size={14} color={textColor} />
          <Text style={[styles.message, { color: textColor }]} numberOfLines={1}>
            {message}
          </Text>
        </View>

        <TouchableOpacity onPress={onRetry} style={styles.actionBtn} hitSlop={8} activeOpacity={0.75}>
          <Text style={[styles.actionText, { color: textColor }]}>{actionLabel}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  warningBanner: {
    backgroundColor: Colors.bannerAmberBg,
    borderBottomColor: Colors.bannerAmberBorder,
  },
  errorBanner: {
    backgroundColor: Colors.bannerRedBg,
    borderBottomColor: Colors.bannerRedBorder,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  message: {
    flex: 1,
    fontSize: 12,
  },
  actionBtn: {
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
