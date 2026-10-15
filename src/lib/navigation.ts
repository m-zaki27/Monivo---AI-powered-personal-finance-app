import { router } from 'expo-router';

// Falls back to Home when the modal was opened directly (deep link, web refresh).
export function closeModal() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
