import { supabase } from '@/lib/supabase';
import type { User } from '@/schemas/models';

import { ApiError, unwrap } from './errors';
import { getMe } from './user';

// Path avatars/<user id>/<timestamp>.jpg: a fresh name per upload busts image caches.

const BUCKET = 'avatars';

async function userId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new ApiError('Your session ended. Please log in again.', 401);
  return data.user.id;
}

function toBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Best effort: a leftover file is harmless.
async function removeOld(id: string, keep?: string) {
  const { data } = await supabase.storage.from(BUCKET).list(id);
  const old = (data ?? []).map((f) => `${id}/${f.name}`).filter((p) => p !== keep);
  if (old.length) await supabase.storage.from(BUCKET).remove(old);
}

export async function setAvatar(jpegBase64: string): Promise<User> {
  const id = await userId();
  const path = `${id}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, toBytes(jpegBase64), { contentType: 'image/jpeg' });
  if (error) {
    throw new ApiError(
      /exceeded|too large|size/i.test(error.message)
        ? 'That photo is too large. Try another one.'
        : "We couldn't upload your photo. Check your connection and try again.",
      400,
    );
  }
  const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  unwrap(await supabase.from('profiles').update({ avatar_url: url }).eq('id', id).select('id').single());
  void removeOld(id, path).catch(() => undefined);
  return getMe();
}

export async function removeAvatar(): Promise<User> {
  const id = await userId();
  unwrap(await supabase.from('profiles').update({ avatar_url: null }).eq('id', id).select('id').single());
  void removeOld(id).catch(() => undefined);
  return getMe();
}
