import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, User, Briefcase } from 'lucide-react';

const demoUsers = [
  {
    id: 'demo-admin',
    name: 'System Administrator',
    email: 'admin@hublink.com',
    role: 'admin',
    plan: 'premium',
    description: 'Full platform access - can manage everything',
    icon: Crown,
    color: 'bg-red-500'
  },
  {
    id: 'demo-creator',
    name: 'Demo Creator',
    email: 'creator@hublink.com',
    role: 'creator',
    plan: 'creator',
    description: 'Can VIEW stays/tours/hosts but cannot ADD/LIST them',
    icon: User,
    color: 'bg-blue-500'
  },
  {
    id: 'demo-publisher',
    name: 'Demo Publisher',
    email: 'publisher@hublink.com',
    role: 'publisher',
    plan: 'premium',
    description: 'Can ADD/LIST stays, tours, hosts, and ads',
    icon: Briefcase,
    color: 'bg-green-500'
  }
];

export function DemoUserSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState('demo-admin');

  const switchUser = (userId: string) => {
    // Set demo session in localStorage for header auth
    localStorage.setItem('demo-session', `demo-session-${userId}`);
    
    // Set session cookie
    document.cookie = `session_id=demo-session-${userId}; path=/`;
    
    setCurrentUser(userId);
    setIsOpen(false);
    
    // Reload page to apply new user session
    window.location.reload();
  };

  const current = demoUsers.find(u => u.id === currentUser);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="w-4 h-4" />
          Switch Demo User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Demo User Switcher</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Switch between different user roles to test permissions
          </p>
        </DialogHeader>
        
        <div className="grid gap-4">
          {demoUsers.map((user) => {
            const Icon = user.icon;
            const isCurrent = user.id === currentUser;
            
            return (
              <Card 
                key={user.id} 
                className={`cursor-pointer border-2 transition-colors ${
                  isCurrent ? 'border-primary bg-muted/50' : 'border-muted hover:border-muted-foreground'
                }`}
                onClick={() => switchUser(user.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${user.color} text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {user.name}
                        {isCurrent && <Badge variant="secondary">Current</Badge>}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {user.email}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        {user.role}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {user.plan} plan
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    {user.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}