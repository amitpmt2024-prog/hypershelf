/**
 * Environment variable validation and access
 * 
 * Validates required environment variables at startup and provides
 * type-safe access to them throughout the application.
 */

/**
 * Validates that a required environment variable is set
 * @param key - Environment variable key
 * @param value - Environment variable value
 * @returns The value if set
 * @throws Error if value is missing
 */
function requireEnv(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        "Please check your .env.local file or deployment configuration."
    );
  }
  return value;
}

/**
 * Validates and returns the Convex URL
 * This is required for the Convex client to connect to the backend
 */
export function getConvexUrl(): string {
  return requireEnv(
    "NEXT_PUBLIC_CONVEX_URL",
    process.env.NEXT_PUBLIC_CONVEX_URL
  );
}

/**
 * Environment configuration
 * All environment variables are validated here
 */
export const env = {
  convexUrl: getConvexUrl(),
  // Add other environment variables here as needed
} as const;
