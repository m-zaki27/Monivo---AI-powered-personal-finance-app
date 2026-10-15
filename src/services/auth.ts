import { isAuthApiError, isAuthError, type AuthError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

import { ApiError } from './errors';

const messages: Record<string, { message: string; field?: string }> = {
  invalid_credentials: { message: "That email and password don't match. Try again or reset your password." },
  user_already_exists: { message: 'An account with this email already exists. Try logging in.', field: 'email' },
  email_exists: { message: 'An account with this email already exists. Try logging in.', field: 'email' },
  weak_password: { message: 'Pick a stronger password: at least 8 characters, with a letter and a number.', field: 'password' },
  same_password: { message: 'Choose a password you haven’t used for this account before.', field: 'password' },
  otp_expired: { message: 'That code is wrong or has expired. Check it, or ask for a new one.', field: 'code' },
  mfa_verification_failed: { message: "That code isn't right. Check your authenticator app and try again.", field: 'code' },
  mfa_recovery_codes_locked: { message: 'Too many wrong backup codes. Wait a few minutes, then try again.' },
  over_email_send_rate_limit: { message: 'We just sent you an email. Wait a minute before asking for another.' },
  over_request_rate_limit: { message: 'Too many attempts. Wait a minute, then try again.' },
  email_address_not_authorized: {
    message: "We can't send email to this address yet. The app's email sender isn't set up for public use.",
    field: 'email',
  },
};

function toApiError(error: AuthError): ApiError {
  const known = error.code ? messages[error.code] : undefined;
  if (known) return new ApiError(known.message, error.status ?? 400, known.field);
  // Network failures come through as non-API auth errors.
  if (isAuthError(error) && !isAuthApiError(error)) {
    return new ApiError("We couldn't reach Monivo. Check your connection and try again.", 0);
  }
  return new ApiError(error.message || 'Something went wrong. Please try again.', error.status ?? 500);
}

type Result = { data: unknown; error: AuthError | null };
type Ok<R extends Result> = Extract<R, { error: null }>['data'];

function check<R extends Result>(result: R): Ok<R> {
  if (result.error) throw toApiError(result.error);
  return result.data as Ok<R>;
}

/** MFA is enrolled but not yet verified this session. */
export async function needsMfa(): Promise<boolean> {
  const aal = check(await supabase.auth.mfa.getAuthenticatorAssuranceLevel());
  return aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2';
}

export async function signUp(input: { name: string; email: string; password: string }) {
  const [firstName = '', ...rest] = input.name.trim().split(/\s+/);
  const data = check(
    await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { first_name: firstName, last_name: rest.join(' ') } },
    }),
  );
  // Existing emails "succeed" with no identities and no email sent. Surfacing this
  // reveals that the account exists; accepted trade-off for clearer UX.
  if (data.user && data.user.identities?.length === 0) {
    throw new ApiError(messages.user_already_exists!.message, 409, 'email');
  }
  return { sentTo: input.email, needsVerification: !data.session };
}

export type CodePurpose = 'signup' | 'reset';

export async function resendCode(input: { email: string; purpose: CodePurpose }) {
  if (input.purpose === 'reset') check(await supabase.auth.resetPasswordForEmail(input.email));
  else check(await supabase.auth.resend({ type: 'signup', email: input.email }));
  return { sentTo: input.email };
}

/** Signs the user in on success; the session listener handles routing. */
export async function verifyEmail(input: { email: string; code: string }) {
  check(await supabase.auth.verifyOtp({ email: input.email, token: input.code, type: 'signup' }));
}

export type LogInResult = { status: 'ok' } | { status: 'mfa_required' } | { status: 'unconfirmed' };

export async function logIn(input: { email: string; password: string }): Promise<LogInResult> {
  const { error } = await supabase.auth.signInWithPassword(input);
  if (error?.code === 'email_not_confirmed') {
    await supabase.auth.resend({ type: 'signup', email: input.email });
    return { status: 'unconfirmed' };
  }
  if (error) throw toApiError(error);
  return (await needsMfa()) ? { status: 'mfa_required' } : { status: 'ok' };
}

export async function verifyMfa(input: { code: string; method: 'totp' | 'backup' }) {
  if (input.method === 'backup') {
    check(await supabase.auth.mfa.recoveryCodes.verify({ code: input.code }));
    return;
  }
  const factors = check(await supabase.auth.mfa.listFactors());
  const factor = factors.totp[0];
  if (!factor) throw new ApiError('Two-step verification is no longer set up. Log in again.', 404);
  check(await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: input.code }));
}

