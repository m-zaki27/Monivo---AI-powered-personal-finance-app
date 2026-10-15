import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

// Android only emits keyboardDid* events; iOS "will" events fire before the animation.
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
