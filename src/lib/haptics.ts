import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// No-ops on web, where expo-haptics is unsupported.
const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

export const haptics = {
  tap: () => enabled && void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  press: () => enabled && void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  select: () => enabled && void Haptics.selectionAsync(),
  success: () => enabled && void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => enabled && void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => enabled && void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
