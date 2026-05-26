import React, { useEffect } from 'react';
import { Dimensions, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/src/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SKELETON_COLOR = '#E5E7EB';
const SHIMMER_WIDTH = SCREEN_WIDTH * 0.8;
const BUBBLE_WIDTHS = ['62%', '54%', '70%', '46%', '58%'] as const;

export function ChatLoadingSkeleton() {
  const shimmerX = useSharedValue(-SCREEN_WIDTH);

  useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(SCREEN_WIDTH, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [shimmerX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  const renderSidebarItem = (key: number) => (
    <View key={key} style={styles.sidebarItem}>
      <SkeletonShape style={styles.avatar} shimmerStyle={shimmerStyle} />
      <View style={styles.textStack}>
        <SkeletonShape style={[styles.bar, styles.primaryBar]} shimmerStyle={shimmerStyle} />
        <SkeletonShape style={[styles.bar, styles.secondaryBar]} shimmerStyle={shimmerStyle} />
      </View>
    </View>
  );

  const renderBubble = (key: number, isMe: boolean, width: typeof BUBBLE_WIDTHS[number]) => (
    <SkeletonShape
      key={key}
      shimmerStyle={shimmerStyle}
      style={[
        styles.bubble,
        { width },
        isMe ? styles.bubbleMe : styles.bubbleOther,
      ]}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        {[1, 2, 3, 4, 5, 6].map(i => renderSidebarItem(i))}
      </View>

      <View style={styles.chatArea}>
        <View style={styles.headerSkeleton}>
          <SkeletonShape style={styles.headerAvatar} shimmerStyle={shimmerStyle} />
          <SkeletonShape style={styles.headerBar} shimmerStyle={shimmerStyle} />
        </View>

        <View style={styles.messages}>
          {renderBubble(1, false, BUBBLE_WIDTHS[0])}
          {renderBubble(2, true, BUBBLE_WIDTHS[1])}
          {renderBubble(3, false, BUBBLE_WIDTHS[2])}
          {renderBubble(4, false, BUBBLE_WIDTHS[3])}
          {renderBubble(5, true, BUBBLE_WIDTHS[4])}
        </View>
      </View>
    </View>
  );
}

function SkeletonShape({
  style,
  shimmerStyle,
}: {
  style: StyleProp<ViewStyle>;
  shimmerStyle: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.skeletonBase, style]}>
      <Animated.View pointerEvents="none" style={[styles.shimmer, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', '#E5E7EB50', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.pageBg,
  },
  sidebar: {
    width: 96,
    backgroundColor: Colors.cardBg,
    borderRightWidth: 1,
    borderRightColor: Colors.chatDivider,
    paddingTop: 40,
    paddingHorizontal: 12,
  },
  sidebarItem: {
    alignItems: 'center',
    marginBottom: 24,
  },
  skeletonBase: {
    backgroundColor: SKELETON_COLOR,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SHIMMER_WIDTH,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  textStack: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  bar: {
    height: 10,
    borderRadius: 5,
    marginBottom: 6,
  },
  primaryBar: {
    width: '60%',
  },
  secondaryBar: {
    width: '40%',
    height: 8,
  },
  chatArea: {
    flex: 1,
    backgroundColor: Colors.cardBg,
  },
  headerSkeleton: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.chatDivider,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerBar: {
    width: 120,
    height: 12,
    borderRadius: 6,
    marginLeft: 12,
  },
  messages: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  bubble: {
    height: 60,
    borderRadius: 18,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
});
