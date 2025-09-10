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
  
  const isFree = plan === 'free';
  const isStandard = plan === 'standard';
  const isPremium = plan === 'premium';
  
  return {
    isFree,
    isStandard,
    isPremium,
    canViewCampaigns: true, // FREE CREATORS can VIEW campaigns with lock indicators
    canApplyCampaigns: isPremium,
    canAccessWallet: isPremium,
    canAccessAnalytics: isPremium,
    canAccessPayouts: isPremium,
    hasEarnAccess: true, // Allow all users to access earn menu
  };
}