// components/SomnGuardLogo.tsx
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Logo animado de SomnGuard â€” portado desde la versiÃ³n HTML/CSS/JS.
//
// El ojo tiene 5 comportamientos aleatorios con pesos:
//   vigilar (40%) Â· parpadear (25%) Â· sospechar (20%) Â· alerta (10%) Â· centrar (5%)
//
// Props:
//   size     â€” tamaÃ±o del logo (base viewBox: 100)
//   hideName â€” si es true, oculta el texto "SOMNGUARD" (para la splash screen)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import { STATIC_COPY } from '@/shared/i18n/constants';
import { useAppTheme } from '@/shared/theme';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';

// â”€â”€ Wrappers animados de SVG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AnimatedRect   = Animated.createAnimatedComponent(Rect);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPath   = Animated.createAnimatedComponent(Path);

// â”€â”€ Props â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Props {
  size?:     number;   // tamaÃ±o relativo al viewBox (100)
  hideName?: boolean;  // ocultar el texto "SOMNGUARD" (splash lo anima por separado)
}

// â”€â”€ Constantes de animaciÃ³n (idÃ©nticas al HTML original) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CX    = 50;   // Centro X de la pupila en reposo
const CY    = 50;   // Centro Y de la pupila en reposo
const ALTO  = 24;   // Altura normal de la pÃ­ldora (ojo abierto)
const RADIO = 12;   // Radio de esquinas de la pÃ­ldora
const PUPIL_RADIUS = 9; // Radio fijo de la pupila
const LX    = 14;   // Rango horizontal mÃ¡ximo de movimiento (más seguro en móvil)
const LY    = 3;    // Rango vertical mÃ¡ximo de movimiento (más contenido en ojo)

