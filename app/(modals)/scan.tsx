import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDrafts } from '@/components/add';
import { CameraGate, ScanFrame } from '@/components/scan';
import { Header, IconButton, Screen, Text, TextLink, useToast } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import type { ReceiptPhoto } from '@/services';
import { palette } from '@/theme';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const { setReceiptPhoto } = useDrafts();

  const review = (photo: ReceiptPhoto) => {
    setReceiptPhoto(photo);
    router.push('/scan-review');
  };

  const capture = async () => {
    if (!camera.current || !ready || busy) return;
    setBusy(true);
    haptics.press();
    try {
      // 0.5 quality is plenty for reading text and keeps the upload to the AI small.
      const photo = await camera.current.takePictureAsync({ quality: 0.5, base64: true });
      if (!photo.base64) throw new Error('No image data');
      // On web the base64 arrives as a full data URL; the AI wants just the data.
      const base64 = photo.base64.replace(/^data:[^,]+,/, '');
      review({ uri: photo.uri, base64, mimeType: photo.format === 'png' ? 'image/png' : 'image/jpeg' });
    } catch {
      toast.show({ message: "Couldn't take the photo. Try again.", tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  // Permission status is still loading.
  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color={palette.white} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <Screen header={<Header title="Scan receipt" leading="close" />}>
        <CameraGate canAskAgain={permission.canAskAgain} onRequest={requestPermission} onUseSample={() => review('sample')} />
      </Screen>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" onCameraReady={() => setReady(true)} />

      <View className="flex-1 justify-between" style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }}>
        <View className="flex-row items-center justify-between px-4">
          <IconButton
            icon={X}
            accessibilityLabel="Close"
            variant="ghost"
            iconColor={palette.white}
            className="bg-black/40"
            onPress={() => router.back()}
          />
          <Text variant="title" tone="white">
            Scan receipt
          </Text>
          <View className="w-11" />
        </View>

        <View className="items-center gap-4 px-10">
          <View className="aspect-[3/4] w-full">
            <ScanFrame />
          </View>
          <Text variant="bodySm" weight="semibold" tone="white" center>
            Fit the whole receipt inside the corners
          </Text>
        </View>

        <View className="items-center gap-3">
          <Pressable
            onPress={capture}
            disabled={!ready || busy}
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            className="h-20 w-20 items-center justify-center rounded-full border-4 border-white"
            style={{ opacity: ready ? 1 : 0.5 }}
          >
            {({ pressed }) =>
              busy ? (
                <ActivityIndicator color={palette.white} />
              ) : (
                <View className="h-16 w-16 rounded-full bg-white" style={{ transform: [{ scale: pressed ? 0.9 : 1 }] }} />
              )
            }
          </Pressable>
          <TextLink label="Use a sample receipt" onPress={() => review('sample')} />
        </View>
      </View>
    </View>
  );
}
