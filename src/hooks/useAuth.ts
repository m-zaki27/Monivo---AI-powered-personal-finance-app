import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authApi, userApi } from '@/services';

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

/**
 * Starting MFA setup creates a secret. staleTime: Infinity keeps the same
 * secret while the screen is open; gcTime: 0 throws it away on leaving, so
 * the next attempt gets a fresh one.
 */
export function useMfaSetup() {
  return useQuery({
    queryKey: queryKeys.auth.mfaSetup,
    queryFn: authApi.startMfaSetup,
    staleTime: Infinity,
    gcTime: 0,
  });
}

export function useConfirmMfaSetup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.confirmMfaSetup,
    onSuccess: ({ backupCodes }) => {
      qc.setQueryData(queryKeys.auth.backupCodes, backupCodes);
      return qc.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

export function useBackupCodes() {
  return useQuery({ queryKey: queryKeys.auth.backupCodes, queryFn: authApi.getBackupCodes });
}

export function useRegenerateBackupCodes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.regenerateBackupCodes,
    onSuccess: (codes) => qc.setQueryData(queryKeys.auth.backupCodes, codes),
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

export function useDisableMfa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.disableMfa,
    onSuccess: (user) => {
      qc.setQueryData(queryKeys.me, user);
      qc.setQueryData(queryKeys.auth.backupCodes, []);
    },
  });
}
