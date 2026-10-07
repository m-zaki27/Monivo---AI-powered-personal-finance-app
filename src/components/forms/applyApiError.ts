import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { ApiError } from '@/services';

/**
 * Routes a server error into the form: under the matching field when the API
 * names one we render, otherwise into `root.server` (shown by <FormError>).
 * RHF clears `root` errors on the next submit automatically.
 */
export function applyApiError<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, fields: readonly Path<T>[]) {
  const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  const field = error instanceof ApiError ? (error.field as Path<T> | undefined) : undefined;
  if (field && fields.includes(field)) {
    setError(field, { type: 'server', message }, { shouldFocus: true });
  } else {
    setError('root.server', { type: 'server', message });
  }
}
