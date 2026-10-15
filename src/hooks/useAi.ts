import { useMutation } from '@tanstack/react-query';

import { aiApi } from '@/services';

export const useExtractReceipt = () => useMutation({ mutationFn: aiApi.extractReceipt });
export const useProcessVoice = () => useMutation({ mutationFn: aiApi.processVoice });
