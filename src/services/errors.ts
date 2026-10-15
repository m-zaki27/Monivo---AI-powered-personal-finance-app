import type { PostgrestError } from '@supabase/supabase-js';

export class ApiError extends Error {
  /** `field`: form input to show the error under (e.g. 'email'). */
  constructor(message: string, public status = 500, public field?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// 23514 = CHECK failed, 23503 = missing foreign key, 42501 = RLS denied.
function fromPostgrest(error: PostgrestError): ApiError {
  if (!error.code && /fetch|network/i.test(error.message)) {
    return new ApiError("We couldn't reach Monivo. Check your connection and try again.", 0);
  }
  switch (error.code) {
    case '23514':
      return new ApiError('Some of those details are invalid. Check them and try again.', 400);
    case '23503':
      return new ApiError("That account or category doesn't exist any more. Refresh and try again.", 409);
    case '42501':
    case 'PGRST301':
      return new ApiError("You don't have access to that. Try logging in again.", 403);
    case 'PGRST116':
      return new ApiError("We couldn't find that. It may have been deleted.", 404);
    default:
      return new ApiError('Something went wrong. Please try again.', 500);
  }
}

type Result = { data: unknown; error: PostgrestError | null };
type Ok<R extends Result> = Extract<R, { error: null }>['data'];

/** Returns data or throws an ApiError. */
export function unwrap<R extends Result>(result: R): Ok<R> {
  if (result.error) throw fromPostgrest(result.error);
  return result.data as Ok<R>;
}
