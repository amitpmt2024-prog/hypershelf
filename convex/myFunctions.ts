import { v } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";

// Helper function to get user role
async function getUserRole(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    // Create user with default "admin" role if doesn't exist
    // Only mutations can insert, so we'll handle this in mutations
    return null;
  }

  // Default to "admin" role if not set (for legacy documents)
  return { role: user.role ?? "admin", userId: user._id };
}

// Helper function to get or create user role (for mutations)
// All new users default to "admin" role. If manually changed to "user" in database, they have limited access.
async function getOrCreateUserRole(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    // Default role for all new users is "admin"
    // If you want to limit access, manually change the role to "user" in the database
    const role = "admin" as const;

    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      role: role,
      name: identity.name ?? undefined,
    });
    return { role, userId };
  }

  // Default to "admin" role if not set (for legacy documents)
  // Also update legacy documents to have a role
  if (!user.role) {
    // Default to "admin" for legacy users without a role
    const role = "admin" as const;
    
    await ctx.db.patch(user._id, { role });
    return { role, userId: user._id };
  }

  // Return the user's role (could be "admin" or "user" if manually changed)
  return { role: user.role, userId: user._id };
}


// Get list of latest public recommendations (read-only)
export const listPublicRecommendations = query({
  args: {
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const count = args.count ?? 5;
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

// Get all recommendations with optional genre filter (authenticated)
// Returns recommendations with authorId so users can see if they own each recommendation
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
      currentUserId: identity.subject, // Used in return statement
      userRole: userInfo?.role ?? "user",
    };
  },
});

// Get available genres for filtering
export const getGenres = query({
  args: {},
  handler: async (ctx) => {
    const recommendations = await ctx.db.query("recommendations").collect();
    const genres = new Set(recommendations.map((r) => r.genre));
    return Array.from(genres).sort();
  },
});

// Get image URL from storage ID
export const getImageUrl = query({
  args: {
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    if (!args.imageId) return null;
    return await ctx.storage.getUrl(args.imageId);
  },
});

// Get user role
export const getUserRoleQuery = query({
  args: {},
  handler: async (ctx) => {
    return await getUserRole(ctx);
  },
});

// Generate upload URL for image (authenticated users only)
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

// Create a recommendation (authenticated users only)
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

    const id = await ctx.db.insert("recommendations", {
      title: args.title,
      genre: args.genre,
      link: args.link,
      blurb: args.blurb,
      authorId: identity.subject,
      authorName: identity.name ?? "Anonymous",
      isStaffPick: false,
      imageId: args.imageId,
    });

    return id;
  },
});

// Update a recommendation (users can update own, admins can update any)
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
    const isUserAdmin = userRole?.role === "admin";

    // Users can only update their own recommendations, admins can update any
    if (!isUserAdmin && recommendation.authorId !== identity.subject) {
      throw new Error("Not authorized to update this recommendation");
    }

    // Update the recommendation
    await ctx.db.patch(args.recommendationId, {
      title: args.title,
      genre: args.genre,
      link: args.link,
      blurb: args.blurb,
      imageId: args.imageId,
    });

    return args.recommendationId;
  },
});

// Delete a recommendation (users can delete own, admins can delete any)
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
    const isUserAdmin = userRole?.role === "admin";

    // Users can only delete their own recommendations, admins can delete any
    if (!isUserAdmin && recommendation.authorId !== identity.subject) {
      throw new Error("Not authorized to delete this recommendation");
    }

    await ctx.db.delete(args.recommendationId);
  },
});

// Mark/unmark as Staff Pick (admin only)
export const toggleStaffPick = mutation({
  args: {
    recommendationId: v.id("recommendations"),
    isStaffPick: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userRole = await getOrCreateUserRole(ctx);
    const isUserAdmin = userRole?.role === "admin";
    if (!isUserAdmin) {
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

// Cleanup function to remove old users without clerkId (admin only)
export const cleanupOldUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const userRole = await getOrCreateUserRole(ctx);
    const isUserAdmin = userRole?.role === "admin";
    if (!isUserAdmin) {
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

// Migration function to fix legacy users (adds default role if missing)
export const migrateLegacyUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const userRole = await getOrCreateUserRole(ctx);
    const isUserAdmin = userRole?.role === "admin";
    if (!isUserAdmin) {
      throw new Error("Only admins can run migration");
    }

    // Get all users without role
    const allUsers = await ctx.db.query("users").collect();
    const legacyUsers = allUsers.filter((user) => !user.role);

    // Update legacy users to have default "admin" role
    for (const user of legacyUsers) {
      await ctx.db.patch(user._id, { role: "admin" });
    }

    return { updated: legacyUsers.length };
  },
});

// Update user role (admin only) - allows admins to promote/demote users
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    newRole: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    // Require admin role
    const currentUserRole = await getOrCreateUserRole(ctx);
    const isUserAdmin = currentUserRole?.role === "admin";
    if (!isUserAdmin) {
      throw new Error("Only admins can update user roles");
    }

    // Get the user to update
    const userToUpdate = await ctx.db.get(args.userId);
    if (!userToUpdate) {
      throw new Error("User not found");
    }

    // Prevent admins from demoting themselves (safety check)
    if (userToUpdate.clerkId === (await ctx.auth.getUserIdentity())?.subject && args.newRole === "user") {
      throw new Error("You cannot demote yourself from admin role");
    }

    // Update the user's role
    await ctx.db.patch(args.userId, { role: args.newRole });

    return { success: true, userId: args.userId, newRole: args.newRole };
  },
});

// List all users (admin only) - for admin dashboard
export const listAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userInfo = await getUserRole(ctx);
    const isUserAdmin = userInfo?.role === "admin";
    
    if (!isUserAdmin) {
      throw new Error("Only admins can view all users");
    }

    const allUsers = await ctx.db.query("users").collect();
    
    return allUsers.map((user) => ({
      _id: user._id,
      clerkId: user.clerkId,
      name: user.name,
      role: user.role ?? "admin",
      _creationTime: user._creationTime,
    }));
  },
});
