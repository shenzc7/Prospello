import { describe, it, expect } from '@jest/globals';
import { isRoleAllowedForRoute } from './rbac';
import { Role } from '@prisma/client';

describe('isRoleAllowedForRoute', () => {
  // Test cases for ADMIN role
  it('should allow ADMIN to access admin-only routes', () => {
    expect(isRoleAllowedForRoute(Role.ADMIN, '/admin')).toBe(true);
    expect(isRoleAllowedForRoute(Role.ADMIN, '/admin/users')).toBe(true);
  });

  it('should allow ADMIN to access wildcard admin routes', () => {
    expect(isRoleAllowedForRoute(Role.ADMIN, '/admin/some/new/page')).toBe(true);
  });

  // Test cases for non-ADMIN roles
  it('should deny MANAGER from accessing admin-only routes', () => {
    expect(isRoleAllowedForRoute(Role.MANAGER, '/admin')).toBe(false);
    expect(isRoleAllowedForRoute(Role.MANAGER, '/admin/users')).toBe(false);
    expect(isRoleAllowedForRoute(Role.MANAGER, '/admin/some/new/page')).toBe(false);
  });

  it('should deny EMPLOYEE from accessing admin-only routes', () => {
    expect(isRoleAllowedForRoute(Role.EMPLOYEE, '/admin')).toBe(false);
    expect(isRoleAllowedForRoute(Role.EMPLOYEE, '/admin/users')).toBe(false);
    expect(isRoleAllowedForRoute(Role.EMPLOYEE, '/admin/some/new/page')).toBe(false);
  });

  // Test cases for unprotected routes
  it('should allow any role to access unprotected routes', () => {
    const unprotectedRoute = '/dashboard';
    expect(isRoleAllowedForRoute(Role.ADMIN, unprotectedRoute)).toBe(true);
    expect(isRoleAllowedForRoute(Role.MANAGER, unprotectedRoute)).toBe(true);
    expect(isRoleAllowedForRoute(Role.EMPLOYEE, unprotectedRoute)).toBe(true);
  });
});
