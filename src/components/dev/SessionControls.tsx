import { router } from 'expo-router';
import { FileKey2, LogOut, RotateCcw, ShieldCheck } from 'lucide-react-native';

import { Button, Card, Text } from '@/components/ui';
import { useSession } from '@/hooks';

/** Shortcuts into the auth flows until Settings (Phase 7) has the real entry points. */
export function SessionControls() {
  const { session, signIn, signOut } = useSession();
  const ready = !!session?.onboarded;

  return (
    <Card className="gap-3">
      <Text variant="title">Session</Text>
      <Text variant="caption" tone="muted">
        {session ? `Signed in${session.onboarded ? '' : ' (onboarding)'}` : 'Signed out'}
      </Text>
      {ready && (
        <>
          <Button title="Set up two-step verification" leftIcon={ShieldCheck} variant="secondary" size="sm" onPress={() => router.push('/mfa-setup')} />
          <Button title="View backup codes" leftIcon={FileKey2} variant="secondary" size="sm" onPress={() => router.push('/backup-codes')} />
        </>
      )}
      {session && (
        <Button
          title="Restart onboarding"
          leftIcon={RotateCcw}
          variant="secondary"
          size="sm"
          onPress={() => signIn({ ...session, onboarded: false })}
        />
      )}
      {session && <Button title="Log out" leftIcon={LogOut} variant="danger" size="sm" onPress={signOut} />}
    </Card>
  );
}
