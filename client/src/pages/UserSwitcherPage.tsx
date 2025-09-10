import React from 'react';
import { UserSwitcher } from '@/components/UserSwitcher';

export function UserSwitcherPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">User Role Testing</h1>
            <p className="text-muted-foreground">
              Switch between different user roles to test platform permissions and features
            </p>
          </div>
          
          <UserSwitcher />
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              After switching users, the page will automatically reload to apply the new permissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}