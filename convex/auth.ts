import { convexAuth } from "@convex-dev/auth/server";
import Resend from "@auth/core/providers/resend";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Resend],
});

/**
 * Get the current user identity for data scoping.
 * Returns either userId (if authenticated) or sessionId (if anonymous).
 * Throws if neither is provided.
 */
export async function getCurrentIdentity(ctx: any, sessionId?: string) {
  const identity = await ctx.auth.getUserIdentity();

  if (identity) {
    // User is authenticated - use their userId
    return { userId: identity.subject, sessionId: undefined };
  } else if (sessionId) {
    // User is anonymous - use their deviceId as sessionId
    return { userId: undefined, sessionId };
  } else {
    throw new Error("Must be authenticated or provide sessionId");
  }
}

/**
 * Create a filter for user-owned data.
 * Returns a filter function that matches either userId or sessionId.
 */
export function createUserFilter(userId?: string, sessionId?: string) {
  if (userId) {
    return (q: any) => q.eq("userId", userId);
  } else if (sessionId) {
    return (q: any) => q.eq("sessionId", sessionId);
  } else {
    throw new Error("Must provide either userId or sessionId");
  }
}
