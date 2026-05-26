import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Path,
  Text as SvgText,
} from 'react-native-svg';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/src/constants/colors';

const { width: W, height: H } = Dimensions.get('window');
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  onFinished: () => void;
};

export default function SplashAnimation({ onFinished }: Props) {
  const bgOpacity = useSharedValue(0);

  const arc1Stroke = useSharedValue(0);
  const arc2Stroke = useSharedValue(0);
  const arc3Stroke = useSharedValue(0);

  const coreScale = useSharedValue(0);
  const coreOpacity = useSharedValue(0);

  const letterOpacity = useSharedValue(0);

  const wordmarkOpacity = useSharedValue(0);
  const wordmarkTranslateY = useSharedValue(18);

  const taglineOpacity = useSharedValue(0);

  const outerOrbitRotation = useSharedValue(0);
  const rightOrbitRotation = useSharedValue(0);
  const innerOrbitRotation = useSharedValue(0);

  const exitOpacity = useSharedValue(1);
  const logoScale = useSharedValue(1);

  const ARC1_LEN = 292;
  const ARC2_LEN = 138;
  const ARC3_LEN = 323;

  const arc1Props = useAnimatedProps(() => ({
    strokeDashoffset: ARC1_LEN * (1 - arc1Stroke.value),
  }));

  const arc2Props = useAnimatedProps(() => ({
    strokeDashoffset: ARC2_LEN * (1 - arc2Stroke.value),
  }));

  const arc3Props = useAnimatedProps(() => ({
    strokeDashoffset: ARC3_LEN * (1 - arc3Stroke.value),
  }));

  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));

  const coreStyle = useAnimatedStyle(() => ({
    opacity: coreOpacity.value,
    transform: [{ scale: coreScale.value }],
  }));

  const letterStyle = useAnimatedStyle(() => ({
    opacity: letterOpacity.value,
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ translateY: wordmarkTranslateY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const outerOrbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${outerOrbitRotation.value}deg` }],
  }));

  const rightOrbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rightOrbitRotation.value}deg` }],
  }));

  const innerOrbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${innerOrbitRotation.value}deg` }],
  }));

  const exitStyle = useAnimatedStyle(() => ({
    opacity: exitOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  useEffect(() => {
    const easeOut = Easing.out(Easing.cubic);
    const easeIn = Easing.in(Easing.cubic);

    bgOpacity.value = withTiming(1, { duration: 400, easing: easeOut });

    arc1Stroke.value = withDelay(200, withTiming(1, { duration: 450, easing: easeOut }));
    arc2Stroke.value = withDelay(420, withTiming(1, { duration: 350, easing: easeOut }));
    arc3Stroke.value = withDelay(560, withTiming(1, { duration: 400, easing: easeOut }));

    coreOpacity.value = withDelay(780, withTiming(1, { duration: 200 }));
    coreScale.value = withDelay(
      780,
      withSpring(1, {
        damping: 10,
        stiffness: 180,
        mass: 0.6,
      }),
    );
    letterOpacity.value = withDelay(900, withTiming(1, { duration: 200 }));

    wordmarkOpacity.value = withDelay(1080, withTiming(1, { duration: 320, easing: easeOut }));
    wordmarkTranslateY.value = withDelay(1080, withTiming(0, { duration: 320, easing: easeOut }));

    taglineOpacity.value = withDelay(1340, withTiming(1, { duration: 220 }));

    outerOrbitRotation.value = withDelay(
      700,
      withRepeat(withTiming(360, { duration: 2600, easing: Easing.linear }), -1, false),
    );
    rightOrbitRotation.value = withDelay(
      760,
      withRepeat(withTiming(-360, { duration: 3400, easing: Easing.linear }), -1, false),
    );
    innerOrbitRotation.value = withDelay(
      820,
      withRepeat(withTiming(360, { duration: 1900, easing: Easing.linear }), -1, false),
    );

    logoScale.value = withDelay(
      1800,
      withSequence(
        withTiming(1.05, { duration: 120, easing: easeOut }),
        withTiming(0.92, { duration: 300, easing: easeIn }),
      ),
    );
    exitOpacity.value = withDelay(
      1900,
      withTiming(0, { duration: 300, easing: easeIn }, (finished) => {
        if (finished) {
          runOnJS(onFinished)();
        }
      }),
    );
  }, [
    arc1Stroke,
    arc2Stroke,
    arc3Stroke,
    bgOpacity,
    coreOpacity,
    coreScale,
    exitOpacity,
    letterOpacity,
    logoScale,
    onFinished,
    outerOrbitRotation,
    rightOrbitRotation,
    innerOrbitRotation,
    taglineOpacity,
    wordmarkOpacity,
    wordmarkTranslateY,
  ]);

  const markSize = 160;
  const svgCenterX = W / 2;
  const svgCenterY = H * 0.38;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
        <ExpoLinearGradient
          colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          exitStyle,
          {
            alignItems: 'center',
            paddingTop: svgCenterY - markSize / 2,
          },
        ]}
      >
        <View style={[styles.markWrap, { width: markSize, height: markSize, left: svgCenterX - W / 2 }]}>
          <Svg width={markSize} height={markSize} viewBox="0 0 200 200" style={styles.svgLayer}>
            <Defs>
              <LinearGradient id="sg1" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#155DFC" />
                <Stop offset="1" stopColor="#9810FA" />
              </LinearGradient>
              <LinearGradient id="sg2" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#9810FA" />
                <Stop offset="1" stopColor="#F6339A" />
              </LinearGradient>
              <LinearGradient id="sg3" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#155DFC" />
                <Stop offset="0.5" stopColor="#9810FA" />
                <Stop offset="1" stopColor="#F6339A" />
              </LinearGradient>
            </Defs>

            <Circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <Circle cx="100" cy="100" r="56" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" />
          </Svg>

          <Animated.View style={[styles.orbitLayer, outerOrbitStyle]}>
            <Svg width={markSize} height={markSize} viewBox="0 0 200 200" style={styles.svgLayer}>
            <AnimatedPath
              d="M 100 12 A 88 88 0 0 0 25 163"
              fill="none"
              stroke="white"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={ARC1_LEN}
              animatedProps={arc1Props}
              opacity={0.95}
            />

            <AnimatedCircle cx="100" cy="12" r="7" fill="white" opacity={0.9} />
            <AnimatedCircle cx="25" cy="163" r="5" fill="white" opacity={0.45} />
            </Svg>
          </Animated.View>

          <Animated.View style={[styles.orbitLayer, rightOrbitStyle]}>
            <Svg width={markSize} height={markSize} viewBox="0 0 200 200" style={styles.svgLayer}>
              <AnimatedPath
                d="M 100 12 A 88 88 0 0 1 188 100"
                fill="none"
                stroke="white"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={ARC2_LEN}
                animatedProps={arc2Props}
                opacity={0.8}
              />

              <AnimatedCircle cx="188" cy="100" r="7" fill="white" opacity={0.75} />
            </Svg>
          </Animated.View>

          <Animated.View style={[styles.orbitLayer, innerOrbitStyle]}>
            <Svg width={markSize} height={markSize} viewBox="0 0 200 200" style={styles.svgLayer}>
              <AnimatedPath
                d="M 100 44 A 56 56 0 1 1 64 148"
                fill="none"
                stroke="white"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={ARC3_LEN}
                animatedProps={arc3Props}
                opacity={0.5}
              />
            </Svg>
          </Animated.View>

          <Animated.View style={[styles.centerLayer, coreStyle]}>
            <Svg width={markSize} height={markSize} viewBox="0 0 200 200">
              <Circle cx="100" cy="100" r="26" fill="rgba(255,255,255,0.22)" />
              <Circle cx="100" cy="100" r="20" fill="white" opacity={0.95} />
            </Svg>
          </Animated.View>

          <Animated.View style={[styles.centerLayer, letterStyle]}>
            <Svg width={markSize} height={markSize} viewBox="0 0 200 200">
              <SvgText x="100" y="105" fontSize="24" fontWeight="800" fill="#9810FA" textAnchor="middle">
                P
              </SvgText>
            </Svg>
          </Animated.View>
        </View>

        <Animated.Text style={[styles.wordmark, wordmarkStyle]}>planora</Animated.Text>

        <Animated.Text style={[styles.tagline, taglineStyle]}>PLAN · TRACK · SHIP</Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  markWrap: {
    overflow: 'visible',
  },
  svgLayer: {
    overflow: 'visible',
  },
  orbitLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'visible',
  },
  centerLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    marginTop: 20,
    fontSize: 44,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -1.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  tagline: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.60)',
    letterSpacing: 4,
  },
});