export async function requestPasswordReset(email: string) {
  check(await supabase.auth.resetPasswordForEmail(email));
  return { sentTo: email };
}

/** A valid reset code signs the user in so they can set a new password. */
export async function verifyResetCode(input: { email: string; code: string }) {
  check(await supabase.auth.verifyOtp({ email: input.email, token: input.code, type: 'recovery' }));
  return { needsMfa: await needsMfa() };
}

export async function resetPassword(password: string) {
  check(await supabase.auth.updateUser({ password }));
}

export interface MfaSetup {
  factorId: string;
  qrSvg: string;
  secret: string;
  /** otpauth:// URI */
  uri: string;
}

export async function startMfaSetup(): Promise<MfaSetup> {
  // Clear unverified factors left by abandoned attempts.
  const factors = check(await supabase.auth.mfa.listFactors());
  for (const f of factors.all) {
    if (f.factor_type === 'totp' && f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const data = check(await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator app' }));
  return { factorId: data.id, qrSvg: data.totp.qr_code, secret: data.totp.secret, uri: data.totp.uri };
}

/** "K4M9X7QP2AB8HT3Z" → "K4M9-X7QP-2AB8-HT3Z" */
const formatCode = (code: string) => (code.toUpperCase().match(/.{1,4}/g) ?? [code]).join('-');

export type BackupCodesResult = { codes: string[] } | { codes: null; reason: 'not_enabled' };

function codesOrUnavailable(result: { data: { codes: string[] } | null; error: AuthError | null }): BackupCodesResult {
  if (result.error?.code?.includes('not_enabled')) return { codes: null, reason: 'not_enabled' };
  if (result.error) throw toApiError(result.error);
  if (!result.data) throw new ApiError("We couldn't create backup codes. Please try again.", 500);
  return { codes: result.data.codes.map(formatCode) };
}

/** Verifies the first code to enable MFA, then issues backup codes. */
export async function confirmMfaSetup(input: { factorId: string; code: string }): Promise<BackupCodesResult> {
  check(await supabase.auth.mfa.challengeAndVerify({ factorId: input.factorId, code: input.code }));
  return codesOrUnavailable(await supabase.auth.mfa.recoveryCodes.generate({ friendlyName: 'Backup codes' }));
}

export type BackupCodesStatus = { total: number; remaining: number } | { total: 0; remaining: 0; missing: true };

export async function getBackupCodesStatus(): Promise<BackupCodesStatus> {
  const result = await supabase.auth.mfa.recoveryCodes.getStatus();
  const code = result.error?.code;
  if (code === 'mfa_factor_not_found' || code?.includes('not_enabled')) return { total: 0, remaining: 0, missing: true };
  const data = check(result);
  return { total: data.total, remaining: data.remaining };
}

/** Old codes stop working immediately. */
export async function regenerateBackupCodes(): Promise<BackupCodesResult> {
  const result = await supabase.auth.mfa.recoveryCodes.regenerate();
  if (result.error?.code === 'mfa_factor_not_found') {
    return codesOrUnavailable(await supabase.auth.mfa.recoveryCodes.generate({ friendlyName: 'Backup codes' }));
  }
  return codesOrUnavailable(result);
}

export async function disableMfa() {
  // Remove backup codes first; they can't outlive the TOTP factor.
  const codes = await supabase.auth.mfa.recoveryCodes.unenroll();
  if (codes.error && codes.error.code !== 'mfa_factor_not_found' && !codes.error.code?.includes('not_enabled')) {
    throw toApiError(codes.error);
  }
  const factors = check(await supabase.auth.mfa.listFactors());
  for (const f of factors.totp) check(await supabase.auth.mfa.unenroll({ factorId: f.id }));
  // Refresh so the token drops its aal2 claim.
  await supabase.auth.refreshSession();
}

// double_confirm_changes sends a code to both addresses, so a stolen phone can't hijack the account.
export async function requestEmailChange(newEmail: string) {
  check(await supabase.auth.updateUser({ email: newEmail }));
  return { newEmail };
}

export async function resendEmailChange(newEmail: string) {
  check(await supabase.auth.resend({ type: 'email_change', email: newEmail }));
}

/** `email` is the address this code was sent to. */
export async function verifyEmailChange(input: { email: string; code: string }) {
  check(await supabase.auth.verifyOtp({ email: input.email, token: input.code, type: 'email_change' }));
}

export async function logOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw toApiError(error);
}

// Needs admin rights, so it runs in an Edge Function.
export async function deleteAccount() {
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) throw new ApiError("We couldn't delete your account. Please try again.", 500);
  await supabase.auth.signOut({ scope: 'local' });
}
