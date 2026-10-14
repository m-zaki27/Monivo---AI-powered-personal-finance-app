import { useMutation } from '@tanstack/react-query';

import { aiApi } from '@/services';

/** Mutations, not queries: each call is a one-off job, and we never want a cached answer for a new photo. */
export const useExtractReceipt = () => useMutation({ mutationFn: aiApi.extractReceipt });
export const useProcessVoice = () => useMutation({ mutationFn: aiApi.processVoice });
