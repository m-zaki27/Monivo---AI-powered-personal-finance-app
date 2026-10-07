import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';

import { Header, Screen, Text } from '@/components/ui';
import { AnimatedView } from '@/lib/animated';
import { withAlpha } from '@/lib/color';
import { useTheme } from '@/theme';

interface AuthScaffoldProps {
  title: string;
  subtitle?: ReactNode;
  /** Optional icon shown in a tinted circle above the title */
  icon?: LucideIcon;
  children: ReactNode;
  /** Pinned to the bottom and lifted above the keyboard */
  footer?: ReactNode;
  /** 'back' (default), 'close' for modals, or false */
  leading?: 'back' | 'close' | false;
}

/** Shared layout for every auth / security screen: header, title block, scrollable form, pinned footer. */
export function AuthScaffold({ title, subtitle, icon: Icon, children, footer, leading = 'back' }: AuthScaffoldProps) {
  const { colors } = useTheme();
  return (
    <Screen scroll header={<Header leading={leading} />} footer={footer}>
      <AnimatedView entering={FadeInDown.duration(320)} className="gap-2 pb-8 pt-2">
        {Icon && (
          <View
            className="mb-4 h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: withAlpha(colors.secondary, 0.14) }}
          >
            <Icon size={28} color={colors.secondary} strokeWidth={2} />
          </View>
        )}
        <Text variant="h1">{title}</Text>
        {typeof subtitle === 'string' ? <Text tone="muted">{subtitle}</Text> : subtitle}
      </AnimatedView>
      <AnimatedView entering={FadeInDown.duration(320).delay(80)} className="gap-4">
        {children}
      </AnimatedView>
    </Screen>
  );
}

/** "New to Monivo? Create account" style row under a form. */
export function AuthSwitch({ children }: { children: ReactNode }) {
  return <View className="flex-row flex-wrap items-center justify-center gap-1">{children}</View>;
}
