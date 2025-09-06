import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, LogIn, Crown, Zap, Megaphone } from "lucide-react";

export function DemoLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState<string | null>(null);

  const handleDemoLogin = async (userId: string, role: string, plan: string) => {
    setIsLoading(true);
    setLoadingUser(userId);
    try {
      console.log(`Starting demo login for ${userId}...`);
      const response = await fetch('/api/demo-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role, plan }),
        credentials: 'include',
      });
      
      console.log('Demo login response:', response.status, response.ok);
      
      if (response.ok) {
        // Set localStorage for frontend authentication
        localStorage.setItem('hublink_demo_user', 'true');
        localStorage.setItem('hublink_demo_user_id', userId);
        
        // Direct redirect to home page without page reload
        window.location.href = '/';
      } else {
        console.error('Demo login failed with status:', response.status);
      }
    } catch (error) {
      console.error('Demo login error:', error);
    } finally {
      setIsLoading(false);
      setLoadingUser(null);
    }
  };

  const demoUsers = [
    {
      id: 'demo-creator-premium',
      role: 'creator',
      plan: 'premium',
      name: 'Creator Premium',
      description: 'Premium creator with full access',
      icon: Crown,
      color: 'bg-purple-500',
      features: ['Full creator features', 'Premium campaigns', 'Advanced analytics']
    },
    {
      id: 'demo-creator-standard',
      role: 'creator',
      plan: 'standard',
      name: 'Creator Standard',
      description: 'Standard creator with basic access',
      icon: Zap,
      color: 'bg-blue-500',
      features: ['Basic creator features', 'Standard campaigns', 'Basic analytics']
    },
    {
      id: 'demo-publisher',
      role: 'publisher',
      plan: 'premium',
      name: 'Publisher',
      description: 'Publisher with campaign creation',
      icon: Megaphone,
      color: 'bg-green-500',
      features: ['Create ad campaigns', 'Publisher dashboard', 'Campaign analytics']
    }
  ];

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
          {demoUsers.map((user) => {
            const IconComponent = user.icon;
            const isLoadingThis = loadingUser === user.id;
            
            return (
              <div key={user.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 ${user.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{user.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{user.description}</p>
                    <ul className="text-xs space-y-1 mb-3">
                      {user.features.map((feature, idx) => (
                        <li key={idx} className="text-muted-foreground">• {feature}</li>
                      ))}
                    </ul>
                    <Button 
                      onClick={() => handleDemoLogin(user.id, user.role, user.plan)}
                      disabled={isLoading}
                      className="w-full"
                      size="sm"
                      variant={user.plan === 'premium' ? 'default' : 'secondary'}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      {isLoadingThis ? "Logging in..." : `Login as ${user.name}`}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}