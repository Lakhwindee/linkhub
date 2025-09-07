import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        console.log('Demo login successful!');
        
        // Trigger auth update event
        window.dispatchEvent(new Event('authUpdate'));
        
        // Close modal and redirect
        onOpenChange(false);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
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
        
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Demo Credentials:</h4>
          <div className="text-xs space-y-1">
            <div><strong>Premium Creator:</strong> ID: CREATOR_PREMIUM_001, Password: premium123</div>
            <div><strong>Standard Creator:</strong> ID: CREATOR_STD_002, Password: standard123</div>
            <div><strong>Publisher:</strong> ID: PUBLISHER_003, Password: publisher123</div>
          </div>
        </div>
        
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}