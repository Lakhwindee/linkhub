import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, Video } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState<string>('');

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

  const handleDemoLogin = async (type: 'publisher' | 'creator') => {
    setIsLoading(true);
    setLoginType(type);
    
    try {
      console.log(`Starting ${type} demo login...`);
      const endpoint = type === 'publisher' ? '/api/demo-login-publisher' : '/api/demo-login-creator';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`${type} login successful:`, result);
        
        // Set localStorage for frontend authentication with role info
        localStorage.setItem('hublink_demo_user', 'true');
        localStorage.setItem('hublink_demo_role', type);
        
        // Close modal and reload
        onOpenChange(false);
        window.location.reload();
      } else {
        console.error(`${type} demo login failed with status:`, response.status);
      }
    } catch (error) {
      console.error(`${type} demo login error:`, error);
    } finally {
      setIsLoading(false);
      setLoginType('');
    }
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
            
            <div className="text-center text-sm text-muted-foreground my-2">
              <span>Or try demo logins:</span>
            </div>
            
            <Button 
              type="button" 
              onClick={() => handleDemoLogin('publisher')}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Briefcase className="w-4 h-4 mr-2" />
              {isLoading && loginType === 'publisher' ? "Logging in..." : "🏢 Demo as Publisher (Role 2)"}
            </Button>
            
            <Button 
              type="button" 
              onClick={() => handleDemoLogin('creator')}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Video className="w-4 h-4 mr-2" />
              {isLoading && loginType === 'creator' ? "Logging in..." : "🎥 Demo as Creator (Role 1)"}
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