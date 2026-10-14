import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { BasicsSection } from '@/components/dev/BasicsSection';
import { FeedbackSection } from '@/components/dev/FeedbackSection';
import { FormsSection } from '@/components/dev/FormsSection';
import { SessionControls } from '@/components/dev/SessionControls';
import { ThemeControls } from '@/components/dev/ThemeControls';
import { Header, Screen, SegmentedControl, Text } from '@/components/ui';
import { useSession } from '@/hooks';
import { ThemeScope, type ColorSchemeName } from '@/theme';

type Preview = ColorSchemeName | 'both';

/**
 * Hidden component gallery (long-press the logo on Home).
 * Each preview is wrapped in its own <ThemeScope>, so light and dark render
 * side by side regardless of the app's current theme.
 */
export default function DevScreen() {
  const [preview, setPreview] = useState<Preview>('both');
  const schemes: ColorSchemeName[] = preview === 'both' ? ['dark', 'light'] : [preview];
  const { status, onboarded } = useSession();

  // This screen sits outside the route guards, so after "Log out" there may be
  // no history left. Fall back to whichever screen the session allows.
  const leave = () => {
    if (router.canGoBack()) return router.back();
    router.replace(status !== 'signedIn' ? '/welcome' : !onboarded ? '/currency' : '/');
  };

  return (
    <Screen scroll padded={false} header={<Header title="Component gallery" onLeadingPress={leave} />}>
      <View className="gap-4 px-6 pb-4">
        <ThemeControls />
        <SessionControls />
        <SegmentedControl<Preview>
          accessibilityLabel="Preview theme"
          value={preview}
          onChange={setPreview}
          segments={[
            { value: 'both', label: 'Both' },
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
          ]}
        />
      </View>

      {schemes.map((scheme) => (
        <ThemeScope key={scheme} scheme={scheme} className="gap-8 bg-bg px-6 py-8">
          <Text variant="h2">{scheme === 'dark' ? 'Dark theme' : 'Light theme'}</Text>
          <BasicsSection />
          <FormsSection />
          <FeedbackSection />
        </ThemeScope>
      ))}
    </Screen>
  );
}
