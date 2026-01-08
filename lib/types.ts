/**
 * TypeScript type definitions for HypeShelf
 * 
 * Centralized type definitions for better type safety and code maintainability
 */

import { Id } from "../convex/_generated/dataModel";
import { MovieGenre } from "./constants";

/**
 * Recommendation data structure
 */
export interface Recommendation {
  _id: Id<"recommendations">;
  title: string;
  genre: MovieGenre;
  link: string;
  blurb: string;
  authorId: string;
  authorName: string;
  isStaffPick: boolean;
  imageId?: Id<"_storage">;
  _creationTime?: number;
}

/**
 * Public recommendation (without authorId for privacy)
 */
export interface PublicRecommendation {
  _id: Id<"recommendations">;
  title: string;
  genre: MovieGenre;
  link: string;
  blurb: string;
  authorName: string;
  isStaffPick: boolean;
  imageId?: Id<"_storage">;
  _creationTime?: number;
}

/**
 * Form data for creating/editing recommendations
 */
export interface RecommendationFormData {
  title: string;
  genre: string;
  link: string;
  blurb: string;
}

/**
 * Form validation errors
 */
export interface FormErrors {
  title?: string;
  genre?: string;
  link?: string;
  blurb?: string;
}

/**
 * User role type
 */
export type UserRole = "admin" | "user";

/**
 * User data structure
 */
export interface User {
  _id: Id<"users">;
  clerkId?: string;
  role?: UserRole;
  name?: string;
  _creationTime?: number;
}

/**
 * User role information returned from queries
 */
export interface UserRoleInfo {
  role: UserRole;
  userId: Id<"users">;
}
