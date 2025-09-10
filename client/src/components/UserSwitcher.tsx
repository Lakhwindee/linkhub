import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Eye, Settings, Shield, RefreshCw } from 'lucide-react';

interface UserOption {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: React.ReactNode;
  badgeColor: string;
}

const userOptions: UserOption[] = [
  {
    id: 'demo-creator',
    name: 'Creator User',
    role: 'creator',
    description: 'View-only access. Can browse all content but cannot create listings.',
    icon: <Eye className="w-5 h-5" />,
    badgeColor: 'bg-blue-500',
  },
  {
    id: 'demo-publisher',
    name: 'Publisher User',
    role: 'publisher',
    description: 'Full business access. Can create stays, tours, host listings, and ads.',
    icon: <Settings className="w-5 h-5" />,
    badgeColor: 'bg-green-500',
  },
  {
    id: 'demo-admin',
    name: 'Admin User',
    role: 'admin',
    description: 'Platform administrator with full system access and management tools.',
    icon: <Shield className="w-5 h-5" />,
    badgeColor: 'bg-red-500',
  },
];

export function UserSwitcher() {
  const switchUser = (userId: string) => {
    // Set the demo session
    localStorage.setItem('demo-session', `demo-session-${userId}`);
    document.cookie = `session_id=demo-session-${userId}; path=/`;
    
    // Reload the page to apply changes
    window.location.reload();
  };

  const getCurrentUserId = () => {
    const session = localStorage.getItem('demo-session');
    if (session) {
      return session.replace('demo-session-', '');
    }
    return 'demo-admin'; // default
  };

  const currentUserId = getCurrentUserId();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-6 h-6" />
          Switch User Role
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test different user permissions by switching roles. Current user: <strong>{currentUserId}</strong>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {userOptions.map((user) => (
          <div
            key={user.id}
            className={`p-4 border rounded-lg transition-all ${
              currentUserId === user.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full text-white ${user.badgeColor}`}>
                  {user.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{user.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                    {currentUserId === user.id && (
                      <Badge className="text-xs bg-green-500">Active</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {user.description}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => switchUser(user.id)}
                disabled={currentUserId === user.id}
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {currentUserId === user.id ? 'Current' : 'Switch'}
              </Button>
            </div>
          </div>
        ))}
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Testing Guidelines:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Creator:</strong> Can view all content but cannot create listings</li>
            <li>• <strong>Publisher:</strong> Can create and manage business listings</li>
            <li>• <strong>Admin:</strong> Full platform access with admin panel</li>
            <li>• Switch users to test different permission levels</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}