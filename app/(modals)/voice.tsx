import { Mic } from 'lucide-react-native';

import { PhasePlaceholder } from '@/components/PhasePlaceholder';

export default function VoiceScreen() {
  return <PhasePlaceholder title="Voice" phase={5} icon={Mic} kind="modal" />;
}
