import { router } from 'expo-router';

/**
 * Closes the current modal screen. If it was opened directly (deep link,
 * web refresh) there's nothing to go back to, so land on Home instead.
 */
export function closeModal() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
