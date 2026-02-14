"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Role constants matching the backend Role enum. */
export type UserRole = "user" | "analyst" | "admin" | "leo";

export interface AuthUser {
  email: string;
  role: UserRole;
  displayName: string | null;
}

interface AuthContextValue {
  /** The currently authenticated user, or null if unknown/loading. */
  user: AuthUser | null;
  /** Whether the current user has at least the given role. */
  hasRole: (role: UserRole) => boolean;
  /** Whether the current user is an admin. */
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  hasRole: () => false,
  isAdmin: false,
});

/** Role hierarchy — admin always has all permissions. */
const ROLE_HIERARCHY: Record<UserRole, Set<UserRole>> = {
  user: new Set(),
  analyst: new Set(["user"]),
  leo: new Set(["user", "analyst"]),
  admin: new Set(["user", "analyst", "leo"]),
};

function checkRole(userRole: UserRole, requiredRole: UserRole): boolean {
  if (userRole === requiredRole) return true;
  if (userRole === "admin") return true;
  return ROLE_HIERARCHY[userRole]?.has(requiredRole) ?? false;
}

interface AuthProviderProps {
  children: ReactNode;
  user: AuthUser | null;
}

/**
 * Provides user identity and role to all console components.
 *
 * Populated server-side by the console layout via `getCurrentUser()`.
 */
export function AuthProvider({ children, user }: AuthProviderProps) {
  const value: AuthContextValue = {
    user,
    hasRole: (role) => (user ? checkRole(user.role, role) : false),
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access the current user's identity and role.
 *
 * @example
 * ```tsx
 * const { user, isAdmin, hasRole } = useAuth();
 * if (hasRole("analyst")) { ... }
 * ```
 */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
