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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Check if it's a demo username (no @ means username)
    const isUsername = !email.includes('@');
    const demoUsernames = ['premium_creator', 'standard_creator', 'demo_publisher'];
    
    if (isUsername && demoUsernames.includes(email)) {
      try {
        console.log('Demo username login for:', email);
        const response = await fetch('/api/demo-login-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email }),
          credentials: 'include'
        });
        
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
          alert('Demo login failed. Try: premium_creator, standard_creator, or demo_publisher');
        }
      } catch (error) {
        alert('Demo login error. Try: premium_creator, standard_creator, or demo_publisher');
      }
    } else if (email === "demo@hublink.com" || (email === "test" && password === "password")) {
      localStorage.setItem('hublink_demo_user', 'true');
      window.location.reload();
    } else {
      alert('Use demo usernames: premium_creator, standard_creator, or demo_publisher (no password needed)');
    }
    
    setIsLoading(false);
  };

  const handleDemoLogin = () => {
    localStorage.setItem('hublink_demo_user', 'true');
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign In to HubLink</DialogTitle>
          <DialogDescription>
            Enter your credentials to access your account
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Username or Email</Label>
            <Input
              id="email"
              type="text"
              placeholder="premium_creator, standard_creator, or demo_publisher"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleDemoLogin}
              className="w-full"
            >
              Quick Demo Login
            </Button>
          </div>
        </form>
        
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p><strong>Demo Usernames (no password needed):</strong></p>
          <p><code>premium_creator</code> • <code>standard_creator</code> • <code>demo_publisher</code></p>
        </div>
      </DialogContent>
    </Dialog>
  );
}