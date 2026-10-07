import { Mic, PencilLine, ScanLine, type LucideIcon } from 'lucide-react-native';

export interface AddAction {
  key: 'scan' | 'voice' | 'manual';
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  href: '/scan' | '/voice' | '/add-manual';
}

/**
 * The three ways to add a transaction. Defined once and shared by the tab
 * bar's Add sheet and Home's quick-actions row, so they can never drift apart.
 */
export const addActions: AddAction[] = [
  {
    key: 'scan',
    label: 'Scan Receipt',
    shortLabel: 'Scan Receipt',
    description: 'Snap a photo and we’ll fill in the details.',
    icon: ScanLine,
    href: '/scan',
  },
  {
    key: 'voice',
    label: 'Voice',
    shortLabel: 'Voice',
    description: 'Say it like “$12 lunch at Chipotle”.',
    icon: Mic,
    href: '/voice',
  },
  {
    key: 'manual',
    label: 'Manual',
    shortLabel: 'Add Manually',
    description: 'Type in the amount, category and account.',
    icon: PencilLine,
    href: '/add-manual',
  },
];
