import type { Session } from '@/schemas/auth';

import { ApiError, db, newId, respond } from './mockServer';

/**
 * Mock auth API. Rules so every state can be tested by hand:
 * - Any 6-digit code works, except 000000 (always "wrong").
 * - Logging in with the password "wrongpass1" fails; any other password works.
 * - Signing up with taken@example.com fails ("already exists").
 * - Backup codes are real: each one works once.
 */

const WRONG_CODE = '000000';
const WRONG_PASSWORD = 'wrongpass1';
const TAKEN_EMAIL = 'taken@example.com';

const isValidCode = (code: string) => /^\d{6}$/.test(code) && code !== WRONG_CODE;
const badCode = () => new ApiError("That code isn't right. Check it and try again.", 400, 'code');
const newSession = (onboarded: boolean): Session => ({ token: newId('tok'), onboarded });

// In-flight flows a real server would keep per request.
let pendingSignUp: { name: string; email: string } | null = null;
let pendingMfaSecret: string | null = null;
const mfaChallenges = new Set<string>();
const resetTokens = new Set<string>();

export type LogInResult =
  | { status: 'ok'; session: Session }
  | { status: 'mfa_required'; challengeId: string };

export function signUp(input: { name: string; email: string; password: string }) {
  return respond(() => {
    if (input.email.toLowerCase() === TAKEN_EMAIL) {
      throw new ApiError('An account with this email already exists. Try logging in.', 409, 'email');
    }
    pendingSignUp = { name: input.name, email: input.email };
    return { sentTo: input.email };
  });
}

export function resendCode(email: string) {
  return respond(() => ({ sentTo: email }));
}

/** Confirms the sign-up email and starts a session (not onboarded yet). */
export function verifyEmail(input: { email: string; code: string }) {
  return respond(() => {
    if (!isValidCode(input.code)) throw badCode();
    if (pendingSignUp) {
      const [firstName = '', ...rest] = pendingSignUp.name.split(' ');
      db.user = { ...db.user, firstName, lastName: rest.join(' '), email: pendingSignUp.email, mfaEnabled: false };
      db.auth = { mfaSecret: null, backupCodes: [] };
      pendingSignUp = null;
    }
    return newSession(false);
  });
}

export function logIn(input: { email: string; password: string }) {
  return respond<LogInResult>(() => {
    if (input.password === WRONG_PASSWORD) {
      throw new ApiError("That email and password don't match. Try again or reset your password.", 401);
    }
    if (db.user.mfaEnabled) {
      const challengeId = newId('mfa');
      mfaChallenges.add(challengeId);
      return { status: 'mfa_required', challengeId };
    }
    return { status: 'ok', session: newSession(true) };
  });
}

/** Second login step: an authenticator code or a one-time backup code. */
export function verifyMfa(input: { challengeId: string; code: string; method: 'totp' | 'backup' }) {
  return respond(() => {
    if (!mfaChallenges.has(input.challengeId)) {
      throw new ApiError('This sign-in expired. Go back and log in again.', 410);
    }
    if (input.method === 'backup') {
      const normalized = normalizeBackupCode(input.code);
      const index = db.auth.backupCodes.indexOf(normalized);
      if (index < 0) throw new ApiError("That backup code isn't valid or was already used.", 400, 'code');
      db.auth.backupCodes.splice(index, 1);
    } else if (!isValidCode(input.code)) {
      throw badCode();
    }
    mfaChallenges.delete(input.challengeId);
    return newSession(true);
  });
}

export function requestPasswordReset(email: string) {
  // Real APIs answer the same way whether or not the email exists,
  // so attackers can't use this form to discover accounts.
  return respond(() => ({ sentTo: email }));
}

export function verifyResetCode(input: { email: string; code: string }) {
  return respond(() => {
    if (!isValidCode(input.code)) throw badCode();
    const resetToken = newId('rst');
    resetTokens.add(resetToken);
    return { resetToken };
  });
}

export function resetPassword(input: { resetToken: string; password: string }) {
  return respond(() => {
    if (!resetTokens.delete(input.resetToken)) {
      throw new ApiError('This reset link expired. Start again from "Forgot password".', 410);
    }
    return { ok: true };
  });
}

export interface MfaSetup {
  secret: string;
  /** What the QR code encodes; authenticator apps read this. */
  otpauthUri: string;
}

export function startMfaSetup() {
  return respond<MfaSetup>(() => {
    pendingMfaSecret = randomString(32, BASE32);
    const label = encodeURIComponent(`Monivo:${db.user.email}`);
    return { secret: pendingMfaSecret, otpauthUri: `otpauth://totp/${label}?secret=${pendingMfaSecret}&issuer=Monivo` };
  });
}

/** Proves the authenticator works, turns MFA on and issues fresh backup codes. */
export function confirmMfaSetup(code: string) {
  return respond(() => {
    if (!pendingMfaSecret) throw new ApiError('Setup expired. Close this screen and start again.', 410);
    if (!isValidCode(code)) throw badCode();
    db.auth = { mfaSecret: pendingMfaSecret, backupCodes: generateBackupCodes() };
    db.user.mfaEnabled = true;
    pendingMfaSecret = null;
    return { backupCodes: db.auth.backupCodes };
  });
}

export function disableMfa() {
  return respond(() => {
    db.user.mfaEnabled = false;
    db.auth = { mfaSecret: null, backupCodes: [] };
    return db.user;
  });
}

export function getBackupCodes() {
  return respond(() => db.auth.backupCodes);
}

export function regenerateBackupCodes() {
  return respond(() => {
    db.auth.backupCodes = generateBackupCodes();
    return db.auth.backupCodes;
  });
}

export function logOut() {
  return respond(() => ({ ok: true }));
}

// --- helpers ---

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
// No 0/O or 1/I/L: backup codes get read off paper, so avoid look-alikes.
const BACKUP_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomString(length: number, alphabet: string) {
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

function generateBackupCodes(count = 10) {
  return Array.from({ length: count }, () => `${randomString(4, BACKUP_ALPHABET)}-${randomString(4, BACKUP_ALPHABET)}`);
}

function normalizeBackupCode(code: string) {
  const raw = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}
