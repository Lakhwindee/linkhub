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
        console.log('✅ Found demo user in localStorage, checking server...');
        // Make actual API call to get user data
        try {
          const response = await fetch('/api/auth/user', {
            credentials: 'include', // Important for cookie handling
          });
          
          console.log('🌐 Server auth response:', response.status, response.ok);
          
          if (response.ok) {
            const userData = await response.json();
            console.log('👤 User data received:', userData.displayName, userData.role);
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            console.log('❌ Server auth failed, clearing localStorage');
            // Server auth failed, clear localStorage
            localStorage.removeItem('hublink_demo_user');
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('❌ Auth check failed:', error);
          setUser(null);
          setIsAuthenticated(false);
        }
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
