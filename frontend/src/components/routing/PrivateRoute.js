import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ component: Component }) => {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  useEffect(() => {
    // Only set redirect state when authentication check is complete
    if (!loading && !isAuthenticated) {
      setShouldRedirect(true);
    }
  }, [loading, isAuthenticated]);

  // If still loading, show nothing or a loading spinner
  if (loading) {
    return <div className="container text-center mt-5">Loading...</div>;
  }

  // If not authenticated and redirect state is set, redirect to login page
  if (shouldRedirect) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the component
  return isAuthenticated ? <Component /> : null;
};

export default PrivateRoute; 