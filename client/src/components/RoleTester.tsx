import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Crown, User, Briefcase, RefreshCw } from 'lucide-react';

const demoUsers = [
  {
    id: 'demo-admin',
    name: 'Admin',
    role: 'admin',
    plan: 'premium',
    description: 'Full access to everything',
    icon: Crown,
    permissions: ['View All', 'Create All', 'Manage All']
  },
  {
    id: 'demo-creator',
    name: 'Creator',
    role: 'creator',
    plan: 'creator',
    description: 'Can only VIEW content, cannot ADD listings',
    icon: User,
    permissions: ['View Stays', 'View Tours', 'View Hosts', '❌ No CREATE buttons']
  },
  {
    id: 'demo-publisher',
    name: 'Publisher',
    role: 'publisher',
    plan: 'premium',
    description: 'Can ADD/LIST all business content',
    icon: Briefcase,
    permissions: ['Create Stays', 'Create Tours', 'Create Hosts', 'Create Ads']
  }
];

export function RoleTester() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const switchUser = async (userId: string) => {
    setIsLoading(true);
    
    // Clear existing session
    localStorage.clear();
    document.cookie = 'session_id=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    
    // Set new demo session
    localStorage.setItem('demo-session', `demo-session-${userId}`);
    document.cookie = `session_id=demo-session-${userId}; path=/`;
    
    // Reload to apply changes
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const currentUserId = user?.id || 'unknown';
  const currentUserInfo = demoUsers.find(u => u.id === currentUserId);

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Permission Testing</h2>
        <p className="text-muted-foreground">
          Switch between different user roles to test permission system
        </p>
      </div>

      {currentUserInfo && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <currentUserInfo.icon className="w-5 h-5" />
              Currently: {currentUserInfo.name}
              <Badge variant="secondary">{currentUserInfo.role}</Badge>
            </CardTitle>
            <CardDescription>
              {currentUserInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {currentUserInfo.permissions.map((permission, i) => (
                <Badge key={i} variant={permission.includes('❌') ? 'destructive' : 'outline'}>
                  {permission}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {demoUsers.map((demoUser) => {
          const Icon = demoUser.icon;
          const isCurrent = demoUser.id === currentUserId;
          
          return (
            <Card 
              key={demoUser.id} 
              className={`cursor-pointer transition-colors ${
                isCurrent ? 'border-primary bg-muted/20' : 'hover:border-muted-foreground'
              }`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="w-5 h-5" />
                  {demoUser.name}
                  {isCurrent && <Badge variant="secondary">Current</Badge>}
                </CardTitle>
                <CardDescription>
                  {demoUser.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {demoUser.permissions.map((permission, i) => (
                      <Badge 
                        key={i} 
                        variant={permission.includes('❌') ? 'destructive' : 'outline'}
                        className="text-xs"
                      >
                        {permission}
                      </Badge>
                    ))}
                  </div>
                  
                  <Button 
                    onClick={() => switchUser(demoUser.id)}
                    disabled={isCurrent || isLoading}
                    className="w-full"
                    size="sm"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    {isCurrent ? 'Current User' : `Switch to ${demoUser.name}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p><strong>Test Instructions:</strong></p>
        <p>1. Switch to <strong>Creator</strong> user → Try to add stays/tours (should be blocked)</p>
        <p>2. Switch to <strong>Publisher</strong> user → Should be able to add/list everything</p>
        <p>3. Switch to <strong>Admin</strong> user → Full access to all features</p>
      </div>
    </div>
  );
}