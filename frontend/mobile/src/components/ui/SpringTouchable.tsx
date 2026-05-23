import React, { useRef } from 'react';
import { Animated, TouchableOpacity, Platform } from 'react-native';

type Props = {
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
  activeOpacity?: number;
};

export default function SpringTouchable({ onPress, children, style, activeOpacity = 1 }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, {
      toValue: 0.95,
      tension: 600,
      friction: 12,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      tension: 400,
      friction: 15,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={activeOpacity} style={style}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
