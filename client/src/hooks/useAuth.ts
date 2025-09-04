import { useState, useEffect } from "react";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for demo auth in both development and production
    // This allows logout to work properly
    const demoUser = localStorage.getItem('hublink_demo_user');
    
    if (process.env.NODE_ENV === 'development') {
      // In development, auto-login only if not explicitly logged out
      if (demoUser !== 'false') {
        localStorage.setItem('hublink_demo_user', 'true');
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } else {
      // In production, only login if explicitly set to true
      setIsAuthenticated(demoUser === 'true');
    }
    setIsLoading(false);
  }, []);

  const user = isAuthenticated ? {
    id: 'demo-user-1',
    firstName: 'Demo',
    lastName: 'Publisher',
    displayName: 'Demo Publisher',
    username: 'demo_publisher',
    email: 'demo@hublink.com',
    profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    plan: 'creator', // Give demo user creator access for campaigns
    role: 'publisher' // Demo user with publisher role for ad management
  } : null;

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
