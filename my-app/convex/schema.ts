import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  recommendations: defineTable({
    title: v.string(),
    genre: v.string(),
    link: v.string(),
    blurb: v.string(),
    authorId: v.string(),
    authorName: v.string(),
    isStaffPick: v.boolean(),
    imageId: v.optional(v.id("_storage")),
  })
    .index("by_genre", ["genre"])
    .index("by_author", ["authorId"])
    .index("by_staff_pick", ["isStaffPick"]),
  
  users: defineTable({
    clerkId: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("user"))),
    name: v.optional(v.string()),
  }).index("by_clerk_id", ["clerkId"]),
});
