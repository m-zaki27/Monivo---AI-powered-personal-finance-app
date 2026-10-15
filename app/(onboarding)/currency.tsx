import { router } from 'expo-router';
import { Search, SearchX } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList } from 'react-native';

import { CurrencyRow, OnboardingFrame } from '@/components/onboarding';
import { Button, EmptyState, Input } from '@/components/ui';
import { DEFAULT_CURRENCY } from '@/lib/money';
import { findCurrency, searchCurrencies } from '@/lib/currencies';

export default function CurrencyStep() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(DEFAULT_CURRENCY);
  const results = useMemo(() => searchCurrencies(query), [query]);
  const onSelect = useCallback((code: string) => setSelected(code), []);

  return (
    <OnboardingFrame
      step={1}
      noBack
      title="Pick your currency"
      subtitle="We'll show every amount in it. You can change it later."
      footer={
        <Button
          title={`Continue with ${findCurrency(selected).code}`}
          fullWidth
          onPress={() => router.push({ pathname: '/balance', params: { currency: selected } })}
        />
      }
    >
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder="Search currency or country"
        leftIcon={Search}
        autoCorrect={false}
        clearButtonMode="while-editing"
        returnKeyType="search"
        accessibilityLabel="Search currencies"
      />
      <FlatList
        data={results}
        keyExtractor={(c) => c.code}
        renderItem={({ item }) => <CurrencyRow currency={item} selected={item.code === selected} onSelect={onSelect} />}
        extraData={selected}
        className="-mx-2 mt-4 flex-1"
        contentContainerClassName="gap-1 px-2 pb-4"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        accessibilityRole="radiogroup"
        ListEmptyComponent={
          <EmptyState compact icon={SearchX} title="No matches" message={`Nothing found for "${query.trim()}". Try a code like EUR.`} />
        }
      />
    </OnboardingFrame>
  );
}
