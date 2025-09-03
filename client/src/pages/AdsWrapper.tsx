import { useAuth } from "@/hooks/useAuth";
import AdMarketplace from "@/pages/AdMarketplace";
import PublisherAds from "@/pages/PublisherAds";

export default function AdsWrapper() {
  const { user } = useAuth();

  // Show publisher ads page for publisher role
  if (user?.role === 'publisher') {
    return <PublisherAds />;
  }

  // Show regular ad marketplace for creators and others
  return <AdMarketplace />;
}