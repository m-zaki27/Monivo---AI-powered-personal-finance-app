import { AlertTriangle, CheckCircle2, Store } from 'lucide-react-native';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { Image, View } from 'react-native';

import { AmountField, CategoryPicker, DateField } from '@/components/add';
import { FormInput } from '@/components/forms';
import { Text } from '@/components/ui';
import { useCategories } from '@/hooks';
import { withAlpha } from '@/lib/color';
import type { ReceiptReviewValues } from '@/schemas/transactionForm';
import { useTheme } from '@/theme';

import { SampleReceipt } from './SampleReceipt';

interface ReceiptReviewFieldsProps {
  form: UseFormReturn<ReceiptReviewValues>;
  photo: string | null;
  /** 0–1 */
  confidence: number;
  currency: string;
}

export function ReceiptReviewFields({ form, photo, confidence, currency }: ReceiptReviewFieldsProps) {
  const { colors } = useTheme();
  const categories = useCategories();
  const unsure = confidence < 0.8;
  const tint = unsure ? colors.warning : colors.income;
  const Icon = unsure ? AlertTriangle : CheckCircle2;

  return (
    <View className="gap-8">
      <View className="flex-row items-center gap-4">
        <View className="h-24 w-[72px] overflow-hidden rounded-sm border border-line">
          {photo && photo !== 'sample' ? <Image source={{ uri: photo }} className="flex-1" resizeMode="cover" /> : <SampleReceipt />}
        </View>
        <View className="flex-1 gap-2">
          <Text variant="title">Here's what we found</Text>
          <View
            className="flex-row items-center gap-2 self-start rounded-full px-3 py-1"
            style={{ backgroundColor: withAlpha(tint, 0.14) }}
          >
            <Icon size={14} color={tint} strokeWidth={2.5} />
            <Text variant="caption" weight="bold" style={{ color: tint }}>
              {unsure ? 'Please double-check' : 'Looks clear'}
            </Text>
          </View>
        </View>
      </View>

      <Controller
        control={form.control}
        name="amount"
        render={({ field, fieldState }) => (
          <AmountField value={field.value} onChange={field.onChange} onBlur={field.onBlur} currency={currency} error={fieldState.error?.message} />
        )}
      />
      <FormInput control={form.control} name="merchant" label="Merchant" leftIcon={Store} autoCapitalize="words" />
      <Controller
        control={form.control}
        name="categoryId"
        render={({ field, fieldState }) => (
          <CategoryPicker categories={categories.data} type="expense" value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
        )}
      />
      <Controller control={form.control} name="date" render={({ field }) => <DateField value={field.value} onChange={field.onChange} />} />
    </View>
  );
}
