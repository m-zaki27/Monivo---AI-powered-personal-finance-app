import type { Category } from '@/schemas/models';
import type { CategorySpend } from '@/services';
import { categoryColors } from '@/theme/tokens';

export interface Slice {
  key: string;
  label: string;
  color: string;
  value: number;
  /** 0–1 share of the total */
  share: number;
}

/** Top N categories, the rest folded into "Other" so the donut stays readable. */
export function toSlices(byCategory: CategorySpend[], categories: Map<string, Category>, otherColor: string, max = 5): Slice[] {
  const total = byCategory.reduce((s, c) => s + c.total, 0);
  if (total === 0) return [];
  const sorted = [...byCategory].sort((a, b) => b.total - a.total);
  const top = sorted.slice(0, max);
  const rest = sorted.slice(max).reduce((s, c) => s + c.total, 0);

  const slices: Slice[] = top.map((c) => {
    const cat = categories.get(c.categoryId);
    return {
      key: c.categoryId,
      label: cat?.name ?? 'Uncategorized',
      color: cat ? categoryColors[cat.color] : otherColor,
      value: c.total,
      share: c.total / total,
    };
  });
  if (rest > 0) slices.push({ key: 'other', label: 'Everything else', color: otherColor, value: rest, share: rest / total });
  return slices;
}
