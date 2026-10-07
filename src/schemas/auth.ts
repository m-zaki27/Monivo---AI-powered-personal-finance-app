import { z } from 'zod';

/**
 * Form + session schemas. Messages are written for people, not developers:
 * they say what to do, not what went wrong internally.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email')
  .pipe(z.email("That email doesn't look right"));

/** New passwords only — logging in just checks the field isn't empty. */
export const newPasswordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .regex(/[A-Za-z]/, 'Add at least one letter')
  .regex(/\d/, 'Add at least one number');

export const PASSWORD_HINT = 'At least 8 characters, with a letter and a number';

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your name'),
    email: emailSchema,
    password: newPasswordSchema,
    confirm: z.string().min(1, 'Type your password again'),
  })
  // Cross-field rules go in .refine(); `path` decides which field shows the error.
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: "Passwords don't match" });
export type SignUpForm = z.infer<typeof signUpSchema>;

export const logInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password'),
});
export type LogInForm = z.infer<typeof logInSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: newPasswordSchema,
    confirm: z.string().min(1, 'Type your password again'),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: "Passwords don't match" });
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

/** Backup codes look like "K7QD-92XM"; the dash and case are optional when typing. */
export const backupCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}$/, 'Backup codes have 8 letters and numbers'),
});
export type BackupCodeForm = z.infer<typeof backupCodeSchema>;

/** What we keep on the device. Validated on load so a corrupt value can't crash the app. */
export const sessionSchema = z.object({
  token: z.string().min(1),
  onboarded: z.boolean(),
});
export type Session = z.infer<typeof sessionSchema>;
