import { useState, useEffect } from "react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  username: string;
  email: string;
  profileImageUrl: string;
  plan: string;
  role: string;
  youtubeChannelId?: string;
  youtubeSubscribers?: number;
  youtubeTier?: number;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for demo user authentication
    const isDemoUserLoggedIn = localStorage.getItem('hublink_demo_user') === 'true';
    
    if (isDemoUserLoggedIn) {
      // Simple demo user for development - CREATOR ROLE
      const demoUserData = {
        id: 'demo-creator-1',
        firstName: 'Demo',
        lastName: 'Creator', 
        displayName: 'Demo Creator',
        username: 'demo_creator',
        email: 'creator@hublink.com',
        profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        plan: 'premium',
        role: 'creator'
      };
      
      setUser(demoUserData);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    
    setIsLoading(false);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
