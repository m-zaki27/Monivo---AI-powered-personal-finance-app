import { router } from 'expo-router';
import { FileKey2, LogOut, RotateCcw, ShieldCheck } from 'lucide-react-native';

import { Button, Card, Text } from '@/components/ui';
import { useSession } from '@/hooks';
import { supabase } from '@/lib/supabase';

/** Shortcuts into the auth flows, for testing. Settings has the real entry points. */
export function SessionControls() {
  const { status, user, onboarded, signOut } = useSession();
  const ready = status === 'signedIn' && onboarded;

  return (
    <Card className="gap-3">
      <Text variant="title">Session</Text>
      <Text variant="caption" tone="muted">
        {user ? `${user.email} · ${status}${onboarded ? '' : ' (onboarding)'}` : 'Signed out'}
      </Text>
      {ready && (
        <>
          <Button title="Set up two-step verification" leftIcon={ShieldCheck} variant="secondary" size="sm" onPress={() => router.push('/mfa-setup')} />
          <Button title="Backup codes" leftIcon={FileKey2} variant="secondary" size="sm" onPress={() => router.push('/backup-codes')} />
        </>
      )}
      {user && (
        <Button
          title="Restart onboarding"
          leftIcon={RotateCcw}
          variant="secondary"
          size="sm"
          onPress={() => void supabase.auth.updateUser({ data: { onboarded: false } })}
        />
      )}
      {user && <Button title="Log out" leftIcon={LogOut} variant="danger" size="sm" onPress={() => void signOut()} />}
    </Card>
  );
}
