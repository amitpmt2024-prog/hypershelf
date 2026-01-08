/**
 * Convex backend functions for HypeShelf
 * 
 * This module handles all database operations, authentication, and authorization
 * for the HypeShelf recommendation platform.
 * 
 * Security Notes:
 * - All new users default to "user" role (not admin) for security
 * - Input validation is performed on all user inputs
 * - Authorization checks are enforced on all mutations
 */

import { v } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import {
  validateString,
  validateUrl,
  validateGenre,
  VALIDATION_LIMITS,
} from "./validation";

/**
 * Allowed movie/genre types
 * This should match the frontend MOVIE_TYPES constant
 */
const ALLOWED_GENRES = [
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
 * Gets the user's role from the database
 * 
 * @param ctx - Query or Mutation context
 * @returns User role and ID, or null if not authenticated
 */
async function getUserRole(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    // User doesn't exist yet - will be created on first mutation
    return null;
  }

  // Default to "user" role for security (not admin)
  // Legacy users without a role will default to "user"
  return { role: user.role ?? "user", userId: user._id };
}

/**
 * Gets or creates a user in the database with default "user" role
 * 
 * Security: New users are created with "user" role, not "admin"
 * Admins must be explicitly promoted by existing admins
 * 
 * @param ctx - Mutation context
 * @returns User role and ID, or null if not authenticated
 */
async function getOrCreateUserRole(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    // SECURITY: Default role is "user", not "admin"
    // Admins must be explicitly promoted by existing admins
    const role = "user" as const;

    // Sanitize user name if provided
    const sanitizedName = identity.name
      ? validateString(identity.name, 1, 100, "User name")
      : undefined;

    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      role: role,
      name: sanitizedName,
    });
    return { role, userId };
  }

  // For legacy users without a role, default to "user" for security
  if (!user.role) {
    const role = "user" as const;
    await ctx.db.patch(user._id, { role });
    return { role, userId: user._id };
  }

  return { role: user.role, userId: user._id };
}


/**
 * Get list of latest public recommendations (read-only)
 * 
 * This query is public and doesn't require authentication.
 * It returns a limited number of recommendations for display.
 * 
 * @param count - Optional number of recommendations to return (default: 5, max: 100)
 * @returns Array of recommendation objects (without authorId for privacy)
 */
export const listPublicRecommendations = query({
  args: {
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Limit count to prevent abuse
    const count = Math.min(Math.max(1, args.count ?? 5), 100);
    
    const recommendations = await ctx.db
      .query("recommendations")
      .order("desc")
      .take(count);

    return recommendations.map((rec) => ({
      _id: rec._id,
      title: rec.title,
      genre: rec.genre,
      link: rec.link,
      blurb: rec.blurb,
      authorName: rec.authorName,
      isStaffPick: rec.isStaffPick,
      imageId: rec.imageId,
      _creationTime: rec._creationTime,
    }));
  },
});

/**
 * Get all recommendations with optional genre filter (authenticated users only)
 * 
 * Returns recommendations with authorId so users can see if they own each recommendation.
 * This allows the UI to show edit/delete buttons only for the user's own recommendations.
 * 
 * @param genre - Optional genre filter (use "all" or omit to get all genres)
 * @returns Object containing recommendations, current user ID, and user role
 * @throws Error if user is not authenticated
 */
export const listAllRecommendations = query({
  args: {
    genre: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user info to include in response for UI permission checks
    const userInfo = await getUserRole(ctx);

    let recommendations;
    if (args.genre && args.genre !== "all") {
      // Validate genre if provided
      try {
        validateGenre(args.genre, ALLOWED_GENRES);
      } catch {
        // If genre is invalid, return empty results
        return {
          recommendations: [],
          currentUserId: identity.subject,
          userRole: userInfo?.role ?? "user",
        };
      }

      recommendations = await ctx.db
        .query("recommendations")
        .withIndex("by_genre", (q) => q.eq("genre", args.genre!))
        .order("desc")
        .collect();
    } else {
      recommendations = await ctx.db
        .query("recommendations")
        .order("desc")
        .collect();
    }

    return {
      recommendations: recommendations.map((rec) => ({
        _id: rec._id,
        title: rec.title,
        genre: rec.genre,
        link: rec.link,
        blurb: rec.blurb,
        authorId: rec.authorId,
        authorName: rec.authorName,
        isStaffPick: rec.isStaffPick,
        imageId: rec.imageId,
        _creationTime: rec._creationTime,
      })),
      currentUserId: identity.subject,
      userRole: userInfo?.role ?? "user",
    };
  },
});

