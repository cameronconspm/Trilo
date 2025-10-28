import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';

interface BadgeUnlockAnimationProps {
  badgeType: string;
  size?: number;
  onAnimationComplete?: () => void;
  autoPlay?: boolean;
}

// Mock Lottie animation data - in production, these would be actual Lottie JSON files
const mockLottieData = {
  credit_conqueror: {
    v: '5.7.4',
    fr: 30,
    ip: 0,
    op: 90,
    w: 200,
    h: 200,
    nm: 'Credit Conqueror Unlock',
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'Badge',
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 1, k: [{ i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 0, s: [0] }, { t: 30, s: [120] }] }
        },
        ao: 0,
        shapes: [
          {
            ty: 'gr',
            it: [
              {
                d: 1,
                ty: 'el',
                s: { a: 0, k: [80, 80] },
                p: { a: 0, k: [0, 0] },
                nm: 'Ellipse Path 1',
                mn: 'ADBE Vector Shape - Ellipse',
                hd: false
              },
              {
                ty: 'fl',
                c: { a: 0, k: [0.2, 0.6, 1, 1] },
                o: { a: 0, k: 100 },
                r: 1,
                bm: 0,
                nm: 'Fill 1',
                mn: 'ADBE Vector Graphic - Fill',
                hd: false
              }
            ],
            nm: 'Ellipse 1',
            np: 3,
            cix: 2,
            bm: 0,
            ix: 1,
            mn: 'ADBE Vector Group',
            hd: false
          }
        ],
        ip: 0,
        op: 90,
        st: 0,
        bm: 0
      }
    ],
    markers: []
  },
  emergency_hero: {
    v: '5.7.4',
    fr: 30,
    ip: 0,
    op: 90,
    w: 200,
    h: 200,
    nm: 'Emergency Hero Unlock',
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'Badge',
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 1, k: [{ i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 0, s: [0] }, { t: 30, s: [120] }] }
        },
        ao: 0,
        shapes: [
          {
            ty: 'gr',
            it: [
              {
                d: 1,
                ty: 'el',
                s: { a: 0, k: [80, 80] },
                p: { a: 0, k: [0, 0] },
                nm: 'Ellipse Path 1',
                mn: 'ADBE Vector Shape - Ellipse',
                hd: false
              },
              {
                ty: 'fl',
                c: { a: 0, k: [0.1, 0.7, 0.1, 1] },
                o: { a: 0, k: 100 },
                r: 1,
                bm: 0,
                nm: 'Fill 1',
                mn: 'ADBE Vector Graphic - Fill',
                hd: false
              }
            ],
            nm: 'Ellipse 1',
            np: 3,
            cix: 2,
            bm: 0,
            ix: 1,
            mn: 'ADBE Vector Group',
            hd: false
          }
        ],
        ip: 0,
        op: 90,
        st: 0,
        bm: 0
      }
    ],
    markers: []
  },
  no_spend_ninja: {
    v: '5.7.4',
    fr: 30,
    ip: 0,
    op: 90,
    w: 200,
    h: 200,
    nm: 'No Spend Ninja Unlock',
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'Badge',
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 1, k: [{ i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 0, s: [0] }, { t: 30, s: [120] }] }
        },
        ao: 0,
        shapes: [
          {
            ty: 'gr',
            it: [
              {
                d: 1,
                ty: 'el',
                s: { a: 0, k: [80, 80] },
                p: { a: 0, k: [0, 0] },
                nm: 'Ellipse Path 1',
                mn: 'ADBE Vector Shape - Ellipse',
                hd: false
              },
              {
                ty: 'fl',
                c: { a: 0, k: [0.4, 0.4, 1, 1] },
                o: { a: 0, k: 100 },
                r: 1,
                bm: 0,
                nm: 'Fill 1',
                mn: 'ADBE Vector Graphic - Fill',
                hd: false
              }
            ],
            nm: 'Ellipse 1',
            np: 3,
            cix: 2,
            bm: 0,
            ix: 1,
            mn: 'ADBE Vector Group',
                hd: false
          }
        ],
        ip: 0,
        op: 90,
        st: 0,
        bm: 0
      }
    ],
    markers: []
  },
  streak_master: {
    v: '5.7.4',
    fr: 30,
    ip: 0,
    op: 90,
    w: 200,
    h: 200,
    nm: 'Streak Master Unlock',
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'Badge',
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 1, k: [{ i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 0, s: [0] }, { t: 30, s: [120] }] }
        },
        ao: 0,
        shapes: [
          {
            ty: 'gr',
            it: [
              {
                d: 1,
                ty: 'el',
                s: { a: 0, k: [80, 80] },
                p: { a: 0, k: [0, 0] },
                nm: 'Ellipse Path 1',
                mn: 'ADBE Vector Shape - Ellipse',
                hd: false
              },
              {
                ty: 'fl',
                c: { a: 0, k: [1, 0.6, 0, 1] },
                o: { a: 0, k: 100 },
                r: 1,
                bm: 0,
                nm: 'Fill 1',
                mn: 'ADBE Vector Graphic - Fill',
                hd: false
              }
            ],
            nm: 'Ellipse 1',
            np: 3,
            cix: 2,
            bm: 0,
            ix: 1,
            mn: 'ADBE Vector Group',
            hd: false
          }
        ],
        ip: 0,
        op: 90,
        st: 0,
        bm: 0
      }
    ],
    markers: []
  }
};

export function BadgeUnlockAnimation({ 
  badgeType, 
  size = 120, 
  onAnimationComplete,
  autoPlay = true 
}: BadgeUnlockAnimationProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const animationRef = useRef<LottieView>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (autoPlay) {
      // Start scale animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Start opacity animation
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Play Lottie animation
      if (animationRef.current) {
        animationRef.current.play();
      }
    }
  }, [autoPlay, scaleAnim, opacityAnim]);

  const getAnimationData = (type: string) => {
    switch (type) {
      case 'credit_conqueror':
      case 'debt_buster':
      case 'debt_destroyer':
        return mockLottieData.credit_conqueror;
      case 'emergency_hero':
      case 'saver_star':
      case 'consistent_saver':
        return mockLottieData.emergency_hero;
      case 'no_spend_ninja':
      case 'spending_wise':
        return mockLottieData.no_spend_ninja;
      case 'streak_master':
      case 'consistency':
        return mockLottieData.streak_master;
      default:
        return mockLottieData.credit_conqueror;
    }
  };

  return (
    <Animated.View 
      style={[
        styles.animationContainer,
        {
          width: size,
          height: size,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      <LottieView
        ref={animationRef}
        source={getAnimationData(badgeType)}
        style={styles.lottieAnimation}
        autoPlay={autoPlay}
        loop={false}
        onAnimationFinish={onAnimationComplete}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

// Micro Animation Component for earned badges
interface MicroAnimationProps {
  children: React.ReactNode;
  trigger?: boolean;
}

export function MicroAnimation({ children, trigger = false }: MicroAnimationProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(rotationAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(rotationAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [trigger, scaleAnim, rotationAnim]);

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  return (
    <Animated.View
      style={{
        transform: [
          { scale: scaleAnim },
          { rotate: rotation },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
});
