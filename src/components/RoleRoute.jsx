import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getUserRole, getCurrentUser, isRoleAllowed, canAccessRoute } from '../utils/rbac';

const RoleRoute = ({ allowedRoles = [] }) => {
  const role = getUserRole();
  const user = getCurrentUser();
  const location = useLocation();

  if (!isRoleAllowed(role, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (!canAccessRoute(location.pathname, role, user)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
