// Role-based permission system

export type UserRole = 'traveler' | 'creator' | 'stays' | 'promotional' | 'tour_package' | 'publisher' | 'admin' | 'superadmin';

export interface User {
  id: string;
  role?: UserRole | string;
  plan?: string;
  [key: string]: any;
}

// Permission checker functions
export const permissions = {
  // Stays permissions - Only Publishers can create, Creators can only view
  canCreateStays: (user: User | null): boolean => {
    if (!user?.role) return false;
    return ['publisher', 'admin', 'superadmin'].includes(user.role as string);
  },

  canViewStays: (user: User | null): boolean => {
    return true; // All users can view stays
  },

  canManageStays: (user: User | null): boolean => {
    if (!user?.role) return false;
    return ['publisher', 'admin', 'superadmin'].includes(user.role as string);
  },

  // Tour Package permissions - Only Publishers can create, Creators can only view
  canCreateTourPackages: (user: User | null): boolean => {
    if (!user?.role) return false;
    return ['publisher', 'admin', 'superadmin'].includes(user.role as string);
  },

  canViewTourPackages: (user: User | null): boolean => {
    return true; // All users can view tour packages
  },

  canManageTourPackages: (user: User | null): boolean => {
    if (!user?.role) return false;
    return ['publisher', 'admin', 'superadmin'].includes(user.role as string);
  },

  // Promotional/Ads permissions - Only Publishers can create
  canCreateAds: (user: User | null): boolean => {
    if (!user?.role) return false;
    return ['publisher', 'admin', 'superadmin'].includes(user.role as string);
  },

  canViewAds: (user: User | null): boolean => {
    return true; // All users can view ads
  },

  canManageAds: (user: User | null): boolean => {
    if (!user?.role) return false;
    return ['publisher', 'admin', 'superadmin'].includes(user.role as string);
  },

  // Trip permissions
  canCreateTrips: (user: User | null): boolean => {
    return true; // All authenticated users can create trips
  },

  canViewTrips: (user: User | null): boolean => {
    return true; // All users can view trips
  },

  canJoinTrips: (user: User | null): boolean => {
    return true; // All authenticated users can join trips
  },

  // Admin permissions
  canAccessAdmin: (user: User | null): boolean => {
    if (!user?.role) return false;
    return ['admin', 'superadmin'].includes(user.role as string);
  },

  canModerateContent: (user: User | null): boolean => {
    if (!user?.role) return false;
    return ['admin', 'superadmin'].includes(user.role as string);
  },

  // General permissions
  canCreateContent: (user: User | null, contentType: 'stays' | 'tour_packages' | 'ads'): boolean => {
    switch (contentType) {
      case 'stays':
        return permissions.canCreateStays(user);
      case 'tour_packages':
        return permissions.canCreateTourPackages(user);
      case 'ads':
        return permissions.canCreateAds(user);
      default:
        return false;
    }
  },

  // Role display helpers
  getRoleDisplayName: (role: UserRole): string => {
    switch (role) {
      case 'traveler':
        return 'General Traveler';
      case 'creator':
        return 'Creator (View Only)';
      case 'stays':
        return 'Stays Provider';
      case 'promotional':
        return 'Promotional/Ads';
      case 'tour_package':
        return 'Tour Package Provider';
      case 'publisher':
        return 'Content Publisher';
      case 'admin':
        return 'Administrator';
      case 'superadmin':
        return 'Super Administrator';
      default:
        return 'General Traveler';
    }
  },

  getRoleDescription: (role: UserRole): string => {
    switch (role) {
      case 'traveler':
        return 'Can view and participate in all content but cannot create specialized listings';
      case 'creator':
        return 'Can VIEW all content but CANNOT create stays, tours, or business listings';
      case 'stays':
        return 'Legacy role - use Publisher instead';
      case 'promotional':
        return 'Legacy role - use Publisher instead';
      case 'tour_package':
        return 'Legacy role - use Publisher instead';
      case 'publisher':
        return 'Can create and manage stays, tour packages, personal hosts, and advertisements';
      case 'admin':
        return 'Can manage all content and moderate the platform';
      case 'superadmin':
        return 'Full platform access and administration';
      default:
        return 'Can view and participate in all content but cannot create specialized listings';
    }
  },

  getAllRoles: (): UserRole[] => {
    return ['traveler', 'creator', 'stays', 'promotional', 'tour_package', 'publisher', 'admin', 'superadmin'];
  },

  // Role validation
  isValidRole: (role: string): role is UserRole => {
    return ['traveler', 'creator', 'stays', 'promotional', 'tour_package', 'publisher', 'admin', 'superadmin'].includes(role as UserRole);
  },

  // Check if user should see limited navigation (publisher role)
  shouldShowLimitedNavigation: (user: User | null): boolean => {
    return user?.role === 'publisher';
  }
};

// Hook for using permissions in components
export const usePermissions = (user: User | null) => {
  return {
    canCreateStays: permissions.canCreateStays(user),
    canViewStays: permissions.canViewStays(user),
    canManageStays: permissions.canManageStays(user),
    
    canCreateTourPackages: permissions.canCreateTourPackages(user),
    canViewTourPackages: permissions.canViewTourPackages(user),
    canManageTourPackages: permissions.canManageTourPackages(user),
    
    canCreateAds: permissions.canCreateAds(user),
    canViewAds: permissions.canViewAds(user),
    canManageAds: permissions.canManageAds(user),
    
    canCreateTrips: permissions.canCreateTrips(user),
    canViewTrips: permissions.canViewTrips(user),
    canJoinTrips: permissions.canJoinTrips(user),
    
    canAccessAdmin: permissions.canAccessAdmin(user),
    canModerateContent: permissions.canModerateContent(user),
    
    userRole: user?.role || 'traveler',
    roleDisplayName: permissions.getRoleDisplayName((user?.role as UserRole) || 'traveler'),
    roleDescription: permissions.getRoleDescription((user?.role as UserRole) || 'traveler')
  };
};