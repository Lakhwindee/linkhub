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

  const checkAuth = () => {
    console.log('🔍 useAuth checking authentication state...');
    // Check localStorage for demo user authentication
    const isDemoUserLoggedIn = localStorage.getItem('hublink_demo_user') === 'true';
    const demoUserId = localStorage.getItem('hublink_demo_user_id');
    
    // Full localStorage scan for debugging
    const allLocalStorageKeys = Object.keys(localStorage);
    const hubLinkKeys = allLocalStorageKeys.filter(key => key.includes('hublink'));
    console.log('🔍 ALL localStorage hublink keys:', hubLinkKeys.map(key => ({ key, value: localStorage.getItem(key) })));
    
    console.log('Auth check:', { isDemoUserLoggedIn, demoUserId });
    
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
        console.log('Setting user:', selectedUser);
        setUser(selectedUser);
        setIsAuthenticated(true);
      } else {
        console.log('No matching demo user found, using fallback');
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
      console.log('No demo user detected - setting unauthenticated');
      setUser(null);
      setIsAuthenticated(false);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();
    
    // Listen for localStorage changes (from other tabs or manual changes)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hublink_demo_user' || e.key === 'hublink_demo_user_id') {
        console.log('🔄 localStorage changed, re-checking auth...', e.key, e.newValue);
        checkAuth();
      }
    };
    
    // Listen for custom events (from same tab)
    const handleAuthUpdate = () => {
      console.log('🔄 Custom auth update event received, re-checking...');
      setTimeout(() => {
        console.log('🔄 Now actually running checkAuth after authUpdate...');
        checkAuth();
      }, 100); // Increased delay to ensure localStorage is updated
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authUpdate', handleAuthUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authUpdate', handleAuthUpdate);
    };
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
