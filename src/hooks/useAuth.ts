import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authApi, userApi, type BackupCodesResult } from '@/services';

import { queryKeys } from './queryKeys';

/**
 * Auth actions are mutations: they change something on the server and we care
 * about their pending/error state, not about caching a result.
 */

export const useSignUp = () => useMutation({ mutationFn: authApi.signUp });
export const useResendCode = () => useMutation({ mutationFn: authApi.resendCode });
export const useVerifyEmail = () => useMutation({ mutationFn: authApi.verifyEmail });
export const useLogIn = () => useMutation({ mutationFn: authApi.logIn });
export const useVerifyMfa = () => useMutation({ mutationFn: authApi.verifyMfa });
export const useRequestPasswordReset = () => useMutation({ mutationFn: authApi.requestPasswordReset });
export const useVerifyResetCode = () => useMutation({ mutationFn: authApi.verifyResetCode });
export const useResetPassword = () => useMutation({ mutationFn: authApi.resetPassword });
/** Deletes the signed-in user (not to be confused with useDeleteAccount for money accounts). */
export const useDeleteMyAccount = () => useMutation({ mutationFn: authApi.deleteAccount });

/**
 * Starting MFA setup enrolls a new (unverified) factor on the server.
 * staleTime: Infinity keeps the same QR code while the screen is open;
 * gcTime: 0 throws it away on leaving, so the next attempt starts fresh.
 */
export function useMfaSetup() {
  return useQuery({
    queryKey: queryKeys.auth.mfaSetup,
    queryFn: authApi.startMfaSetup,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });
}

/** Freshly issued codes live only in memory: the server can never show them again. */
function useStoreNewCodes() {
  const qc = useQueryClient();
  return (result: BackupCodesResult) => {
    qc.setQueryData(queryKeys.auth.backupCodes, result);
    return Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.me }),
      qc.invalidateQueries({ queryKey: queryKeys.auth.backupStatus }),
    ]);
  };
}

export function useConfirmMfaSetup() {
  const store = useStoreNewCodes();
  return useMutation({ mutationFn: authApi.confirmMfaSetup, onSuccess: store });
}

export function useRegenerateBackupCodes() {
  const store = useStoreNewCodes();
  return useMutation({ mutationFn: authApi.regenerateBackupCodes, onSuccess: store });
}

/** Codes generated in this session (null once you leave the backup codes screen). */
export function useNewBackupCodes() {
  return useQuery<BackupCodesResult | null>({
    queryKey: queryKeys.auth.backupCodes,
    queryFn: () => null,
    staleTime: Infinity,
    gcTime: 0,
  });
}

export function useBackupCodesStatus() {
  return useQuery({ queryKey: queryKeys.auth.backupStatus, queryFn: authApi.getBackupCodesStatus });
}

export function useDisableMfa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.disableMfa,
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.me }),
        qc.invalidateQueries({ queryKey: queryKeys.auth.backupStatus }),
      ]),
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: userApi.completeOnboarding,
    onSuccess: (user) => {
      qc.setQueryData(queryKeys.me, user);
      return qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}
