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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Demo login logic
    if (email === "demo@hublink.com" || (email === "test" && password === "password")) {
      localStorage.setItem('hublink_demo_user', 'true');
      window.location.reload();
    } else {
      alert('Demo credentials: demo@hublink.com or test/password');
    }
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="demo@hublink.com"
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
            <Button type="submit" className="w-full">
              Sign In
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
        
        <div className="text-center text-sm text-muted-foreground">
          <p>Demo credentials: demo@hublink.com or test/password</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}