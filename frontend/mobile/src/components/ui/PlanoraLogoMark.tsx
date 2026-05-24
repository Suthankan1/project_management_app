import React from 'react';
import Svg, {
  Circle,
  Path,
  Text as SvgText,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';

interface PlanoraIconMarkProps {
  size?: number;
}

export function PlanoraIconMark({ size = 48 }: PlanoraIconMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <SvgLinearGradient id="a" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#155DFC" />
          <Stop offset="100%" stopColor="#9810FA" />
        </SvgLinearGradient>
        <SvgLinearGradient id="b" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#9810FA" />
          <Stop offset="100%" stopColor="#F6339A" />
        </SvgLinearGradient>
        <SvgLinearGradient id="c" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#155DFC" />
          <Stop offset="50%" stopColor="#9810FA" />
          <Stop offset="100%" stopColor="#F6339A" />
        </SvgLinearGradient>
        <SvgLinearGradient id="d" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#155DFC" />
          <Stop offset="55%" stopColor="#9810FA" />
          <Stop offset="100%" stopColor="#F6339A" />
        </SvgLinearGradient>
      </Defs>

      {/* Faint outer track */}
      <Circle
        cx={100}
        cy={100}
        r={88}
        fill="none"
        stroke="#9810FA"
        strokeWidth={1.5}
        strokeOpacity={0.14}
      />

      {/* Faint inner track */}
      <Circle
        cx={100}
        cy={100}
        r={56}
        fill="none"
        stroke="#155DFC"
        strokeWidth={1.2}
        strokeOpacity={0.11}
      />

      {/* Arc 1: top to bottom-left */}
      <Path
        d="M 100 12 A 88 88 0 0 0 25 163"
        fill="none"
        stroke="url(#a)"
        strokeWidth={8}
        strokeLinecap="round"
      />

      {/* Arc 2: top to right */}
      <Path
        d="M 100 12 A 88 88 0 0 1 188 100"
        fill="none"
        stroke="url(#b)"
        strokeWidth={8}
        strokeLinecap="round"
      />

      {/* Inner arc */}
      <Path
        d="M 100 44 A 56 56 0 1 1 64 148"
        fill="none"
        stroke="url(#a)"
        strokeWidth={6}
        strokeLinecap="round"
        opacity={0.5}
      />

      {/* Core circle */}
      <Circle cx={100} cy={100} r={28} fill="url(#c)" />

      {/* "P" text */}
      <SvgText
        x={100}
        y={104}
        fontSize={30}
        fontWeight="700"
        fill="white"
        textAnchor="middle"
      >
        P
      </SvgText>

      {/* Top node */}
      <Circle cx={100} cy={12} r={8} fill="url(#a)" />
      <Circle cx={100} cy={12} r={4} fill="white" />

      {/* Right node */}
      <Circle cx={188} cy={100} r={8} fill="url(#b)" />
      <Circle cx={188} cy={100} r={4} fill="white" />

      {/* Bottom-left accent */}
      <Circle cx={25} cy={163} r={6} fill="#9810FA" opacity={0.55} />
    </Svg>
  );
}

interface PlanoraWordmarkProps {
  width?: number;
}

export function PlanoraWordmark({ width = 160 }: PlanoraWordmarkProps) {
  const height = (width * 200) / 330;

  return (
    <Svg width={width} height={height} viewBox="0 0 330 200">
      <Defs>
        <SvgLinearGradient id="d" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#155DFC" />
          <Stop offset="55%" stopColor="#9810FA" />
          <Stop offset="100%" stopColor="#F6339A" />
        </SvgLinearGradient>
      </Defs>

      {/* "planora" wordmark */}
      <SvgText
        x={0}
        y={120}
        fontSize={52}
        fontWeight="800"
        fill="url(#d)"
      >
        planora
      </SvgText>

      {/* Tagline */}
      <SvgText
        x={0}
        y={148}
        fontSize={10.5}
        fill="#9810FA"
        opacity={0.55}
      >
        PLAN · TRACK · SHIP
      </SvgText>
    </Svg>
  );
}
