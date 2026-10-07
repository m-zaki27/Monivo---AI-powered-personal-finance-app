import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

/** Height of the floating tab bar + its margin, so content can scroll clear of it. */
export const TAB_BAR_SPACE = 112;

interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView */
  scroll?: boolean;
  /** Fixed header above the scroll area */
  header?: ReactNode;
  /** Fixed footer (e.g. a primary button), lifted with the keyboard */
  footer?: ReactNode;
  /** Adds bottom room for the floating tab bar */
  withTabBar?: boolean;
  /** Horizontal padding (24px). Default true */
  padded?: boolean;
  /** Skip the top safe-area inset (e.g. under a native header) */
  noTopInset?: boolean;
  refreshControl?: ScrollViewProps['refreshControl'];
  className?: string;
  contentClassName?: string;
}

/**
 * Base layout for every screen: background, safe areas, keyboard handling.
 * KeyboardAvoidingView on iOS only — Android resizes the window itself.
 */
export function Screen({
  children,
  scroll,
  header,
  footer,
  withTabBar,
  padded = true,
  noTopInset,
  refreshControl,
  className,
  contentClassName,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = withTabBar ? insets.bottom + TAB_BAR_SPACE : footer ? 16 : insets.bottom + 24;
  const px = padded ? 'px-6' : '';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className={cn('flex-1 bg-bg', className)}
      style={{ paddingTop: noTopInset ? 0 : insets.top }}
    >
      {header && <View className={px}>{header}</View>}
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={cn(px, contentClassName)}
          contentContainerStyle={{ paddingBottom: bottomPad }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View className={cn('flex-1', px, contentClassName)} style={{ paddingBottom: footer ? 0 : bottomPad }}>
          {children}
        </View>
      )}
      {footer && (
        <View className={cn(px, 'pt-2')} style={{ paddingBottom: insets.bottom + 16 }}>
          {footer}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
