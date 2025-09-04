import { useState, useEffect } from "react";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for demo auth
    const demoUser = localStorage.getItem('hublink_demo_user');
    
    // Simple check: if localStorage has 'true', user is authenticated
    if (demoUser === 'true') {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
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
