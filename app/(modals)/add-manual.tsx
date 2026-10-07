import { PencilLine } from 'lucide-react-native';

import { PhasePlaceholder } from '@/components/PhasePlaceholder';

export default function AddManualScreen() {
  return <PhasePlaceholder title="Add manually" phase={5} icon={PencilLine} kind="modal" />;
}
