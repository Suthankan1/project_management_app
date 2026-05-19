import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  ActivityIndicator,
  Text,
  Platform,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { shouldUseNativeDriver } from '../../lib/platform';

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
    Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: shouldUseNativeDriver }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: shouldUseNativeDriver }).start();
  };

  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  return (
    <Animated.View
      style={[
        styles.wrap,
        isPrimary && styles.wrapPrimary,
        { elevation: isPrimary && !isDisabled ? 8 : 0 },
        isDisabled && styles.disabled,
        { transform: [{ scale: pressAnim }] },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.base,
          !isPrimary && styles.outline,
        ]}
      >
        {isPrimary && (
          <LinearGradient
            colors={['#155DFC', '#7C3AED']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />
        )}
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
  wrap: {
    borderRadius: 16,
  },
  wrapPrimary: {
    ...Platform.select({
      web: {},
      default: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
    }),
  },
  base: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 8px 16px rgba(124, 58, 237, 0.35)' },
      default: {},
    }),
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    ...Platform.select({ web: { boxShadow: 'none' }, default: {} }),
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  labelPrimary: {
    color: Colors.white,
  },
  labelOutline: {
    color: Colors.primary,
  },
});
