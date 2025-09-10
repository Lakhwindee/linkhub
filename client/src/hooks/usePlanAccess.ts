import { useAuth } from "@/hooks/useAuth";

export interface PlanAccess {
  isFree: boolean;
  isStandard: boolean;
  isPremium: boolean;
  canViewCampaigns: boolean;
  canApplyCampaigns: boolean;
  canAccessWallet: boolean;
  canAccessAnalytics: boolean;
  canAccessPayouts: boolean;
  hasEarnAccess: boolean;
}

export function usePlanAccess(): PlanAccess {
  const { user } = useAuth();
  
  const plan = user?.plan || 'free';
  const role = user?.role || 'user';
  
  const isFree = plan === 'free';
  const isStandard = plan === 'standard';
  const isPremium = plan === 'premium';
  
  // Only creator and free_creator roles can view campaigns
  const isCreatorRole = role === 'creator' || role === 'free_creator';
  
  return {
    isFree,
    isStandard,
    isPremium,
    canViewCampaigns: isCreatorRole, // Only creator/free_creator can view campaigns
    canApplyCampaigns: isCreatorRole && isPremium, // Only premium creators can apply
    canAccessWallet: isPremium,
    canAccessAnalytics: isPremium,
    canAccessPayouts: isPremium,
    hasEarnAccess: isCreatorRole, // Only creators see earn menu
  };
}