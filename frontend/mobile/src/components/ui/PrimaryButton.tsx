import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  ActivityIndicator,
  Text,
  StyleSheet,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { isWeb } from '../../lib/platform';

type Props = {
  onPress: () => void;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
};

export default function PrimaryButton({
  onPress,
  label,
  loading = false,
  disabled = false,
  variant = 'primary',
}: Props) {
  const pressAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  return (
    <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.base,
          isPrimary ? styles.primary : styles.outline,
          isDisabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isPrimary ? Colors.white : Colors.primary} />
        ) : (
          <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelOutline]}>
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb
      ? { boxShadow: `0 4px 8px ${Colors.primary}4D` }
      : {
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }),
    elevation: 6,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    ...(isWeb ? { boxShadow: 'none' } : { shadowOpacity: 0 }),
    elevation: 0,
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  labelPrimary: {
    color: Colors.white,
  },
  labelOutline: {
    color: Colors.primary,
  },
});
