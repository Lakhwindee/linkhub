import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, LogIn } from "lucide-react";

export function DemoLogin() {
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      console.log('Starting demo login...');
      const response = await fetch('/api/demo-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookie handling
      });
      
      console.log('Demo login response:', response.status, response.ok);
      
      if (response.ok) {
        console.log('Setting localStorage...');
        // Set localStorage for frontend authentication
        localStorage.setItem('hublink_demo_user', 'true');
        
        console.log('Testing auth API...');
        // Test if auth API works immediately
        const authTest = await fetch('/api/auth/user', {
          credentials: 'include',
        });
        console.log('Auth test result:', authTest.status, authTest.ok);
        
        // Small delay then refresh page
        setTimeout(() => {
          console.log('Reloading page...');
          window.location.reload();
        }, 500);
      } else {
        console.error('Demo login failed with status:', response.status);
      }
    } catch (error) {
      console.error('Demo login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to HubLink</CardTitle>
          <p className="text-muted-foreground">
            Connect with travelers and creators worldwide
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleDemoLogin} 
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            <LogIn className="w-5 h-5 mr-2" />
            {isLoading ? "Logging in..." : "Demo Login as Creator"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            <p>Demo account includes:</p>
            <ul className="text-xs mt-2 space-y-1">
              <li>🏠 Create stays and accommodations</li>
              <li>📢 Publish ad campaigns</li>
              <li>✈️ Create tour packages</li>
              <li>💰 Access creator/publisher features</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}