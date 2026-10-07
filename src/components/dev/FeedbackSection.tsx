import { Receipt } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import {
  BottomSheet,
  Button,
  CategoryBadge,
  Chip,
  EmptyState,
  ErrorState,
  ProgressBar,
  Skeleton,
  SkeletonText,
  Text,
  useToast,
} from '@/components/ui';
import { mockCategories } from '@/mock/categories';

import { DevSection, Row } from './DevSection';

export function FeedbackSection() {
  const toast = useToast();
  const [chip, setChip] = useState('all');
  const [sheet, setSheet] = useState(false);

  return (
    <>
      <DevSection title="Chips">
        <Row>
          {['all', 'income', 'expense', 'wallet'].map((c) => (
            <Chip key={c} label={c[0]!.toUpperCase() + c.slice(1)} selected={chip === c} onPress={() => setChip(c)} />
          ))}
        </Row>
      </DevSection>

      <DevSection title="Category badges">
        <Row>
          {mockCategories.map((c) => (
            <CategoryBadge key={c.id} icon={c.icon} color={c.color} />
          ))}
        </Row>
      </DevSection>

      <DevSection title="Progress">
        <ProgressBar value={0.45} accessibilityLabel="45% used" />
        <ProgressBar value={0.84} accessibilityLabel="84% used" />
        <ProgressBar value={1.1} accessibilityLabel="110% used" />
        <Text variant="caption" tone="muted">
          Normal · warning at 80% (amber) · over budget (rose)
        </Text>
      </DevSection>

      <DevSection title="Skeleton">
        <View className="flex-row items-center gap-3">
          <Skeleton width={44} height={44} rounded="rounded-full" />
          <SkeletonText className="flex-1" />
        </View>
      </DevSection>

      <DevSection title="Toast & sheet">
        <Row>
          <Button size="sm" variant="secondary" title="Success" onPress={() => toast.show({ message: 'Transaction saved', tone: 'success' })} />
          <Button
            size="sm"
            variant="secondary"
            title="With undo"
            onPress={() => toast.show({ message: 'Transaction deleted', action: { label: 'Undo', onPress: () => toast.show({ message: 'Restored' }) } })}
          />
          <Button size="sm" variant="secondary" title="Error" onPress={() => toast.show({ message: 'Couldn’t save. Try again.', tone: 'error' })} />
          <Button size="sm" variant="secondary" title="Open sheet" onPress={() => setSheet(true)} />
        </Row>
        <BottomSheet visible={sheet} onClose={() => setSheet(false)} title="Bottom sheet" subtitle="Drag down or tap outside to close.">
          <Button title="Got it" onPress={() => setSheet(false)} />
        </BottomSheet>
      </DevSection>

      <DevSection title="Empty & error states">
        <EmptyState compact icon={Receipt} title="No transactions yet" message="Add your first one and it shows up here." actionLabel="Add transaction" onAction={() => {}} />
        <ErrorState compact error={new Error('We couldn’t reach Monivo.')} onRetry={() => {}} />
      </DevSection>
    </>
  );
}