/**
 * Get available genres for filtering
 * 
 * Returns a sorted list of all genres that have at least one recommendation.
 * This is used to populate genre filter dropdowns in the UI.
 * 
 * @returns Sorted array of genre strings
 */
export const getGenres = query({
  args: {},
  handler: async (ctx) => {
    const recommendations = await ctx.db.query("recommendations").collect();
    const genres = new Set(recommendations.map((r) => r.genre));
    return Array.from(genres).sort();
  },
});

/**
 * Get image URL from storage ID
 * 
 * Converts a Convex storage ID to a publicly accessible URL.
 * Returns null if no imageId is provided.
 * 
 * @param imageId - Optional Convex storage ID
 * @returns Public URL for the image, or null if no imageId provided
 */
export const getImageUrl = query({
  args: {
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    if (!args.imageId) return null;
    return await ctx.storage.getUrl(args.imageId);
  },
});

/**
 * Get current user's role
 * 
 * Returns the role and user ID for the currently authenticated user.
 * Used by the frontend to determine what actions the user can perform.
 * 
 * @returns Object with role ("admin" or "user") and userId, or null if not authenticated
 */
export const getUserRoleQuery = query({
  args: {},
  handler: async (ctx) => {
    return await getUserRole(ctx);
  },
});

/**
 * Generate upload URL for image (authenticated users only)
 * 
 * Creates a temporary upload URL that can be used to upload an image to Convex storage.
 * The URL should be used immediately as it may expire.
 * 
 * Note: Image validation (size, type, dimensions) should be done on the frontend
 * before upload, and ideally also validated on the backend after upload.
 * 
 * @returns Temporary upload URL for image upload
 * @throws Error if user is not authenticated
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Ensure user exists in users table
    await getOrCreateUserRole(ctx);

    // Generate upload URL
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Create a recommendation (authenticated users only)
 * 
 * Validates and sanitizes all inputs before storing in the database.
 * All authenticated users can create recommendations.
 * 
 * @param title - Recommendation title (2-200 characters)
 * @param genre - Movie genre (must be from allowed list)
 * @param link - URL to the movie/recommendation (must be http/https)
 * @param blurb - Description of the recommendation (10-1000 characters)
 * @param imageId - Optional image storage ID
 * @returns The ID of the created recommendation
 * @throws Error if validation fails or user is not authenticated
 */
export const createRecommendation = mutation({
  args: {
    title: v.string(),
    genre: v.string(),
    link: v.string(),
    blurb: v.string(),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Ensure user exists in users table
    await getOrCreateUserRole(ctx);

    // Validate and sanitize all inputs
    const validatedTitle = validateString(
      args.title,
      VALIDATION_LIMITS.TITLE_MIN_LENGTH,
      VALIDATION_LIMITS.TITLE_MAX_LENGTH,
      "Title"
    );

    const validatedGenre = validateGenre(args.genre, ALLOWED_GENRES);

    const validatedLink = validateUrl(args.link);

    const validatedBlurb = validateString(
      args.blurb,
      VALIDATION_LIMITS.BLURB_MIN_LENGTH,
      VALIDATION_LIMITS.BLURB_MAX_LENGTH,
      "Blurb"
    );

    // Sanitize author name
    const authorName = identity.name
      ? validateString(identity.name, 1, 100, "Author name")
      : "Anonymous";

    const id = await ctx.db.insert("recommendations", {
      title: validatedTitle,
      genre: validatedGenre,
      link: validatedLink,
      blurb: validatedBlurb,
      authorId: identity.subject,
      authorName: authorName,
      isStaffPick: false,
      imageId: args.imageId,
    });

    return id;
  },
});

