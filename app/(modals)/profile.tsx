import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, User } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { FormError, FormInput } from '@/components/forms';
import { Button, Header, Input, Screen, Skeleton, useToast } from '@/components/ui';
import { useMe, useUpdateMe } from '@/hooks';
import { closeModal } from '@/lib/navigation';
import type { User as UserModel } from '@/schemas/models';

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter your first name').max(30),
  lastName: z.string().trim().max(30),
});
type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfileScreen() {
  const me = useMe();
  return (
    <Screen scroll={!!me.data} header={<Header title="Profile" />} contentClassName="pt-4">
      {me.data ? (
        <ProfileFormBody user={me.data} />
      ) : (
        <View className="gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={56} rounded="rounded-input" />
          ))}
        </View>
      )}
    </Screen>
  );
}

function ProfileFormBody({ user }: { user: UserModel }) {
  const update = useUpdateMe();
  const toast = useToast();
  const { control, handleSubmit, setFocus, formState } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user.firstName, lastName: user.lastName },
    mode: 'onTouched',
  });

  const submit = handleSubmit((v) =>
    update.mutate(
      { firstName: v.firstName.trim(), lastName: v.lastName.trim() },
      {
        onSuccess: () => {
          toast.show({ message: 'Profile updated', tone: 'success' });
          closeModal();
        },
      },
    ),
  );

  return (
    <View className="gap-4">
      <FormInput control={control} name="firstName" label="First name" leftIcon={User} autoComplete="given-name" returnKeyType="next" onSubmitEditing={() => setFocus('lastName')} />
      <FormInput control={control} name="lastName" label="Last name" leftIcon={User} autoComplete="family-name" returnKeyType="done" onSubmitEditing={submit} />
      {/* Changing email needs its own code-confirmation flow; it arrives later. */}
      <Input label="Email" value={user.email} leftIcon={Mail} editable={false} hint="Changing your email is coming soon." />
      <FormError message={update.error?.message} />
      <Button title="Save" loading={update.isPending} disabled={!formState.isDirty} onPress={submit} fullWidth className="mt-2" />
    </View>
  );
}
