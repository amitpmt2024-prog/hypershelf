/**
 * Input validation and sanitization utilities for backend security
 * 
 * This module provides comprehensive validation and sanitization functions
 * to ensure data integrity and prevent security vulnerabilities including:
 * 
 * - XSS (Cross-Site Scripting) attacks
 * - HTML/XML injection
 * - JavaScript injection
 * - SQL injection (defensive, though Convex handles this)
 * - Control character injection
 * - Protocol injection (javascript:, data:, vbscript:, file:)
 * 
 * All user inputs are sanitized before being stored in the database.
 * 
 * Security Note: This sanitization is designed for plain text inputs.
 * For rich text/HTML content, consider using a library like DOMPurify
 * that can safely allow certain HTML tags while removing dangerous ones.
 */

/**
 * Validates and sanitizes a string input
 * @param value - The string to validate
 * @param minLength - Minimum allowed length
 * @param maxLength - Maximum allowed length
 * @param fieldName - Name of the field for error messages
 * @returns Sanitized string
 * @throws Error if validation fails
 */
export function validateString(
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string
): string {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string`);
  }

  const trimmed = value.trim();

  if (trimmed.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters`);
  }

  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must be less than ${maxLength} characters`);
  }

  /**
   * Comprehensive XSS and injection attack prevention
   * 
   * This sanitization removes or neutralizes:
   * 1. HTML/XML tags (angle brackets) - prevents HTML injection
   * 2. JavaScript protocol - prevents javascript: URLs
   * 3. Event handlers - prevents onclick, onerror, etc.
   * 4. Script tags - prevents <script> injection
   * 5. Data URIs - prevents data: protocol injection
   * 6. VBScript - prevents vbscript: protocol
   * 7. Control characters - removes null bytes and other control chars
   * 8. SQL-like patterns - basic protection (though Convex handles this)
   * 
   * Note: For production with rich text, consider using DOMPurify or similar
   */
  let sanitized = trimmed;

  // Remove HTML/XML tags and angle brackets
  sanitized = sanitized.replace(/[<>]/g, "");

  // Remove script tags (case insensitive)
  sanitized = sanitized.replace(/<\/?script[^>]*>/gi, "");

  // Remove dangerous protocols
  sanitized = sanitized
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/file:/gi, "");

  // Remove event handlers (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/on\w+\s*=/gi, "");

  // Remove style attributes that could contain malicious CSS
  sanitized = sanitized.replace(/style\s*=\s*["'][^"']*["']/gi, "");

  // Remove control characters (null bytes, etc.) that could break parsing
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");

  // Remove SQL-like patterns (defensive, though Convex handles this)
  sanitized = sanitized
    .replace(/;\s*(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|EXEC|EXECUTE)\s+/gi, "")
    .replace(/--/g, "") // Remove SQL comments
    .replace(/\/\*/g, "") // Remove SQL block comments start
    .replace(/\*\//g, ""); // Remove SQL block comments end

  // Normalize whitespace (prevent excessive whitespace attacks)
  sanitized = sanitized.replace(/\s+/g, " ").trim();

  return sanitized;
}

/**
 * Validates a URL to ensure it's safe and properly formatted
 * @param url - The URL string to validate
 * @returns Validated URL string
 * @throws Error if URL is invalid or unsafe
 */
export function validateUrl(url: string): string {
  if (typeof url !== "string") {
    throw new Error("Link must be a string");
  }

  const trimmed = url.trim();

  if (!trimmed) {
    throw new Error("Link is required");
  }

  try {
    const urlObj = new URL(trimmed);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      throw new Error("Link must use http:// or https:// protocol");
    }

    // Prevent javascript: and data: URLs
    if (urlObj.protocol === "javascript:" || urlObj.protocol === "data:") {
      throw new Error("Invalid URL protocol");
    }

    // Limit URL length
    if (trimmed.length > 2048) {
      throw new Error("URL is too long (maximum 2048 characters)");
    }

    return trimmed;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Please enter a valid URL");
    }
    throw error;
  }
}

/**
 * Validates a genre against allowed values
 * @param genre - The genre string to validate
 * @param allowedGenres - Array of allowed genre values
 * @returns Validated genre string
 * @throws Error if genre is invalid
 */
export function validateGenre(genre: string, allowedGenres: readonly string[]): string {
  if (typeof genre !== "string") {
    throw new Error("Genre must be a string");
  }

  const trimmed = genre.trim();

  if (!trimmed) {
    throw new Error("Genre is required");
  }

  if (!allowedGenres.includes(trimmed)) {
    throw new Error(`Genre must be one of: ${allowedGenres.join(", ")}`);
  }

  return trimmed;
}

/**
 * Validates image storage ID format
 * @param imageId - The storage ID to validate
 * @returns Validated storage ID
 * @throws Error if imageId format is invalid
 */
export function validateImageId(imageId: string): string {
  if (typeof imageId !== "string") {
    throw new Error("Image ID must be a string");
  }

  // Basic validation - Convex will handle more detailed validation
  if (!imageId || imageId.trim().length === 0) {
    throw new Error("Image ID cannot be empty");
  }

  return imageId.trim();
}

/**
 * Constants for validation limits
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
