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
    const checkAuth = async () => {
      console.log('🔍 Checking authentication...');
      // Check localStorage for demo auth
      const demoUser = localStorage.getItem('hublink_demo_user');
      console.log('📦 localStorage demo user:', demoUser);
      
      if (demoUser === 'true') {
        console.log('✅ Found demo user in localStorage, using demo data');
        // Use demo user data directly without server call
        const demoUserData = {
          id: 'demo-user-1',
          firstName: 'Demo',
          lastName: 'User', 
          displayName: 'Demo User',
          username: 'demo_user',
          email: 'demo@hublink.com',
          profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          plan: 'creator',
          role: 'publisher',
          youtubeChannelId: 'UCHUAPEHzyyXrZU3WAHYh9MA',
          youtubeSubscribers: 939000,
          youtubeTier: 3
        };
        
        console.log('👤 Using demo user data:', demoUserData.displayName, demoUserData.role);
        setUser(demoUserData);
        setIsAuthenticated(true);
      } else {
        console.log('👤 No demo user found, staying unauthenticated');
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
      console.log('🏁 Auth check complete. Authenticated:', demoUser === 'true');
    };

    checkAuth();
    
    // Also listen for localStorage changes (from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hublink_demo_user') {
        console.log('📦 localStorage changed, rechecking auth...');
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
