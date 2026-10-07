import { ScanLine } from 'lucide-react-native';

import { PhasePlaceholder } from '@/components/PhasePlaceholder';

export default function ScanScreen() {
  return <PhasePlaceholder title="Scan receipt" phase={5} icon={ScanLine} kind="modal" />;
}
