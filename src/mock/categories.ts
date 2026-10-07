import type { Category } from '@/schemas/models';

export const mockCategories: Category[] = [
  { id: 'cat_food', name: 'Food & Drink', icon: 'coffee', color: 'amber', kind: 'expense' },
  { id: 'cat_groceries', name: 'Groceries', icon: 'basket', color: 'teal', kind: 'expense' },
  { id: 'cat_transport', name: 'Transport', icon: 'car', color: 'cobalt', kind: 'expense' },
  { id: 'cat_shopping', name: 'Shopping', icon: 'bag', color: 'rose', kind: 'expense' },
  { id: 'cat_entertainment', name: 'Entertainment', icon: 'film', color: 'pink', kind: 'expense' },
  { id: 'cat_subscriptions', name: 'Subscriptions', icon: 'repeat', color: 'orange', kind: 'expense' },
  { id: 'cat_bills', name: 'Bills & Utilities', icon: 'zap', color: 'gold', kind: 'expense' },
  { id: 'cat_health', name: 'Health', icon: 'heart', color: 'sky', kind: 'expense' },
  { id: 'cat_rent', name: 'Rent', icon: 'home', color: 'steel', kind: 'expense' },
  { id: 'cat_travel', name: 'Travel', icon: 'plane', color: 'teal', kind: 'expense' },
  { id: 'cat_other', name: 'Other', icon: 'shapes', color: 'tan', kind: 'expense' },
  { id: 'cat_salary', name: 'Salary', icon: 'briefcase', color: 'sky', kind: 'income' },
];
