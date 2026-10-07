import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { Card, SegmentedControl, Switch, Text } from '@/components/ui';
import { mockConfig } from '@/services';
import { useTheme, type ThemePreference } from '@/theme';

/** App-wide theme preference + mock-server switches for testing states. */
export function ThemeControls() {
  const { preference, setPreference } = useTheme();
  const qc = useQueryClient();
  const [fail, setFail] = useState(mockConfig.failRequests);
  const [slow, setSlow] = useState(mockConfig.latencyMs > 1000);

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
      <ToggleRow
        label="Fail all requests"
        hint="Shows error states on Home"
        value={fail}
        onChange={(v) => {
          mockConfig.failRequests = v;
          setFail(v);
          qc.invalidateQueries();
        }}
      />
      <ToggleRow
        label="Slow network (2.5s)"
        hint="Makes skeletons easy to see"
        value={slow}
        onChange={(v) => {
          mockConfig.latencyMs = v ? 2500 : 450;
          setSlow(v);
          qc.resetQueries();
        }}
      />
    </Card>
  );
}

function ToggleRow({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View className="min-h-11 flex-row items-center justify-between gap-4">
      <View className="flex-1">
        <Text weight="semibold">{label}</Text>
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      </View>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label} />
    </View>
  );
}
