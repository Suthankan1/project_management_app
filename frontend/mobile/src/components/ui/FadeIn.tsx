import React, { useRef, useEffect } from 'react';
import { Animated, Platform } from 'react-native';

export default function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(ty, {
        toValue: 0,
        delay,
        useNativeDriver: Platform.OS !== 'web',
        tension: 220,
        friction: 18,
      }),
    ]).start();
  }, [delay]);
  return <Animated.View style={{ opacity: op, transform: [{ translateY: ty }] }}>{children}</Animated.View>;
}
