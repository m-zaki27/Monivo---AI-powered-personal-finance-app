import { KeyRound } from 'lucide-react-native';

import { EmptyState, Screen, Text } from '@/components/ui';

/** Shown instead of the app when the Supabase keys are missing, so a blank screen never hides the cause. */
export function SetupNeeded() {
  return (
    <Screen contentClassName="justify-center gap-4">
      <EmptyState
        icon={KeyRound}
        title="Connect Supabase"
        message="Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server."
      />
      <Text variant="caption" tone="muted" center>
        See .env.example for the format.
      </Text>
    </Screen>
  );
}
