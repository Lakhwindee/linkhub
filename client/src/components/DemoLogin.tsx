import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, LogIn, Briefcase, Video } from "lucide-react";

export function DemoLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState<string>('');

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
        credentials: 'include', // Important for cookie handling
      });
      
      console.log(`${type} demo login response:`, response.status, response.ok);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`${type} login successful:`, result);
        
        // Set localStorage for frontend authentication with role info
        localStorage.setItem('hublink_demo_user', 'true');
        localStorage.setItem('hublink_demo_role', type);
        
        // Direct redirect to home page without page reload
        window.location.href = '/';
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
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Button 
              onClick={() => handleDemoLogin('publisher')} 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
              variant="default"
            >
              <Briefcase className="w-5 h-5 mr-2" />
              {isLoading && loginType === 'publisher' ? "Logging in..." : "🏢 Demo Login as Publisher (Role 2)"}
            </Button>
            
            <Button 
              onClick={() => handleDemoLogin('creator')} 
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
              variant="default"
            >
              <Video className="w-5 h-5 mr-2" />
              {isLoading && loginType === 'creator' ? "Logging in..." : "🎥 Demo Login as Creator (Role 1)"}
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="text-center text-muted-foreground">
              <p className="font-semibold text-foreground mb-2">Publisher Features:</p>
              <ul className="text-xs space-y-1">
                <li>🏠 Create stays & accommodations</li>
                <li>📢 Publish ad campaigns</li>
                <li>✈️ Create tour packages</li>
                <li>💰 Manage earnings & payouts</li>
              </ul>
            </div>
            
            <div className="text-center text-muted-foreground">
              <p className="font-semibold text-foreground mb-2">Creator Features:</p>
              <ul className="text-xs space-y-1">
                <li>🎥 Browse ad campaigns</li>
                <li>💼 Reserve campaigns</li>
                <li>📱 Submit video content</li>
                <li>💲 Earn from campaigns</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}