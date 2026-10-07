import { ArrowRight, Copy, Plus, Settings, Trash2 } from 'lucide-react-native';
import { View } from 'react-native';

import { Button, Card, IconButton, Logo, Money, Text } from '@/components/ui';

import { DevSection, Row } from './DevSection';

export function BasicsSection() {
  return (
    <>
      <DevSection title="Logo">
        <Row>
          <Logo size={48} />
          <Logo size={32} withWordmark />
        </Row>
      </DevSection>

      <DevSection title="Typography">
        <Money cents={1_284_550} variant="balanceXl" splitCents />
        <Money cents={842_19} variant="balance" />
        <Text variant="h1">Heading one</Text>
        <Text variant="h2">Heading two</Text>
        <Text variant="title">Title text</Text>
        <Text>Body — short, friendly, plain-spoken.</Text>
        <Text variant="bodySm" tone="muted">
          Small muted body text
        </Text>
        <Text variant="caption" tone="cobalt">
          Caption link
        </Text>
        <Row>
          <Money cents={2_850_00} signed tone="income" />
          <Money cents={-64_50} colorBySign />
          <Money cents={12_34} hidden />
        </Row>
      </DevSection>

      <DevSection title="Buttons">
        <Button title="Continue" rightIcon={ArrowRight} />
        <Button title="Secondary" variant="secondary" />
        <Row>
          <Button title="Outline" variant="outline" size="md" />
          <Button title="Ghost link" variant="ghost" size="md" />
        </Row>
        <Row>
          <Button title="Delete" variant="danger" size="sm" leftIcon={Trash2} />
          <Button title="Saving" size="sm" loading />
          <Button title="Disabled" size="sm" disabled />
        </Row>
        <Row>
          <IconButton icon={Settings} accessibilityLabel="Settings" />
          <IconButton icon={Copy} accessibilityLabel="Copy" variant="ghost" />
          <IconButton icon={Plus} accessibilityLabel="Add" variant="gold" size={56} />
        </Row>
      </DevSection>

      <DevSection title="Cards">
        <Card>
          <Text variant="title">Surface card</Text>
          <Text variant="bodySm" tone="muted">
            24px radius, hairline border, tinted shadow.
          </Text>
        </Card>
        <View className="flex-row gap-3">
          <Card variant="raised" padding="sm" className="flex-1">
            <Text weight="semibold">Raised</Text>
          </Card>
          <Card padding="sm" className="flex-1" onPress={() => {}} accessibilityLabel="Pressable card">
            <Text weight="semibold">Pressable</Text>
          </Card>
        </View>
      </DevSection>
    </>
  );
}
