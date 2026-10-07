import { Camera } from 'lucide-react-native';
import { Linking, View } from 'react-native';

import { Button, EmptyState, TextLink } from '@/components/ui';

interface CameraGateProps {
  canAskAgain: boolean;
  onRequest: () => void;
  onUseSample: () => void;
}

/**
 * Shown when there's no camera access yet. If the user said "Don't allow"
 * permanently, the OS won't show the prompt again, so we send them to Settings.
 */
export function CameraGate({ canAskAgain, onRequest, onUseSample }: CameraGateProps) {
  return (
    <View className="flex-1 justify-center gap-4 px-6">
      <EmptyState
        icon={Camera}
        title="Let Monivo use your camera"
        message="We only use it to read receipts you choose to scan. Photos stay on your phone until you save."
      />
      {canAskAgain ? (
        <Button title="Allow camera" onPress={onRequest} fullWidth />
      ) : (
        <Button title="Open Settings" onPress={() => Linking.openSettings()} fullWidth />
      )}
      <View className="items-center">
        <TextLink label="Try a sample receipt instead" onPress={onUseSample} />
      </View>
    </View>
  );
}
