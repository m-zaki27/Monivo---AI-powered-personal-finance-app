import { Sparkles } from 'lucide-react-native';
import { ScrollView } from 'react-native';

import { Chip } from '@/components/ui';

/** Tap-to-ask prompts. Horizontal so they never push the conversation up. */
export function SuggestionChips({ prompts, onPick, disabled }: { prompts: string[]; onPick: (p: string) => void; disabled?: boolean }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-6" keyboardShouldPersistTaps="handled">
      {prompts.map((p) => (
        <Chip key={p} label={p} icon={Sparkles} onPress={disabled ? undefined : () => onPick(p)} />
      ))}
    </ScrollView>
  );
}
