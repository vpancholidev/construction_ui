import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getUserFromToken } from '../Utils/jwtHelper';

const ProtectedRouteByRole = ({ allowedRoles }) => {
  const user = getUserFromToken();

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Admin should always be allowed
  const isAdmin = (user.role || '').toString().toLowerCase() === 'admin';
  if (!isAdmin && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return <Outlet />;
};

export default ProtectedRouteByRole;
