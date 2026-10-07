import { Construction, type LucideIcon } from 'lucide-react-native';

import { EmptyState, Header, Screen } from '@/components/ui';

interface PhasePlaceholderProps {
  title: string;
  phase: number;
  icon?: LucideIcon;
  /** Tab roots get a large title; modals get a close button */
  kind?: 'tab' | 'modal';
}

/** Temporary stand-in for screens that later phases will build. */
export function PhasePlaceholder({ title, phase, icon = Construction, kind = 'tab' }: PhasePlaceholderProps) {
  return (
    <Screen
      withTabBar={kind === 'tab'}
      header={kind === 'tab' ? <Header large title={title} /> : <Header title={title} leading="close" />}
    >
      <EmptyState icon={icon} title={`${title} is coming`} message={`This screen is built in Phase ${phase}.`} />
    </Screen>
  );
}
