import { Role } from '@prisma/client'

export type UserRole = Role

// Route protection policies
export const routePolicies: Record<string, UserRole[]> = {
  '/admin': [Role.ADMIN],
  '/admin/users': [Role.ADMIN],
  '/admin/*': [Role.ADMIN],
}

// Check if a user role is allowed for a specific route
export function isRoleAllowedForRoute(role: UserRole, route: string): boolean {
  // Check exact matches first
  if (routePolicies[route]) {
    return routePolicies[route].includes(role)
  }

  // Check wildcard patterns
  for (const [pattern, allowedRoles] of Object.entries(routePolicies)) {
    if (pattern.endsWith('/*')) {
      const basePattern = pattern.slice(0, -2) // Remove '/*'
      if (route.startsWith(basePattern)) {
        return allowedRoles.includes(role)
      }
    }
  }

  // If no specific policy, allow access
  return true
}

// Check if user has admin role
export function isAdmin(role: UserRole): boolean {
  return role === Role.ADMIN
}

// Check if user has manager role or higher
export function isManagerOrHigher(role: UserRole): boolean {
  return role === Role.ADMIN || role === Role.MANAGER
}

// Check if user has employee role or higher
export function isEmployeeOrHigher(role: UserRole): boolean {
  return [Role.ADMIN, Role.MANAGER, Role.EMPLOYEE].includes(role)
}
