// components/roles/RoleBasedComponent.jsx
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Wrapper component to show/hide content based on roles
export const RoleBasedComponent = ({ 
  requiredRole, 
  requiredRoles = [], 
  fallback = null, 
  children 
}) => {
  const { hasRole, currentRole } = useAuth();

  // Check single role
  if (requiredRole) {
    return hasRole(requiredRole) ? children : fallback;
  }

  // Check multiple roles (user must have at least one)
  if (requiredRoles.length > 0) {
    const hasAnyRole = requiredRoles.some(role => hasRole(role));
    return hasAnyRole ? children : fallback;
  }

  // If no role requirements, show content
  return children;
};

// Component to show content only for current active role
export const CurrentRoleComponent = ({ 
  role, 
  roles = [], 
  fallback = null, 
  children 
}) => {
  const { currentRole } = useAuth();

  // Check single role
  if (role) {
    return currentRole === role ? children : fallback;
  }

  // Check multiple roles
  if (roles.length > 0) {
    return roles.includes(currentRole) ? children : fallback;
  }

  return children;
};

// Component for role-specific content
export const PetOwnerOnly = ({ children, fallback = null }) => (
  <RoleBasedComponent requiredRole="pet_owner" fallback={fallback}>
    {children}
  </RoleBasedComponent>
);

export const PractitionerOnly = ({ children, fallback = null }) => (
  <RoleBasedComponent requiredRole="practitioner" fallback={fallback}>
    {children}
  </RoleBasedComponent>
);

export const VerifiedOnly = ({ children, fallback = null }) => (
  <RoleBasedComponent requiredRoles={['practitioner']} fallback={fallback}>
    {children}
  </RoleBasedComponent>
);