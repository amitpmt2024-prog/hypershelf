/**
 * Application constants
 * 
 * Centralized constants used throughout the application.
 * This makes it easier to maintain and update values.
 */

/**
 * Allowed movie/genre types for recommendations
 */
export const MOVIE_TYPES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Horror",
  "Romance",
  "Documentary",
  "Sports",
  "Biopic",
] as const;

/**
 * Type for movie genres
 */
export type MovieGenre = (typeof MOVIE_TYPES)[number];

/**
 * Validation limits (should match backend VALIDATION_LIMITS)
 */
export const VALIDATION_LIMITS = {
  TITLE_MIN_LENGTH: 2,
  TITLE_MAX_LENGTH: 200,
  BLURB_MIN_LENGTH: 10,
  BLURB_MAX_LENGTH: 1000,
  URL_MAX_LENGTH: 2048,
  IMAGE_MAX_SIZE_BYTES: 2 * 1024 * 1024, // 2MB
  IMAGE_MAX_WIDTH: 2000,
  IMAGE_MAX_HEIGHT: 2000,
} as const;

/**
 * Allowed image MIME types
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  ITEMS_PER_PAGE: 8,
  MAX_PUBLIC_ITEMS: 1000,
} as const;
