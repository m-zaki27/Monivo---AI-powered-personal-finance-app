import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * True while the on-screen keyboard is up. iOS fires "will" events (so we can
 * react before it animates); Android only fires "did".
 */
export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subs = [Keyboard.addListener(show, () => setVisible(true)), Keyboard.addListener(hide, () => setVisible(false))];
    return () => subs.forEach((s) => s.remove());
  }, []);
  return visible;
}
