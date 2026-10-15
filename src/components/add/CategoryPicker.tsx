import { View } from 'react-native';

import { CategoryBadge, PressableScale, Skeleton, Text } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Category, TransactionType } from '@/schemas/models';

import { FieldLabel } from './FieldLabel';

interface CategoryPickerProps {
  categories: Category[] | undefined;
  /** Only categories of this kind are offered */
  type: TransactionType;
  value: string;
  onChange: (id: string) => void;
  error?: string;
}

/** 3-column badge grid; every option visible at once. */
export function CategoryPicker({ categories, type, value, onChange, error }: CategoryPickerProps) {
  const options = categories?.filter((c) => c.kind === type);
  return (
    <View className="gap-3">
      <FieldLabel label="Category" error={error} />
      <View className="-mx-1 flex-row flex-wrap" accessibilityRole="radiogroup">
        {!options
          ? Array.from({ length: 9 }, (_, i) => (
              <View key={i} className="w-1/3 items-center gap-2 p-1 py-2">
                <Skeleton width={44} height={44} rounded="rounded-full" />
                <Skeleton width={48} height={10} />
              </View>
            ))
          : options.map((c) => {
              const selected = c.id === value;
              return (
                <View key={c.id} className="w-1/3 p-1">
                  <PressableScale
                    haptic="select"
                    onPress={() => onChange(c.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={c.name}
                    className={cn(
                      'min-h-[84px] items-center gap-2 rounded-input border px-2 py-2',
                      selected ? 'border-cobalt bg-raised' : 'border-transparent',
                    )}
                  >
                    <CategoryBadge icon={c.icon} color={c.color} />
                    <Text variant="caption" weight={selected ? 'bold' : 'semibold'} center numberOfLines={1}>
                      {c.name}
                    </Text>
                  </PressableScale>
                </View>
              );
            })}
      </View>
    </View>
  );
}
