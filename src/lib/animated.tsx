import { cssInterop } from 'nativewind';
import type { ComponentProps } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

/**
 * Reanimated components that also accept NativeWind `className`.
 *
 * Why the wrappers: on native, NativeWind runs every value in `style` through
 * its own rule engine. A Reanimated animated style (from useAnimatedStyle)
 * isn't a plain object, and passing it through that engine breaks the whole
 * style, so the class styles silently disappear (web is fine because it uses
 * real CSS). So NativeWind resolves `className` into a separate `classStyle`
 * prop, and the animated `style` goes straight to Reanimated, untouched.
 */

type WithClass<P> = P & { className?: string; classStyle?: StyleProp<ViewStyle> };

const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedView({ classStyle, style, ...rest }: WithClass<Omit<ComponentProps<typeof Animated.View>, 'key'>>) {
  return <Animated.View {...rest} style={[classStyle, style]} />;
}

export function AnimatedPressable({ classStyle, style, ...rest }: WithClass<Omit<ComponentProps<typeof ReanimatedPressable>, 'key'>>) {
  return <ReanimatedPressable {...rest} style={[classStyle, style]} />;
}

cssInterop(AnimatedView, { className: 'classStyle' });
cssInterop(AnimatedPressable, { className: 'classStyle' });
