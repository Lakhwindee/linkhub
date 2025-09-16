import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleReplitLogin = async () => {
    setIsLoading(true);
    
    try {
      console.log('Starting Replit authentication...');
      
      // Clear any existing auth data
      localStorage.clear();
      
      // Close modal first
      onOpenChange(false);
      
      // Redirect to Replit authentication
      window.location.href = '/api/login';
      
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Login error. Please try again.');
      setIsLoading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign In to HubLink</DialogTitle>
          <DialogDescription>
            Click the button below to sign in with your Replit account
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Button 
            onClick={handleReplitLogin} 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Redirecting..." : "Sign In with Replit"}
          </Button>
          
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            You'll be redirected to Replit to complete authentication
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}