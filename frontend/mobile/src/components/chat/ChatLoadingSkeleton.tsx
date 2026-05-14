import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/colors';
import { shouldUseNativeDriver } from '@/src/lib/platform';

export function ChatLoadingSkeleton() {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: shouldUseNativeDriver }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: shouldUseNativeDriver }),
      ])
    ).start();
  }, [pulse]);

  const renderSidebarItem = (key: number) => (
    <Animated.View key={key} style={[styles.sidebarItem, { opacity: pulse }]}>
      <View style={styles.circle} />
      <View style={styles.textStack}>
        <View style={[styles.bar, { width: '60%' }]} />
        <View style={[styles.bar, { width: '40%', height: 8 }]} />
      </View>
    </Animated.View>
  );

  const renderBubble = (key: number, isMe: boolean) => (
    <Animated.View
      key={key}
      style={[
        styles.bubble,
        isMe ? styles.bubbleMe : styles.bubbleOther,
        { opacity: pulse }
      ]}
    />
  );

  return (
    <View style={styles.container}>
      {/* Sidebar Part (simulated for skeleton) */}
      <View style={styles.sidebar}>
        {[1, 2, 3, 4, 5, 6].map(i => renderSidebarItem(i))}
      </View>

      {/* Message Area Part */}
      <View style={styles.chatArea}>
        <View style={styles.headerSkeleton}>
          <View style={[styles.circle, { width: 36, height: 36 }]} />
          <View style={[styles.bar, { width: 120, marginLeft: 12 }]} />
        </View>
        <View style={styles.messages}>
          {renderBubble(1, false)}
          {renderBubble(2, true)}
          {renderBubble(3, false)}
          {renderBubble(4, false)}
          {renderBubble(5, true)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: Colors.pageBg },
  sidebar: { width: 80, backgroundColor: Colors.white, borderRightWidth: 1, borderRightColor: Colors.chatDivider, paddingTop: 40 },
  sidebarItem: { alignItems: 'center', marginBottom: 24 },
  circle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.chatDivider },
  textStack: { width: '100%', alignItems: 'center', marginTop: 8 },
  bar: { height: 12, backgroundColor: Colors.chatDivider, borderRadius: 6, marginBottom: 4 },
  chatArea: { flex: 1, backgroundColor: Colors.white },
  headerSkeleton: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.chatDivider,
  },
  messages: { flex: 1, padding: 16, gap: 16 },
  bubble: { height: 60, borderRadius: 18, marginBottom: 12 },
  bubbleOther: { width: '70%', backgroundColor: Colors.chatBubbleOther, borderBottomLeftRadius: 4 },
  bubbleMe: { width: '60%', backgroundColor: Colors.chatBubbleMe, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
});
