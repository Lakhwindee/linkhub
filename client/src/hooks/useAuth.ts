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
    const demoUserId = localStorage.getItem('hublink_demo_user_id');
    
    if (isDemoUserLoggedIn && demoUserId) {
      // Demo user data mapping
      const demoUserMap = {
        'demo-creator-premium': {
          id: 'demo-creator-premium',
          firstName: 'Premium',
          lastName: 'Creator', 
          displayName: 'Premium Creator',
          username: 'premium_creator',
          email: 'creator-premium@hublink.com',
          profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          plan: 'premium',
          role: 'creator'
        },
        'demo-creator-standard': {
          id: 'demo-creator-standard',
          firstName: 'Standard',
          lastName: 'Creator', 
          displayName: 'Standard Creator',
          username: 'standard_creator',
          email: 'creator-standard@hublink.com',
          profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          plan: 'standard',
          role: 'creator'
        },
        'demo-publisher': {
          id: 'demo-publisher',
          firstName: 'Demo',
          lastName: 'Publisher', 
          displayName: 'Demo Publisher',
          username: 'demo_publisher',
          email: 'publisher@hublink.com',
          profileImageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
          plan: 'premium',
          role: 'publisher'
        }
      };
      
      const selectedUser = demoUserMap[demoUserId as keyof typeof demoUserMap];
      if (selectedUser) {
        setUser(selectedUser);
        setIsAuthenticated(true);
      } else {
        // Fallback to old demo user
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
      }
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
