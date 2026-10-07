import { Info, Search, SearchX } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import { CurrencyRow } from '@/components/onboarding';
import { EmptyState, Header, Input, Screen, Text, useToast } from '@/components/ui';
import { useCurrency, useUpdateMe } from '@/hooks';
import { findCurrency, searchCurrencies } from '@/lib/currencies';
import { closeModal } from '@/lib/navigation';
import { useTheme } from '@/theme';

/** Same list as onboarding; picking one saves straight away. */
export default function SettingsCurrencyScreen() {
  const { colors } = useTheme();
  const current = useCurrency();
  const update = useUpdateMe();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchCurrencies(query), [query]);

  const onSelect = useCallback(
    (code: string) => {
      if (code === current) return closeModal();
      update.mutate(
        { currency: code },
        {
          onSuccess: () => {
            toast.show({ message: `Showing amounts in ${findCurrency(code).name}`, tone: 'success' });
            closeModal();
          },
        },
      );
    },
    [current, update, toast],
  );

  return (
    <Screen header={<Header title="Currency" />}>
      <View className="gap-3 pb-3 pt-2">
        <Input value={query} onChangeText={setQuery} placeholder="Search currency or country" leftIcon={Search} autoCorrect={false} accessibilityLabel="Search currencies" />
        <View className="flex-row items-start gap-2">
          <Info size={14} color={colors.muted} style={{ marginTop: 2 }} />
          <Text variant="caption" tone="muted" className="flex-1">
            This changes how amounts are shown. It doesn't convert amounts you've already added.
          </Text>
        </View>
      </View>
      <FlatList
        data={results}
        keyExtractor={(c) => c.code}
        renderItem={({ item }) => <CurrencyRow currency={item} selected={item.code === current} onSelect={onSelect} />}
        extraData={current}
        className="-mx-2 flex-1"
        contentContainerClassName="gap-1 px-2 pb-6"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={<EmptyState compact icon={SearchX} title="No matches" message={`Nothing found for "${query.trim()}".`} />}
      />
    </Screen>
  );
}
