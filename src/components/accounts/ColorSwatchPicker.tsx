import { Check } from 'lucide-react-native';
import { View } from 'react-native';

import { FieldLabel } from '@/components/add/FieldLabel';
import { PressableScale } from '@/components/ui';
import { categoryColors, palette, type CategoryColor } from '@/theme/tokens';

const swatches = Object.keys(categoryColors) as CategoryColor[];

/** Uses the category palette so nothing off-palette can sneak in. */
export function ColorSwatchPicker({ value, onChange }: { value: CategoryColor; onChange: (c: CategoryColor) => void }) {
  return (
    <View className="gap-3">
      <FieldLabel label="Card colour" />
      <View className="flex-row flex-wrap gap-3" accessibilityRole="radiogroup">
        {swatches.map((c) => {
          const selected = c === value;
          return (
            <PressableScale
              key={c}
              haptic="select"
              onPress={() => onChange(c)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={c}
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: categoryColors[c], borderWidth: selected ? 3 : 0, borderColor: palette.white, boxShadow: selected ? `0px 0px 0px 2px ${categoryColors[c]}` : undefined }}
            >
              {selected && <Check size={18} color={palette.white} strokeWidth={3} />}
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}