/**
 * Update a recommendation
 * 
 * Authorization: Users can update their own recommendations, admins can update any.
 * All inputs are validated and sanitized before updating.
 * 
 * @param recommendationId - ID of the recommendation to update
 * @param title - Updated title (2-200 characters)
 * @param genre - Updated genre (must be from allowed list)
 * @param link - Updated URL (must be http/https)
 * @param blurb - Updated description (10-1000 characters)
 * @param imageId - Optional updated image storage ID
 * @returns The ID of the updated recommendation
 * @throws Error if validation fails, recommendation not found, or user not authorized
 */
export const updateRecommendation = mutation({
  args: {
    recommendationId: v.id("recommendations"),
    title: v.string(),
    genre: v.string(),
    link: v.string(),
    blurb: v.string(),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const recommendation = await ctx.db.get(args.recommendationId);
    if (!recommendation) {
      throw new Error("Recommendation not found");
    }

    const userRole = await getOrCreateUserRole(ctx);
    if (!userRole) {
      throw new Error("Not authenticated");
    }

    const isUserAdmin = userRole.role === "admin";

    // Authorization check: users can only update their own, admins can update any
    if (!isUserAdmin && recommendation.authorId !== identity.subject) {
      throw new Error("Not authorized to update this recommendation");
    }

    // Validate and sanitize all inputs
    const validatedTitle = validateString(
      args.title,
      VALIDATION_LIMITS.TITLE_MIN_LENGTH,
      VALIDATION_LIMITS.TITLE_MAX_LENGTH,
      "Title"
    );

    const validatedGenre = validateGenre(args.genre, ALLOWED_GENRES);

    const validatedLink = validateUrl(args.link);

    const validatedBlurb = validateString(
      args.blurb,
      VALIDATION_LIMITS.BLURB_MIN_LENGTH,
      VALIDATION_LIMITS.BLURB_MAX_LENGTH,
      "Blurb"
    );

    // Update the recommendation with validated data
    await ctx.db.patch(args.recommendationId, {
      title: validatedTitle,
      genre: validatedGenre,
      link: validatedLink,
      blurb: validatedBlurb,
      imageId: args.imageId,
    });

    return args.recommendationId;
  },
});

/**
 * Delete a recommendation
 * 
 * Authorization: Users can delete their own recommendations, admins can delete any.
 * 
 * @param recommendationId - ID of the recommendation to delete
 * @throws Error if recommendation not found, user not authenticated, or user not authorized
 */
export const deleteRecommendation = mutation({
  args: {
    recommendationId: v.id("recommendations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const recommendation = await ctx.db.get(args.recommendationId);
    if (!recommendation) {
      throw new Error("Recommendation not found");
    }

    const userRole = await getOrCreateUserRole(ctx);
    if (!userRole) {
      throw new Error("Not authenticated");
    }

    const isUserAdmin = userRole.role === "admin";

    // Authorization check: users can only delete their own, admins can delete any
    if (!isUserAdmin && recommendation.authorId !== identity.subject) {
      throw new Error("Not authorized to delete this recommendation");
    }

    await ctx.db.delete(args.recommendationId);
  },
});

/**
 * Mark/unmark a recommendation as Staff Pick (admin only)
 * 
 * Staff picks are featured recommendations that appear prominently in the UI.
 * Only admins can toggle this status.
 * 
 * @param recommendationId - ID of the recommendation to update
 * @param isStaffPick - Whether to mark as staff pick (true) or remove the mark (false)
 * @throws Error if user is not an admin, recommendation not found, or user not authenticated
 */
export const toggleStaffPick = mutation({
  args: {
    recommendationId: v.id("recommendations"),
    isStaffPick: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userRole = await getOrCreateUserRole(ctx);
    if (!userRole || userRole.role !== "admin") {
      throw new Error("Only admins can mark recommendations as Staff Pick");
    }

    const recommendation = await ctx.db.get(args.recommendationId);
    if (!recommendation) {
      throw new Error("Recommendation not found");
    }

    await ctx.db.patch(args.recommendationId, {
      isStaffPick: args.isStaffPick,
    });
  },
});

/**
 * Cleanup function to remove old users without clerkId (admin only)
 * 
 * This function removes users that don't have a Clerk ID, which are likely
 * from an older authentication system or test data.
 * 
 * WARNING: This permanently deletes user records. Use with caution.
 * 
 * @returns Number of users deleted
 * @throws Error if user is not an admin
 */
export const cleanupOldUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const userRole = await getOrCreateUserRole(ctx);
    if (!userRole || userRole.role !== "admin") {
      throw new Error("Only admins can run cleanup");
    }

    // Get all users without clerkId
    const allUsers = await ctx.db.query("users").collect();
    const oldUsers = allUsers.filter((user) => !user.clerkId);

    // Delete old users
    for (const user of oldUsers) {
      await ctx.db.delete(user._id);
    }

    return { deleted: oldUsers.length };
  },
});

