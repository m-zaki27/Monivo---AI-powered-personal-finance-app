import { useMutation } from '@tanstack/react-query';

import { assistantApi } from '@/services';

/** Each question is a one-off request; the chat history lives in the screen. */
export const useAskAssistant = () => useMutation({ mutationFn: assistantApi.ask });
