import { useState, useEffect } from "react";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Auto-enable demo user in development
    if (process.env.NODE_ENV === 'development') {
      localStorage.setItem('hublink_demo_user', 'true');
      setIsAuthenticated(true);
    } else {
      // Check localStorage for demo auth in production
      const demoUser = localStorage.getItem('hublink_demo_user') === 'true';
      setIsAuthenticated(demoUser);
    }
    setIsLoading(false);
  }, []);

  const user = isAuthenticated ? {
    id: 'demo-user-1',
    firstName: 'Demo',
    lastName: 'User',
    displayName: 'Demo User',
    username: 'demo_user',
    email: 'demo@hublink.com',
    profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    plan: 'creator', // Give demo user creator access
    role: 'tour_package' // Demo user has tour package role for testing
  } : null;

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
