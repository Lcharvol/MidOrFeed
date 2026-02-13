/**
 * Safely convert an unknown caught value to an Error instance.
 * Avoids unsafe `error as Error` assertions in catch blocks.
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
}
