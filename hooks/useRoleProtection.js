// hooks/useRoleProtection.js
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

// Hook to protect routes based on roles
export const useRoleProtection = (requiredRole, redirectTo = '/') => {
  const { hasRole, loading, user } = useAuth();

  useEffect(() => {
    // Don't redirect while loading or if no user
    if (loading || !user) return;

    // Check if user has required role
    if (!hasRole(requiredRole)) {
      console.warn(`Access denied: User doesn't have ${requiredRole} role`);
      router.replace(redirectTo);
    }
  }, [hasRole, requiredRole, loading, user, redirectTo]);

  return {
    hasAccess: hasRole(requiredRole),
    loading: loading
  };
};

// Hook for multiple role requirements (user needs at least one)
export const useMultiRoleProtection = (requiredRoles = [], redirectTo = '/') => {
  const { hasRole, loading, user } = useAuth();

  useEffect(() => {
    if (loading || !user) return;

    const hasAnyRole = requiredRoles.some(role => hasRole(role));
    if (!hasAnyRole) {
      console.warn(`Access denied: User doesn't have any of: ${requiredRoles.join(', ')}`);
      router.replace(redirectTo);
    }
  }, [requiredRoles, hasRole, loading, user, redirectTo]);

  return {
    hasAccess: requiredRoles.some(role => hasRole(role)),
    loading: loading
  };
};

// Hook for current role protection (specific to active role)
export const useCurrentRoleProtection = (allowedRoles = [], redirectTo = '/') => {
  const { currentRole, loading, user } = useAuth();

  useEffect(() => {
    if (loading || !user) return;

    if (!allowedRoles.includes(currentRole)) {
      console.warn(`Access denied: Current role ${currentRole} not in allowed roles: ${allowedRoles.join(', ')}`);
      router.replace(redirectTo);
    }
  }, [currentRole, allowedRoles, loading, user, redirectTo]);

  return {
    hasAccess: allowedRoles.includes(currentRole),
    loading: loading
  };
};