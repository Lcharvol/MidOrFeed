// Types et constantes pour le système de rôles

export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const isAdmin = (role: string | undefined | null): boolean => {
  return role === USER_ROLES.ADMIN;
};

export const isUser = (role: string | undefined | null): boolean => {
  return role === USER_ROLES.USER || !role;
};

export const hasRole = (
  userRole: string | undefined | null,
  requiredRole: UserRole
): boolean => {
  if (requiredRole === USER_ROLES.ADMIN) {
    return isAdmin(userRole);
  }
  return isUser(userRole);
};
