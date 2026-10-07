import { router } from 'expo-router';
import { Quote } from 'lucide-react-native';
import { View } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';

import { DraftCard, useDrafts } from '@/components/add';
import { Text } from '@/components/ui';
import { useAccountMap, useCategoryMap } from '@/hooks';
import { AnimatedView } from '@/lib/animated';
import { useTheme } from '@/theme';

/** What we heard, then one card per transaction found in it. Each can be edited or removed. */
export function VoiceResults({ transcript, currency }: { transcript: string; currency: string }) {
  const { colors } = useTheme();
  const { drafts, removeDraft } = useDrafts();
  const categories = useCategoryMap();
  const accounts = useAccountMap();

  return (
    <View className="gap-4">
      <View className="flex-row gap-3 rounded-input border border-line bg-raised p-4">
        <Quote size={18} color={colors.muted} />
        <Text tone="muted" className="flex-1 italic">
          {transcript}
        </Text>
      </View>
      <Text variant="title">
        {drafts.length === 1 ? 'Found 1 transaction' : `Found ${drafts.length} transactions`}
      </Text>
      {drafts.map((d, i) => (
        <AnimatedView key={d.key} entering={FadeInDown.duration(300).delay(i * 80)}>
          <DraftCard
            draft={d}
            category={categories.get(d.categoryId)}
            accountName={accounts.get(d.accountId)?.name}
            currency={currency}
            onEdit={() => router.push({ pathname: '/add-manual', params: { draftKey: d.key } })}
            onRemove={drafts.length > 1 ? () => removeDraft(d.key) : undefined}
          />
        </AnimatedView>
      ))}
    </View>
  );
}
