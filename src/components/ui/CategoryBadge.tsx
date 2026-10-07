import {
  Briefcase,
  Car,
  Coffee,
  Film,
  HeartPulse,
  House,
  Plane,
  Repeat,
  Shapes,
  ShoppingBag,
  ShoppingBasket,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { View } from 'react-native';

import { withAlpha } from '@/lib/color';
import type { CategoryIcon } from '@/schemas/models';
import { categoryColors, type CategoryColor } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Data stores an icon *name*; this maps it to a component at render time. */
export const categoryIcons: Record<CategoryIcon, LucideIcon> = {
  coffee: Coffee,
  basket: ShoppingBasket,
  car: Car,
  bag: ShoppingBag,
  film: Film,
  repeat: Repeat,
  zap: Zap,
  heart: HeartPulse,
  home: House,
  plane: Plane,
  briefcase: Briefcase,
  shapes: Shapes,
};

const sizes = { sm: 32, md: 44, lg: 56 } as const;

interface CategoryBadgeProps {
  icon: CategoryIcon;
  color: CategoryColor;
  size?: keyof typeof sizes;
}

/** Category icon inside a tinted circle. */
export function CategoryBadge({ icon, color, size = 'md' }: CategoryBadgeProps) {
  const { isDark } = useTheme();
  const Icon = categoryIcons[icon];
  const hex = categoryColors[color];
  const px = sizes[size];
  return (
    <View
      className="items-center justify-center rounded-full"
      style={{ width: px, height: px, backgroundColor: withAlpha(hex, isDark ? 0.18 : 0.14) }}
    >
      <Icon size={Math.round(px * 0.45)} color={hex} strokeWidth={2} />
    </View>
  );
}
