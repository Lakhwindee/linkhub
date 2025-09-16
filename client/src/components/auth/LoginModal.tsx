import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!userId || !password) {
      alert('Please enter both User ID and Password');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('Demo login for User ID:', userId);
      const response = await fetch('/api/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, password }),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Login successful:', result);
        
        // Clear any existing auth data first
        localStorage.clear();
        
        // Store session info in localStorage AND set cookie manually
        localStorage.setItem('demo_session', `demo-session-${result.user.id}`);
        localStorage.setItem('demo_user', JSON.stringify(result.user));
        
        // Set cookie manually for server authentication with explicit domain
        const cookieValue = `session_id=demo-session-${result.user.id}; path=/; max-age=${7*24*60*60}; samesite=lax`;
        document.cookie = cookieValue;
        console.log('🍪 Setting client cookie:', cookieValue);
        
        // Skip reload, use immediate localStorage authentication
        console.log('✅ Skipping reload, using localStorage auth');
        
        // Immediate auth update
        window.dispatchEvent(new Event('authUpdate'));
        
        // Verify cookie was set
        setTimeout(() => {
          const cookies = document.cookie;
          console.log('🔍 All cookies after login:', cookies);
          console.log('🔍 Session cookie check:', cookies.includes('session_id=demo-session-'));
        }, 100);
        
        // Trigger auth update event
        window.dispatchEvent(new Event('authUpdate'));
        
        // All users redirect to dashboard (admin access only via /admin URL)
        onOpenChange(false);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 300);
        return;
      } else {
        alert(result.message || 'Login failed');
      }
    } catch (error) {
      alert('Login error. Please try again.');
    }
    
    setIsLoading(false);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign In to HubLink</DialogTitle>
          <DialogDescription>
            Enter your User ID and Password to access your account
          </DialogDescription>
        </DialogHeader>
        
        
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              type="text"
              placeholder="Enter your User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                Forgot your password?
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
      
      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        open={showForgotPassword} 
        onOpenChange={setShowForgotPassword}
      />
    </Dialog>
  );
}