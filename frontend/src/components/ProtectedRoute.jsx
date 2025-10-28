import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ isAuth, children }) {
  let location = useLocation();

  if (!isAuth) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;