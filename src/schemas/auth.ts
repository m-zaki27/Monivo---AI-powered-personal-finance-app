import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email')
  .pipe(z.email("That email doesn't look right"));

/** New passwords only; login just requires a non-empty field. */
const newPasswordSchema = z
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

// Loose shape check only; the server ignores dashes, spaces and case.
export const backupCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .refine((v) => /^[A-Za-z0-9]{8,32}$/.test(v.replace(/[\s-]/g, '')), 'Backup codes are letters and numbers, like K4M9-X7QP-2AB8-HT3Z'),
});
export type BackupCodeForm = z.infer<typeof backupCodeSchema>;
