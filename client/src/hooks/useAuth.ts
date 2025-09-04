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
    const demoRole = localStorage.getItem('hublink_demo_role');
    
    if (isDemoUserLoggedIn) {
      let demoUserData: User;
      
      if (demoRole === 'creator') {
        // Creator demo user data
        demoUserData = {
          id: 'demo-creator-1',
          firstName: 'Demo',
          lastName: 'Creator', 
          displayName: 'Demo Creator',
          username: 'demo_creator',
          email: 'demo-creator@hublink.com',
          profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          plan: 'creator',
          role: '1', // Creator role = 1
          youtubeChannelId: 'UCHUAPEHzyyXrZU3WAHYh9MA',
          youtubeSubscribers: 45000,
          youtubeTier: 2
        };
      } else if (demoRole === 'publisher') {
        // Publisher demo user data  
        demoUserData = {
          id: 'demo-publisher-1',
          firstName: 'Demo',
          lastName: 'Publisher',
          displayName: 'Demo Publisher',
          username: 'demo_publisher',
          email: 'demo-publisher@hublink.com',
          profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          plan: 'creator',
          role: '2', // Publisher role = 2
          youtubeChannelId: 'UCPublisher123',
          youtubeSubscribers: 150000,
          youtubeTier: 3
        };
      } else {
        // Default demo user for backward compatibility
        demoUserData = {
          id: 'demo-user-1',
          firstName: 'Demo',
          lastName: 'User', 
          displayName: 'Demo User',
          username: 'demo_user',
          email: 'demo@hublink.com',
          profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          plan: 'premium',
          role: 'publisher',
          youtubeChannelId: 'UCHUAPEHzyyXrZU3WAHYh9MA',
          youtubeSubscribers: 939000,
          youtubeTier: 3
        };
      }
      
      console.log('🎯 Frontend Auth: Role =', demoRole, 'User =', demoUserData.displayName);
      
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