export default function SomnGuardLogo({ size = 80, hideName = false }: Props) {
  const scale   = size / 80;
  const running = useRef(true);
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  // â”€â”€ Valores animados â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const pupilX     = useRef(new Animated.Value(CX)).current;
  const pupilY     = useRef(new Animated.Value(CY)).current;
  const pillHeight = useRef(new Animated.Value(ALTO)).current;
  const pillY      = useRef(new Animated.Value(CY - ALTO / 2)).current; // 38
  const pillRx     = useRef(new Animated.Value(RADIO)).current;
  const mouthCY    = useRef(new Animated.Value(81)).current;

  const pupilRy = pillHeight.interpolate({
    inputRange: [3, ALTO],
    outputRange: [2, PUPIL_RADIUS],
    extrapolate: 'clamp',
  });

  // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /** Anima un valor hacia un objetivo */
  function to(anim: Animated.Value, toValue: number, duration: number): Promise<void> {
    return new Promise(resolve => {
      Animated.timing(anim, {
        toValue,
        duration,
        easing:          Easing.inOut(Easing.quad),
        useNativeDriver: false, // false obligatorio para props de SVG
      }).start(() => resolve());
    });
  }

  const sleep   = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
  const rand    = (a: number, b: number) => Math.random() * (b - a) + a;
  const randPos = () => {
    const x = Math.min(Math.max(CX + rand(-LX, LX), CX - LX), CX + LX);
    const y = Math.min(Math.max(CY + rand(-LY, LY), CY - LY), CY + LY);
    return { x, y };
  };

  // â”€â”€ Mover pupila â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function movePupil(tx: number, ty: number, duration: number) {
    await Promise.all([to(pupilX, tx, duration), to(pupilY, ty, duration)]);
  }

  // â”€â”€ Animar pÃ­ldora â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function animatePill(newHeight: number, duration: number) {
    const newY  = CY - newHeight / 2;
    const newRx = Math.min(RADIO, newHeight / 2);
    // Keep the pupil centered in the pill, but keep its radius constant.
    const targetPupilY = newY + newHeight / 2;
    await Promise.all([
      to(pillHeight, newHeight, duration),
      to(pillY,      newY,      duration),
      to(pillRx,     newRx,     duration),
      to(pupilY,     targetPupilY, duration),
    ]);
  }

  // â”€â”€ Animar boca â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function animateMouth(targetCY: number, duration: number): Promise<void> {
    return to(mouthCY, targetCY, duration);
  }

  // â”€â”€ Comportamientos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async function vigilar() {
    animateMouth(78, 500);
    const n = Math.floor(rand(2, 5));
    for (let i = 0; i < n; i++) {
      const d = randPos();
      await movePupil(d.x, d.y, rand(400, 800));
      await sleep(rand(300, 900));
    }
  }

  async function parpadear() {
    animateMouth(81, 200);
    await animatePill(3, 120);
    await sleep(80);
    await animatePill(ALTO, 160);
  }

  async function sospechar() {
    animateMouth(65, 300);
    await animatePill(10, 200);
    await sleep(100);
    const lx = Math.random() > 0.5 ? CX + LX - 1 : CX - LX + 1;
    await movePupil(lx, CY, rand(600, 1000));
    await sleep(rand(400, 900));
    await movePupil(CX, CY, 400);
    await sleep(150);
    await Promise.all([animatePill(ALTO, 250), animateMouth(78, 350)]);
  }

  async function alerta() {
    animateMouth(86, 150);
    const n = Math.floor(rand(3, 6));
    for (let i = 0; i < n; i++) {
      const d = randPos();
      await movePupil(d.x, d.y, rand(80, 200));
      await sleep(rand(50, 150));
    }
    await movePupil(CX, CY, 300);
    animateMouth(78, 400);
  }

  async function centrar() {
    animateMouth(73, 400);
    await movePupil(CX, CY, 400);
    await sleep(rand(200, 600));
    animateMouth(78, 500);
  }

  // â”€â”€ Selector de comportamiento por peso â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const behaviors = [
    { fn: vigilar,   w: 40 },
    { fn: parpadear, w: 25 },
    { fn: sospechar, w: 20 },
    { fn: alerta,    w: 10 },
    { fn: centrar,   w: 5  },
  ];
  const totalW = behaviors.reduce((s, b) => s + b.w, 0);

  function pickBehavior(): () => Promise<void> {
    let pt = rand(0, totalW);
    for (const b of behaviors) { pt -= b.w; if (pt <= 0) return b.fn; }
    return behaviors[0].fn;
  }

  // â”€â”€ Loop principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    running.current = true;
    (async () => {
      while (running.current) {
        await pickBehavior()();
        await sleep(rand(200, 800));
      }
    })();
    return () => { running.current = false; };
    // Intentional animation loop; helper functions use stable animated refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // â”€â”€ InterpolaciÃ³n de la boca (string path) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const mouthPath = mouthCY.interpolate({
    inputRange:  [45, 100],
    outputRange: ['M41 73 Q50 45 59 73', 'M41 73 Q50 100 59 73'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Svg
        width={100 * scale}
        height={112 * scale}
        viewBox="0 0 100 112"
        fill="none"
      >
        {/* Escudo */}
        <Path
          d="M50 5 L88 19 L88 55 C88 79 70 97 50 107 C30 97 12 79 12 55 L12 19 Z"
          fill={theme.colors.surface}
          stroke={theme.colors.accent}
          strokeWidth={5.5}
          strokeLinejoin="round"
        />

        {/* PÃ­ldora / track del ojo */}
        <AnimatedRect
          x={26} y={pillY} width={48} height={pillHeight}
          rx={pillRx} ry={pillRx}
          fill={theme.colors.surface}
          stroke={theme.colors.accent}
          strokeWidth={4}
        />

        {/* Pupila adaptativa */}
        <AnimatedEllipse
          cx={pupilX} cy={pupilY}
          rx={PUPIL_RADIUS} ry={pupilRy}
          fill={theme.colors.accent}
        />

        {/* Boca */}
        <AnimatedPath
          d={mouthPath as any}
          stroke={theme.colors.accent}
          strokeWidth={3.5}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>

      {/* Nombre de la marca â€” se oculta en la splash (se anima por separado) */}
      {!hideName && (
        <Text style={[styles.brandName, { fontSize: 25 * scale }]}>
          {STATIC_COPY.appName}
        </Text>
      )}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    color:         theme.colors.accent,
    fontWeight:    '800',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  });
}


