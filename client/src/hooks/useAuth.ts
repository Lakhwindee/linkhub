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
    
    // Clear any old demo data that might be lingering
    localStorage.removeItem('demo_user');
    localStorage.removeItem('demo_session');
    
    try {
      // Check for Replit authentication via session
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
      } else {
        console.log('No authenticated session found:', response.status);
      }
    } catch (error) {
      console.log('Auth check failed:', error);
    }
    
    // No authentication found
    console.log('No authentication - setting unauthenticated');
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth().catch((error) => {
      console.log('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    });
    
    // Listen for custom auth events
    const handleAuthUpdate = () => {
      console.log('🔄 Auth update event received, re-checking...');
      checkAuth().catch((error) => {
        console.log('Auth update failed:', error);
      });
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
