import { Card, SegmentedControl, Text } from '@/components/ui';
import { useTheme, type ThemePreference } from '@/theme';

/** App-wide theme preference, for checking components in both themes. */
export function ThemeControls() {
  const { preference, setPreference } = useTheme();

  return (
    <Card className="gap-4">
      <Text variant="title">App theme</Text>
      <SegmentedControl<ThemePreference>
        accessibilityLabel="Theme"
        value={preference}
        onChange={setPreference}
        segments={[
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
      />
    </Card>
  );
}
