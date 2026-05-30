import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  type?: 'success' | 'error';
};

export default function Toast({ message, visible, onDismiss, type = 'error' }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);

  useEffect(() => {
    if (visible && message) {
      translateY.value = withSpring(insets.top + 16, { damping: 15 });
      const timer = setTimeout(() => {
        translateY.value = withTiming(-100, {}, (finished) => {
          if (finished) {
            runOnJS(onDismiss)();
          }
        });
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      translateY.value = withTiming(-100);
    }
  }, [visible, message, insets.top, onDismiss, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const isError = type === 'error';

  return (
    <Animated.View
      style={[
        styles.toast,
        isError ? styles.errorToast : styles.successToast,
        animatedStyle,
      ]}
    >
      <Text style={[styles.text, isError ? styles.errorText : styles.successText]}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 9999,
  },
  errorToast: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  successToast: {
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: '#A3E635',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  errorText: {
    color: '#991B1B',
  },
  successText: {
    color: '#137333',
  },
});
