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

  const checkAuth = async () => {
    console.log('🔍 useAuth checking authentication state...');
    
    // First clear any old localStorage demo data that's interfering
    const oldKeys = ['hublink_demo_user', 'hublink_demo_user_id', 'hublink_demo_role'];
    oldKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log('🧹 Clearing old localStorage key:', key);
        localStorage.removeItem(key);
      }
    });
    
    // Check for real authentication via session
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Found authenticated user:', userData);
        setUser(userData);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.log('No authenticated session found');
    }
    
    // No authentication found
    console.log('No authentication - setting unauthenticated');
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    
  };

  useEffect(() => {
    checkAuth();
    
    // Listen for custom auth events
    const handleAuthUpdate = () => {
      console.log('🔄 Auth update event received, re-checking...');
      checkAuth();
    };
    
    window.addEventListener('authUpdate', handleAuthUpdate);
    
    return () => {
      window.removeEventListener('authUpdate', handleAuthUpdate);
    };
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
