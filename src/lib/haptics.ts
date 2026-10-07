import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * One wrapper so haptic "vocabulary" stays consistent and web never crashes.
 * Rule of thumb: tap = light, toggle/select = selection, save = success.
 */
const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

export const haptics = {
  tap: () => enabled && void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  press: () => enabled && void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  select: () => enabled && void Haptics.selectionAsync(),
  success: () => enabled && void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => enabled && void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => enabled && void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
