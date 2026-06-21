import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/src/constants/colors';

interface Props {
  isConnected: boolean;
  shouldShowErrorBanner: boolean;
  error: string;
  onRetry: () => void;
  isOffline?: boolean;
  isShowingStaleCache?: boolean;
  queuedCount?: number;
  failedCount?: number;
  serverChangedWhileOffline?: boolean;
}

export function ChatConnectionBanner({
  isConnected,
  shouldShowErrorBanner,
  error,
  onRetry,
  isOffline = false,
  isShowingStaleCache = false,
  queuedCount = 0,
  failedCount = 0,
  serverChangedWhileOffline = false,
}: Props) {
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  const showBanner =
    !isConnected ||
    shouldShowErrorBanner ||
    isShowingStaleCache ||
    queuedCount > 0 ||
    failedCount > 0 ||
    serverChangedWhileOffline;

  const isError = shouldShowErrorBanner;

  useEffect(() => {
    height.value = withTiming(showBanner ? 44 : 0, { duration: 220 });
    opacity.value = withTiming(showBanner ? 1 : 0, { duration: 200 });
  }, [height, opacity, showBanner]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
    overflow: 'hidden',
  }));

  // Always render (never early return) so exit animation can play
  const tone = isError ? 'error' : 'warning';
  const iconName: any = isError ? 'alert-circle-outline' : 'wifi-outline';
  const textColor = isError ? Colors.bannerRedText : Colors.bannerAmberText;

  const message = isError
    ? error
    : failedCount > 0
      ? `${failedCount} message${failedCount === 1 ? '' : 's'} failed to send`
      : queuedCount > 0
        ? `${queuedCount} message${queuedCount === 1 ? '' : 's'} queued`
        : serverChangedWhileOffline
          ? 'Chat updated while offline. Messages refreshed.'
          : isShowingStaleCache || isOffline
            ? 'Offline · Showing cached messages'
            : 'Reconnecting…';

  const actionLabel = isError || failedCount > 0 ? 'Retry' : 'Reconnect';

  return (
    <Animated.View style={[animatedStyle]} pointerEvents={showBanner ? 'auto' : 'none'}>
      <View style={[styles.banner, tone === 'error' ? styles.errorBanner : styles.warningBanner]}>
        <View style={styles.content}>
          <Ionicons name={iconName} size={14} color={textColor} />
          <Text style={[styles.message, { color: textColor }]} numberOfLines={1}>
            {message}
          </Text>
          {queuedCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: textColor + '22' }]}>
              <Text style={[styles.countBadgeText, { color: textColor }]}>{queuedCount}</Text>
            </View>
          )}
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
    paddingHorizontal: 14,
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
    gap: 7,
    minWidth: 0,
  },
  message: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  countBadge: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtn: {
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
