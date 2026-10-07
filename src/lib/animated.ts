import { cssInterop } from 'nativewind';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

/**
 * NativeWind only understands `className` on components it knows about.
 * cssInterop teaches it that Reanimated's animated components also accept
 * className (mapped onto `style`), so we can mix classes with animated styles.
 */
export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export const AnimatedView = Animated.View;

cssInterop(AnimatedPressable, { className: 'style' });
cssInterop(AnimatedView, { className: 'style' });
