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
    
    // Only clear old localStorage data that's actually corrupted or invalid
    const currentUser = localStorage.getItem('demo_user');
    
    // Only clear if data is corrupted, don't clear valid demo sessions
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        // Only clear if the data is malformed or corrupted, not just because it's not admin
        if (!userData.id || !userData.email) {
          console.log('🧹 Clearing corrupted demo user data');
          localStorage.removeItem('demo_user');
          localStorage.removeItem('demo_session');
          document.cookie = 'session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
      } catch (e) {
        console.log('🧹 Clearing corrupted demo user data');
        localStorage.removeItem('demo_user');
        localStorage.removeItem('demo_session');
        document.cookie = 'session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
    }
    
    // Check for real authentication via session
    try {
      // Prepare headers for authentication
      const sessionId = localStorage.getItem('demo_session');
      const headers: HeadersInit = {};
      
      if (sessionId) {
        headers['X-Demo-Session'] = sessionId;
        headers['Authorization'] = `Bearer ${sessionId}`;
      }
      
      const response = await fetch('/api/auth/user', {
        credentials: 'include',
        headers
      }).catch((error) => {
        console.log('Network error during auth check:', error);
        return null;
      });
      
      if (response && response.ok) {
        try {
          const userData = await response.json();
          console.log('✅ Found authenticated user:', userData);
          setUser(userData);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        } catch (jsonError) {
          console.log('Failed to parse response JSON:', jsonError);
        }
      }
    } catch (error) {
      console.log('No authenticated session found:', error);
    }
    
    // Fallback: Check localStorage for demo session
    try {
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        const userData = JSON.parse(demoUser);
        console.log('✅ Found demo user in localStorage:', userData);
        setUser(userData);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.log('Failed to parse demo user from localStorage:', error);
      localStorage.removeItem('demo_user');
      localStorage.removeItem('demo_session');
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
