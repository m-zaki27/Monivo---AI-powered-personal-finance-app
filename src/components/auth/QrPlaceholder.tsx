import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { LogoMark } from '@/components/ui';
import { palette } from '@/theme';

const GRID = 25;

/** Small seeded PRNG (mulberry32) so the same secret always draws the same pattern. */
function seeded(seed: string) {
  let h = 1779033703;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const inFinder = (x: number, y: number) => {
  const near = (v: number, o: number) => v >= o && v < o + 8;
  return (near(x, 0) && near(y, 0)) || (near(x, GRID - 8) && near(y, 0)) || (near(x, 0) && near(y, GRID - 8));
};

/**
 * Looks like a QR code but isn't one. Generating a real code needs a library;
 * once the API is live this can be swapped for an image the server renders.
 * Always navy-on-white (even in dark mode): scanners need dark-on-light.
 */
export function QrPlaceholder({ value, size = 200 }: { value: string; size?: number }) {
  const cells = useMemo(() => {
    const rand = seeded(value);
    const out: [number, number][] = [];
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) if (!inFinder(x, y) && rand() > 0.52) out.push([x, y]);
    return out;
  }, [value]);

  const finders: [number, number][] = [
    [0, 0],
    [GRID - 7, 0],
    [0, GRID - 7],
  ];

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="QR code for your authenticator app"
      className="items-center justify-center self-center rounded-card bg-white p-4"
    >
      <Svg width={size} height={size} viewBox={`0 0 ${GRID} ${GRID}`}>
        {cells.map(([x, y]) => (
          <Rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={palette.navy} />
        ))}
        {finders.map(([x, y]) => (
          <Finder key={`${x}-${y}`} x={x} y={y} />
        ))}
        {/* Clear the middle for the logo */}
        <Rect x={9.5} y={9.5} width={6} height={6} rx={1.2} fill={palette.white} />
      </Svg>
      <View className="absolute">
        <LogoMark size={size * 0.17} color={palette.navy} />
      </View>
    </View>
  );
}

function Finder({ x, y }: { x: number; y: number }) {
  return (
    <>
      <Rect x={x} y={y} width={7} height={7} rx={1.5} fill={palette.navy} />
      <Rect x={x + 1} y={y + 1} width={5} height={5} rx={1} fill={palette.white} />
      <Rect x={x + 2} y={y + 2} width={3} height={3} rx={0.6} fill={palette.navy} />
    </>
  );
}
