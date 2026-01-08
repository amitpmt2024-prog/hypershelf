/**
 * Error handling utilities
 * 
 * Provides consistent error handling and user-friendly error messages
 * throughout the application.
 */

/**
 * Extracts a user-friendly error message from an error object
 * @param error - Error object (can be Error, string, or unknown)
 * @param defaultMessage - Default message if error cannot be parsed
 * @returns User-friendly error message
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage = "An unexpected error occurred. Please try again."
): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message || defaultMessage;
  }

  // Handle Convex errors which may have a data property
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return defaultMessage;
}

/**
 * Checks if an error is an authentication error
 * @param error - Error to check
 * @returns True if error is related to authentication
 */
export function isAuthError(error: unknown): boolean {
  const message = getErrorMessage(error, "").toLowerCase();
  return (
    message.includes("not authenticated") ||
    message.includes("authentication") ||
    message.includes("unauthorized")
  );
}

/**
 * Checks if an error is an authorization error
 * @param error - Error to check
 * @returns True if error is related to authorization
 */
export function isAuthorizationError(error: unknown): boolean {
  const message = getErrorMessage(error, "").toLowerCase();
  return (
    message.includes("not authorized") ||
    message.includes("permission") ||
    message.includes("access denied")
  );
}
