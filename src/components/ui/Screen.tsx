import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

import { Ambient } from './Ambient';

/** Height of the floating tab bar + its margin, so content can scroll clear of it. */
export const TAB_BAR_SPACE = 112;

/** Max content width, so tablets/landscape get a centred column instead of edge-to-edge. */
export const MAX_CONTENT_WIDTH = 720;
const column = { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' } as const;

interface ScreenProps {
  children: ReactNode;
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
  /** No bottom padding; the child (e.g. FlatList) pads itself to scroll under the tab bar */
  noBottomInset?: boolean;
  refreshControl?: ScrollViewProps['refreshControl'];
  className?: string;
  contentClassName?: string;
}

/** Base screen layout. KeyboardAvoidingView on iOS only — Android resizes the window itself. */
export function Screen({
  children,
  scroll,
  header,
  footer,
  withTabBar,
  padded = true,
  noTopInset,
  noBottomInset,
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
      <Ambient />
      {header && (
        <View className={px} style={column}>
          {header}
        </View>
      )}
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={cn(px, contentClassName)}
          contentContainerStyle={[column, { paddingBottom: bottomPad }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View className={cn('flex-1', px, contentClassName)} style={[column, { paddingBottom: footer || noBottomInset ? 0 : bottomPad }]}>
          {children}
        </View>
      )}
      {footer && (
        <View className={cn(px, 'pt-2')} style={[column, { paddingBottom: insets.bottom + 16 }]}>
          {footer}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
