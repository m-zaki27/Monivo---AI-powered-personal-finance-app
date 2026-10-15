import { Camera } from 'lucide-react-native';
import { Linking, View } from 'react-native';

import { Button, EmptyState, TextLink } from '@/components/ui';

interface CameraGateProps {
  canAskAgain: boolean;
  onRequest: () => void;
  onUseSample: () => void;
}

/** If permission was permanently denied the OS won't re-prompt, so link to Settings. */
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
