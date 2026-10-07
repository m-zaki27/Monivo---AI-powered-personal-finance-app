import { CalendarDays } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Chip } from '@/components/ui';
import { addDays, formatShortDate, isSameDay, toDate } from '@/lib/dates';

import { CalendarSheet } from './CalendarSheet';
import { FieldLabel } from './FieldLabel';

/**
 * Keeps the time sensible when only the day changes: today → right now,
 * any other day → noon (so time-zone shifts can't push it to a neighbouring day).
 */
function withSensibleTime(day: Date): string {
  const now = new Date();
  if (isSameDay(day, now)) return now.toISOString();
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12).toISOString();
}

interface DateFieldProps {
  value: string;
  onChange: (iso: string) => void;
}

/** Most entries are today or yesterday, so those are one tap; anything else opens a calendar. */
export function DateField({ value, onChange }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const date = toDate(value);
  const now = new Date();
  const isToday = isSameDay(date, now);
  const isYesterday = isSameDay(date, addDays(now, -1));
  const other = !isToday && !isYesterday;

  return (
    <View className="gap-3">
      <FieldLabel label="Date" />
      <View className="flex-row flex-wrap gap-2">
        <Chip label="Today" selected={isToday} onPress={() => onChange(withSensibleTime(now))} />
        <Chip label="Yesterday" selected={isYesterday} onPress={() => onChange(withSensibleTime(addDays(now, -1)))} />
        <Chip label={other ? formatShortDate(date) : 'Pick a date'} icon={CalendarDays} selected={other} onPress={() => setOpen(true)} />
      </View>
      <CalendarSheet visible={open} onClose={() => setOpen(false)} value={date} onSelect={(d) => onChange(withSensibleTime(d))} />
    </View>
  );
}
