import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { BottomSheet, IconButton, Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/cn';
import { daysInMonth, formatMonth, isSameDay, startOfDay, startOfMonth } from '@/lib/dates';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface CalendarSheetProps {
  visible: boolean;
  onClose: () => void;
  value: Date;
  onSelect: (d: Date) => void;
}

/** Month grid in a sheet; future days are disabled. */
export function CalendarSheet({ visible, onClose, value, onSelect }: CalendarSheetProps) {
  const today = startOfDay(new Date());
  const [month, setMonth] = useState(() => startOfMonth(value));
  const isCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  const leading = month.getDay(); // blank cells before the 1st
  const cells: (Date | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth(month) }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];

  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Pick a date">
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <IconButton icon={ChevronLeft} accessibilityLabel="Previous month" variant="ghost" onPress={() => shift(-1)} />
          <Text variant="title">{formatMonth(month)}</Text>
          <IconButton icon={ChevronRight} accessibilityLabel="Next month" variant="ghost" disabled={isCurrentMonth} className={isCurrentMonth ? 'opacity-30' : undefined} onPress={() => shift(1)} />
        </View>
        <View className="flex-row">
          {WEEKDAYS.map((d, i) => (
            <Text key={i} variant="caption" tone="muted" center className="flex-1">
              {d}
            </Text>
          ))}
        </View>
        <View className="flex-row flex-wrap">
          {cells.map((d, i) => {
            if (!d) return <View key={`b${i}`} className="aspect-square w-[14.28%]" />;
            const future = d > today;
            const selected = isSameDay(d, value);
            const isToday = isSameDay(d, today);
            return (
              <View key={d.getDate()} className="aspect-square w-[14.28%] p-0.5">
                <Pressable
                  disabled={future}
                  onPress={() => {
                    haptics.select();
                    onSelect(d);
                    onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled: future }}
                  accessibilityLabel={d.toDateString()}
                  className={cn(
                    'flex-1 items-center justify-center rounded-full',
                    selected && 'bg-cobalt',
                    !selected && isToday && 'border border-cobalt',
                    future && 'opacity-30',
                  )}
                >
                  <Text variant="bodySm" weight={selected || isToday ? 'bold' : 'medium'} tone={selected ? 'white' : 'default'} style={{ fontVariant: ['tabular-nums'] }}>
                    {d.getDate()}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    </BottomSheet>
  );
}
