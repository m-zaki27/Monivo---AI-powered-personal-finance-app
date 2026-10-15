import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authApi, userApi, type BackupCodesResult } from '@/services';

import { queryKeys } from './queryKeys';

export const useSignUp = () => useMutation({ mutationFn: authApi.signUp });
export const useResendCode = () => useMutation({ mutationFn: authApi.resendCode });
export const useVerifyEmail = () => useMutation({ mutationFn: authApi.verifyEmail });
export const useLogIn = () => useMutation({ mutationFn: authApi.logIn });
export const useVerifyMfa = () => useMutation({ mutationFn: authApi.verifyMfa });
export const useRequestPasswordReset = () => useMutation({ mutationFn: authApi.requestPasswordReset });
export const useVerifyResetCode = () => useMutation({ mutationFn: authApi.verifyResetCode });
export const useResetPassword = () => useMutation({ mutationFn: authApi.resetPassword });
/** Deletes the signed-in user, not a money account. */
export const useDeleteMyAccount = () => useMutation({ mutationFn: authApi.deleteAccount });

// Enrolls a new factor: keep one QR code while open, discard it on leave.
export function useMfaSetup() {
  return useQuery({
    queryKey: queryKeys.auth.mfaSetup,
    queryFn: authApi.startMfaSetup,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });
}

// New codes are kept in memory only; the server can't return them again.
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

/** Codes issued this session; null once the screen is left. */
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

export const useRequestEmailChange = () => useMutation({ mutationFn: authApi.requestEmailChange });
export const useResendEmailChange = () => useMutation({ mutationFn: authApi.resendEmailChange });

export function useVerifyEmailChange() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: authApi.verifyEmailChange, onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.me }) });
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
