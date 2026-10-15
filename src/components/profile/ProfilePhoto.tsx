import { Camera } from 'lucide-react-native';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Avatar, TextLink, useToast } from '@/components/ui';
import { useRemoveAvatar, useSetAvatar } from '@/hooks';
import { pickProfilePhoto } from '@/lib/pickPhoto';
import type { User } from '@/schemas/models';
import { useTheme } from '@/theme';

const SIZE = 104;

export function ProfilePhoto({ user }: { user: User }) {
  const { colors } = useTheme();
  const toast = useToast();
  const setAvatar = useSetAvatar();
  const removeAvatar = useRemoveAvatar();
  const busy = setAvatar.isPending || removeAvatar.isPending;

  const choose = async () => {
    if (busy) return;
    try {
      const photo = await pickProfilePhoto();
      if (!photo) return;
      await setAvatar.mutateAsync(photo);
      toast.show({ message: 'Photo updated', tone: 'success' });
    } catch (e) {
      toast.show({ message: e instanceof Error ? e.message : "We couldn't update your photo.", tone: 'error' });
    }
  };

  const remove = () =>
    removeAvatar.mutate(undefined, {
      onSuccess: () => toast.show({ message: 'Photo removed', tone: 'success' }),
      onError: (e) => toast.show({ message: e.message, tone: 'error' }),
    });

  return (
    <View className="items-center gap-2 pb-2">
      <Pressable
        onPress={choose}
        accessibilityRole="button"
        accessibilityLabel={user.avatarUrl ? 'Change profile photo' : 'Add profile photo'}
        accessibilityState={{ busy }}
      >
        <Avatar user={user} size={SIZE} />
        {busy && (
          <View className="absolute inset-0 items-center justify-center rounded-full bg-scrim">
            <ActivityIndicator color={colors.text} />
          </View>
        )}
        <View
          className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full border-2 bg-gold"
          style={{ borderColor: colors.bg }}
        >
          <Camera size={17} color={colors.onPrimary} strokeWidth={2.2} />
        </View>
      </Pressable>
      <View className="flex-row items-center gap-5">
        <TextLink label={user.avatarUrl ? 'Change photo' : 'Add photo'} onPress={choose} disabled={busy} />
        {user.avatarUrl && <TextLink label="Remove photo" onPress={remove} disabled={busy} />}
      </View>
    </View>
  );
}
