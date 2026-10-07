import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { IconButton, Screen, Text } from '@/components/ui';

import { ProgressDots } from './ProgressDots';

interface OnboardingFrameProps {
  /** 1-based; 4 = finished (all dots done) */
  step: number;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Hide the back arrow (first and last steps) */
  noBack?: boolean;
}

/** Progress dots across the top, optional title block, fixed footer. */
export function OnboardingFrame({ step, title, subtitle, children, footer, noBack }: OnboardingFrameProps) {
  return (
    <Screen
      footer={footer}
      header={
        <View className="h-14 flex-row items-center justify-between">
          <View className="w-12">
            {!noBack && router.canGoBack() && (
              <IconButton icon={ChevronLeft} accessibilityLabel="Go back" onPress={() => router.back()} />
            )}
          </View>
          <ProgressDots step={step} />
          <View className="w-12" />
        </View>
      }
    >
      {title && (
        <View className="gap-2 pb-6 pt-4">
          <Text variant="h1">{title}</Text>
          {subtitle && <Text tone="muted">{subtitle}</Text>}
        </View>
      )}
      {children}
    </Screen>
  );
}
