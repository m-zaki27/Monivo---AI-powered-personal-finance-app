import { useMutation } from '@tanstack/react-query';

import { assistantApi } from '@/services';

export const useAskAssistant = () => useMutation({ mutationFn: assistantApi.ask });
