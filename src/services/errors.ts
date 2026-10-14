import type { PostgrestError } from '@supabase/supabase-js';

export class ApiError extends Error {
  /**
   * `field` names the form input the error belongs to (e.g. 'email'), so forms
   * can show it under that input instead of in a generic banner.
   */
  constructor(message: string, public status = 500, public field?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Turns a database error into something a person can act on. Postgres error
 * codes: 23514 = a CHECK rule failed, 23503 = a referenced row is missing,
 * 42501 = row-level security said no.
 */
export function fromPostgrest(error: PostgrestError): ApiError {
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
/** The data type of the success branch only (Supabase returns `{ data, error: null } | { data: null, error }`). */
type Ok<R extends Result> = Extract<R, { error: null }>['data'];

/** Unwraps a Supabase query result: return data or throw a friendly error. */
export function unwrap<R extends Result>(result: R): Ok<R> {
  if (result.error) throw fromPostgrest(result.error);
  return result.data as Ok<R>;
}
