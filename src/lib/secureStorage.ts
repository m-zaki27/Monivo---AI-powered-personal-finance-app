import AsyncStorage from '@react-native-async-storage/async-storage';
import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore is size-limited, so it holds only an AES key; values are encrypted into
// AsyncStorage. Web has no SecureStore and falls back to plain AsyncStorage.

const KEY_NAME = 'monivo.session-key';
const PREFIX = 'enc:v1:';
const KEYCHAIN = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK };

let keyPromise: Promise<AESEncryptionKey> | null = null;
function getKey() {
  keyPromise ??= (async () => {
    const saved = await SecureStore.getItemAsync(KEY_NAME, KEYCHAIN);
    if (saved) return AESEncryptionKey.import(saved, 'base64');
    const key = await AESEncryptionKey.generate();
    await SecureStore.setItemAsync(KEY_NAME, await key.encoded('base64'), KEYCHAIN);
    return key;
  })();
  // Don't cache a failure (e.g. Keychain busy); retry on next call.
  keyPromise.catch(() => (keyPromise = null));
  return keyPromise;
}

// encodeURIComponent keeps btoa/atob safe for non-ASCII text.
const toBase64 = (text: string) => btoa(encodeURIComponent(text));
const fromBase64 = (b64: string) => decodeURIComponent(atob(b64));
const base64ToBytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function encrypt(value: string) {
  const sealed = await aesEncryptAsync(toBase64(value), await getKey());
  return PREFIX + (await sealed.combined('base64'));
}

async function decrypt(stored: string) {
  // Pass bytes: despite the docs, Android's fromCombined fails on a base64 string.
  const sealed = AESSealedData.fromCombined(base64ToBytes(stored.slice(PREFIX.length)));
  return fromBase64((await aesDecryptAsync(sealed, await getKey(), { output: 'base64' })) as string);
}

const nativeStorage = {
  async getItem(name: string) {
    const stored = await AsyncStorage.getItem(name);
    if (stored === null) return null;
    // Migrate legacy plaintext values.
    if (!stored.startsWith(PREFIX)) {
      await AsyncStorage.setItem(name, await encrypt(stored));
      return stored;
    }
    try {
      return await decrypt(stored);
    } catch (e) {
      // E.g. key lost after a device restore: treat as empty; the next save overwrites it.
      if (__DEV__) console.warn(`[secureStorage] couldn't decrypt "${name}"`, e);
      return null;
    }
  },
  async setItem(name: string, value: string) {
    await AsyncStorage.setItem(name, await encrypt(value));
  },
  removeItem: (name: string) => AsyncStorage.removeItem(name),
};

export const secureStorage = Platform.OS === 'web' ? AsyncStorage : nativeStorage;
