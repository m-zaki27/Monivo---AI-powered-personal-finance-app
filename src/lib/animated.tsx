import { cssInterop } from 'nativewind';
import type { ComponentProps } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

// On native, NativeWind processing an animated `style` drops the class styles, so
// `className` is mapped to a separate `classStyle` prop and `style` passes through untouched.

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