/**
 * Migration function to fix legacy users (adds default role if missing)
 * 
 * SECURITY: This migration sets legacy users to "user" role, not "admin"
 * Admins must be explicitly promoted.
 * 
 * @returns Number of users updated
 * @throws Error if user is not an admin
 */
export const migrateLegacyUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const userRole = await getOrCreateUserRole(ctx);
    if (!userRole || userRole.role !== "admin") {
      throw new Error("Only admins can run migration");
    }

    // Get all users without role
    const allUsers = await ctx.db.query("users").collect();
    const legacyUsers = allUsers.filter((user) => !user.role);

    // Update legacy users to have default "user" role (not admin)
    for (const user of legacyUsers) {
      await ctx.db.patch(user._id, { role: "user" });
    }

    return { updated: legacyUsers.length };
  },
});

/**
 * Update user role (admin only)
 * 
 * Allows admins to promote users to admin or demote admins to regular users.
 * Includes a safety check to prevent admins from demoting themselves.
 * 
 * @param userId - ID of the user whose role should be updated
 * @param newRole - New role to assign ("admin" or "user")
 * @returns Success confirmation with updated user ID and role
 * @throws Error if user is not an admin, user not found, or attempting to demote self
 */
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    newRole: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    // Require admin role
    const currentUserRole = await getOrCreateUserRole(ctx);
    if (!currentUserRole || currentUserRole.role !== "admin") {
      throw new Error("Only admins can update user roles");
    }

    // Get the user to update
    const userToUpdate = await ctx.db.get(args.userId);
    if (!userToUpdate) {
      throw new Error("User not found");
    }

    // Safety check: prevent admins from demoting themselves
    const identity = await ctx.auth.getUserIdentity();
    if (userToUpdate.clerkId === identity?.subject && args.newRole === "user") {
      throw new Error("You cannot demote yourself from admin role");
    }

    // Update the user's role
    await ctx.db.patch(args.userId, { role: args.newRole });

    return { success: true, userId: args.userId, newRole: args.newRole };
  },
});

/**
 * List all users (admin only)
 * 
 * Returns a list of all users in the system. This is intended for admin dashboards
 * to manage user roles and view user information.
 * 
 * @returns Array of user objects with ID, Clerk ID, name, role, and creation time
 * @throws Error if user is not authenticated or not an admin
 */
export const listAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userInfo = await getUserRole(ctx);
    if (!userInfo || userInfo.role !== "admin") {
      throw new Error("Only admins can view all users");
    }

    const allUsers = await ctx.db.query("users").collect();
    
    return allUsers.map((user) => ({
      _id: user._id,
      clerkId: user.clerkId,
      name: user.name,
      role: user.role ?? "user", // Default to "user" for security
      _creationTime: user._creationTime,
    }));
  },
});
