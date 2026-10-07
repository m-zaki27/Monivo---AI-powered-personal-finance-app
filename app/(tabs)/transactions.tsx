import { ArrowLeftRight } from 'lucide-react-native';

import { PhasePlaceholder } from '@/components/PhasePlaceholder';

export default function TransactionsScreen() {
  return <PhasePlaceholder title="Transactions" phase={4} icon={ArrowLeftRight} />;
}
