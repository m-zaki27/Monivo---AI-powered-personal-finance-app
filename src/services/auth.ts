import { isAuthApiError, isAuthError, type AuthError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

import { ApiError } from './errors';

/**
 * Real authentication on Supabase Auth. Function names and return shapes match
 * the old mock, so hooks and screens barely changed. Supabase errors are
 * translated into friendly ApiErrors; `field` puts a message under the input
 * it belongs to (see applyApiError).
 */

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

/** Supabase calls return either `{ data, error: null }` or `{ data: null, error }`. */
type Result = { data: unknown; error: AuthError | null };
/** The data type of the success branch only. */
type Ok<R extends Result> = Extract<R, { error: null }>['data'];

/** Unwraps that into "return data or throw a friendly error". */
function check<R extends Result>(result: R): Ok<R> {
  if (result.error) throw toApiError(result.error);
  return result.data as Ok<R>;
}

/** True when the user has two-step verification on but hasn't entered a code this session. */
export async function needsMfa(): Promise<boolean> {
  const aal = check(await supabase.auth.mfa.getAuthenticatorAssuranceLevel());
  return aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2';
}

// --- Sign up & email codes ---

export async function signUp(input: { name: string; email: string; password: string }) {
  const [firstName = '', ...rest] = input.name.trim().split(/\s+/);
  const data = check(
    await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { first_name: firstName, last_name: rest.join(' ') } },
    }),
  );
  // With email confirmation on, signing up with an existing email "succeeds"
  // but returns a user with no identities and sends nothing. We say so plainly;
  // the trade-off is that this reveals whether an email has an account.
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

/** Confirms the sign-up code. Supabase then signs the user in; the session listener does the rest. */
export async function verifyEmail(input: { email: string; code: string }) {
  check(await supabase.auth.verifyOtp({ email: input.email, token: input.code, type: 'signup' }));
}

// --- Log in ---

export type LogInResult = { status: 'ok' } | { status: 'mfa_required' } | { status: 'unconfirmed' };

export async function logIn(input: { email: string; password: string }): Promise<LogInResult> {
  const { error } = await supabase.auth.signInWithPassword(input);
  if (error?.code === 'email_not_confirmed') {
    // Send a fresh code so the verify screen has something to check.
    await supabase.auth.resend({ type: 'signup', email: input.email });
    return { status: 'unconfirmed' };
  }
  if (error) throw toApiError(error);
  return (await needsMfa()) ? { status: 'mfa_required' } : { status: 'ok' };
}

/** Second login step: an authenticator code, or one of the backup codes. */
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

// --- Forgot password ---

export async function requestPasswordReset(email: string) {
  check(await supabase.auth.resetPasswordForEmail(email));
  return { sentTo: email };
}

/** Checking the reset code signs the user in, so they're allowed to set a new password. */
export async function verifyResetCode(input: { email: string; code: string }) {
  check(await supabase.auth.verifyOtp({ email: input.email, token: input.code, type: 'recovery' }));
  return { needsMfa: await needsMfa() };
}

export async function resetPassword(password: string) {
  check(await supabase.auth.updateUser({ password }));
}

// --- Two-step verification ---

export interface MfaSetup {
  factorId: string;
  /** SVG markup of the QR code */
  qrSvg: string;
  secret: string;
  /** otpauth:// URI the QR encodes */
  uri: string;
}

export async function startMfaSetup(): Promise<MfaSetup> {
  // An abandoned earlier attempt leaves an unverified factor behind; clear it first.
  const factors = check(await supabase.auth.mfa.listFactors());
  for (const f of factors.all) {
    if (f.factor_type === 'totp' && f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const data = check(await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator app' }));
  return { factorId: data.id, qrSvg: data.totp.qr_code, secret: data.totp.secret, uri: data.totp.uri };
}

/** "K4M9X7QP2AB8HT3Z" → "K4M9-X7QP-2AB8-HT3Z": easier to copy onto paper. */
const formatCode = (code: string) => (code.toUpperCase().match(/.{1,4}/g) ?? [code]).join('-');

export type BackupCodesResult = { codes: string[] } | { codes: null; reason: 'not_enabled' };

function codesOrUnavailable(result: { data: { codes: string[] } | null; error: AuthError | null }): BackupCodesResult {
  if (result.error?.code?.includes('not_enabled')) return { codes: null, reason: 'not_enabled' };
  if (result.error) throw toApiError(result.error);
  if (!result.data) throw new ApiError("We couldn't create backup codes. Please try again.", 500);
  return { codes: result.data.codes.map(formatCode) };
}

/** Verifies the first code (turning two-step on), then issues backup codes. */
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

/** New set; the old codes stop working immediately. */
export async function regenerateBackupCodes(): Promise<BackupCodesResult> {
  const result = await supabase.auth.mfa.recoveryCodes.regenerate();
  if (result.error?.code === 'mfa_factor_not_found') {
    return codesOrUnavailable(await supabase.auth.mfa.recoveryCodes.generate({ friendlyName: 'Backup codes' }));
  }
  return codesOrUnavailable(result);
}

export async function disableMfa() {
  // Backup codes can't outlive the authenticator, so they go first.
  const codes = await supabase.auth.mfa.recoveryCodes.unenroll();
  if (codes.error && codes.error.code !== 'mfa_factor_not_found' && !codes.error.code?.includes('not_enabled')) {
    throw toApiError(codes.error);
  }
  const factors = check(await supabase.auth.mfa.listFactors());
  for (const f of factors.totp) check(await supabase.auth.mfa.unenroll({ factorId: f.id }));
  // Refresh so the session no longer claims a second factor.
  await supabase.auth.refreshSession();
}

// --- Account ---

export async function logOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw toApiError(error);
}

/** Deleting an auth user needs admin rights, so it runs in a server-side Edge Function. */
export async function deleteAccount() {
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) throw new ApiError("We couldn't delete your account. Please try again.", 500);
  await supabase.auth.signOut({ scope: 'local' });
}
