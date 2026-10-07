import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from 'lucide-react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { FadeInDown, FadeOutDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedView } from '@/lib/animated';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/useTheme';

import { Text } from './Text';

type ToastTone = 'default' | 'success' | 'error' | 'warning';

export interface ToastOptions {
  message: string;
  tone?: ToastTone;
  /** e.g. { label: 'Undo', onPress } */
  action?: { label: string; onPress: () => void };
  /** ms; default 3500 (5000 when there's an action) */
  duration?: number;
}

interface ToastState extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  show: (opts: ToastOptions) => void;
  hide: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

/** Space reserved for the floating tab bar so toasts sit above it. */
const TAB_BAR_CLEARANCE = 96;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback(
    (opts: ToastOptions) => {
      if (timer.current) clearTimeout(timer.current);
      if (opts.tone === 'error') haptics.error();
      else if (opts.tone === 'success') haptics.success();
      setToast({ ...opts, id: Date.now() });
      timer.current = setTimeout(hide, opts.duration ?? (opts.action ? 5000 : 3500));
    },
    [hide],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const value = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="box-none" className="absolute inset-x-0 px-4" style={{ bottom: insets.bottom + TAB_BAR_CLEARANCE }}>
        {toast && <ToastView key={toast.id} toast={toast} onDismiss={hide} />}
      </View>
    </ToastContext.Provider>
  );
}

const toneIcon: Record<ToastTone, LucideIcon> = {
  default: Info,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
};

function ToastView({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  const { colors, shadow } = useTheme();
  const tone = toast.tone ?? 'default';
  const Icon = toneIcon[tone];
  const iconColor = { default: colors.secondary, success: colors.income, error: colors.expense, warning: colors.warning }[tone];

  return (
    <AnimatedView
      entering={FadeInDown.springify().damping(18)}
      exiting={FadeOutDown.duration(180)}
      layout={LinearTransition}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className="min-h-14 flex-row items-center gap-3 rounded-input border border-line bg-raised px-4 py-3"
      style={{ boxShadow: shadow.raised }}
    >
      <Icon size={20} color={iconColor} strokeWidth={2} />
      <Text variant="bodySm" weight="semibold" className="flex-1">
        {toast.message}
      </Text>
      {toast.action && (
        <Pressable
          hitSlop={12}
          accessibilityRole="button"
          onPress={() => {
            toast.action?.onPress();
            onDismiss();
          }}
          className="min-h-11 justify-center px-2"
        >
          <Text variant="bodySm" weight="bold" tone="cobalt">
            {toast.action.label}
          </Text>
        </Pressable>
      )}
    </AnimatedView>
  );
}
