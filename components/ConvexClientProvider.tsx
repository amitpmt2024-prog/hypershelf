/**
 * Convex Client Provider
 * 
 * Provides the Convex React client to all child components.
 * Integrates with Clerk for authentication.
 * 
 * This component should wrap the entire application to enable
 * Convex queries and mutations throughout the app.
 */

"use client";

import { ReactNode, useMemo } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { getConvexUrl } from "@/lib/env";

/**
 * Creates a singleton Convex client instance
 * This ensures we only create one client per application instance
 */
function createConvexClient() {
  const url = getConvexUrl();
  return new ConvexReactClient(url);
}

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Memoize the client to prevent recreating it on every render
  const convex = useMemo(() => createConvexClient(), []);

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
