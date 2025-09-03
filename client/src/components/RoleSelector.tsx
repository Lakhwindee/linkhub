import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { permissions, type UserRole } from "@/lib/permissions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Shield, Home, DollarSign, Package, User, Globe } from "lucide-react";

interface RoleSelectorProps {
  currentRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  disabled?: boolean;
}

export function RoleSelector({ currentRole = 'traveler', onRoleChange, disabled = false }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [isOpen, setIsOpen] = useState(false);

  const handleRoleChange = () => {
    if (onRoleChange) {
      onRoleChange(selectedRole);
    }
    // In a real app, this would make an API call to update the user's role
    console.log('Role changed to:', selectedRole);
    setIsOpen(false);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'traveler':
        return User;
      case 'stays':
        return Home;
      case 'promotional':
        return DollarSign;
      case 'tour_package':
        return Package;
      case 'publisher':
        return Globe;
      case 'admin':
      case 'superadmin':
        return Shield;
      default:
        return User;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'traveler':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'stays':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'promotional':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'tour_package':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'publisher':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'superadmin':
        return 'bg-gray-900 text-white border-gray-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const allRoles = permissions.getAllRoles();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled} className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Change Role
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Your Role</DialogTitle>
          <DialogDescription>
            Choose the role that best describes what you want to do on HubLink. You can change this later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3">
            {allRoles.map((role) => {
              const Icon = getRoleIcon(role);
              const isSelected = selectedRole === role;
              const isCurrent = currentRole === role;
              
              return (
                <Card 
                  key={role}
                  className={`cursor-pointer transition-all border-2 ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedRole(role)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getRoleColor(role)}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm">
                            {permissions.getRoleDisplayName(role)}
                          </h3>
                          <div className="flex gap-2">
                            {isCurrent && (
                              <Badge variant="secondary" className="text-xs">
                                Current
                              </Badge>
                            )}
                            {isSelected && (
                              <Badge className="text-xs">
                                Selected
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {permissions.getRoleDescription(role)}
                        </p>
                        
                        {/* Show permissions for this role */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {role === 'traveler' && (
                            <>
                              <Badge variant="outline" className="text-xs">View All Content</Badge>
                              <Badge variant="outline" className="text-xs">Join Trips</Badge>
                              <Badge variant="outline" className="text-xs">Book Stays</Badge>
                            </>
                          )}
                          {role === 'stays' && (
                            <>
                              <Badge variant="outline" className="text-xs">Create Stays</Badge>
                              <Badge variant="outline" className="text-xs">Manage Listings</Badge>
                              <Badge variant="outline" className="text-xs">View All Content</Badge>
                            </>
                          )}
                          {role === 'promotional' && (
                            <>
                              <Badge variant="outline" className="text-xs">Create Ads</Badge>
                              <Badge variant="outline" className="text-xs">Manage Campaigns</Badge>
                              <Badge variant="outline" className="text-xs">View All Content</Badge>
                            </>
                          )}
                          {role === 'tour_package' && (
                            <>
                              <Badge variant="outline" className="text-xs">Create Tour Packages</Badge>
                              <Badge variant="outline" className="text-xs">Manage Bookings</Badge>
                              <Badge variant="outline" className="text-xs">Budget Management</Badge>
                            </>
                          )}
                          {(role === 'admin' || role === 'superadmin') && (
                            <>
                              <Badge variant="outline" className="text-xs">Full Access</Badge>
                              <Badge variant="outline" className="text-xs">Moderate Content</Badge>
                              <Badge variant="outline" className="text-xs">Manage Users</Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleRoleChange}
            disabled={selectedRole === currentRole}
          >
            {selectedRole === currentRole ? 'Already Selected' : 'Confirm Role Change'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Quick role switcher for demo/development
export function QuickRoleSwitch() {
  const { user } = useAuth();
  const [currentRole, setCurrentRole] = useState<UserRole>(user?.role as UserRole || 'traveler');

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    // For demo purposes, we'll show a toast
    // In a real app, this would update the user's role in the database
    console.log('Demo role switched to:', newRole);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Demo Role:</span>
      <Badge variant="outline" className={getRoleColor(currentRole)}>
        {permissions.getRoleDisplayName(currentRole)}
      </Badge>
      <RoleSelector 
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
      />
    </div>
  );
}

function getRoleColor(role: UserRole) {
  switch (role) {
    case 'traveler':
      return 'bg-blue-100 text-blue-800';
    case 'stays':
      return 'bg-green-100 text-green-800';
    case 'promotional':
      return 'bg-purple-100 text-purple-800';
    case 'tour_package':
      return 'bg-orange-100 text-orange-800';
    case 'admin':
      return 'bg-red-100 text-red-800';
    case 'superadmin':
      return 'bg-gray-900 text-white';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}