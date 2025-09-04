import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Lock, Star } from "lucide-react";
import { Link } from "wouter";
import { usePlanAccess } from "@/hooks/usePlanAccess";

interface SubscriptionUpgradeProps {
  feature: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  showCompact?: boolean;
}

export function SubscriptionUpgrade({ 
  feature, 
  description, 
  size = "md", 
  showCompact = false 
}: SubscriptionUpgradeProps) {
  const { isFree, isStandard, isPremium } = usePlanAccess();

  if (isPremium) {
    return null; // Don't show upgrade prompt for premium users
  }

  if (showCompact) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Crown className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Upgrade Required</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">{feature}</p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link href="/subscribe">Upgrade</Link>
          </Button>
        </div>
      </div>
    );
  }

  const cardClass = size === "lg" ? "max-w-2xl mx-auto" : size === "sm" ? "max-w-sm" : "max-w-md mx-auto";

  return (
    <Card className={`${cardClass} border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/10 dark:to-yellow-950/10`}>
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center mb-4">
          {isFree ? <Crown className="w-8 h-8 text-white" /> : <Star className="w-8 h-8 text-white" />}
        </div>
        <CardTitle className="text-xl text-orange-900 dark:text-orange-100">
          {isFree ? "Unlock Premium Features" : "Upgrade to Premium Earner"}
        </CardTitle>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
          <h4 className="font-semibold mb-2 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            {feature}
          </h4>
          {isFree && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline">Standard - $25/mo</Badge>
                <span className="text-muted-foreground">View campaigns</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500">Premium - $45/mo</Badge>
                <span className="text-muted-foreground">Apply & earn</span>
              </div>
            </div>
          )}
          {isStandard && (
            <div className="text-sm">
              <div className="flex items-center justify-center gap-2">
                <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500">Premium Earner - $45/mo</Badge>
                <span className="text-muted-foreground">Apply to campaigns & start earning</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 justify-center">
          {isFree && (
            <Button variant="outline" asChild>
              <Link href="/subscribe">Standard $25</Link>
            </Button>
          )}
          <Button asChild className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
            <Link href="/subscribe">
              <Zap className="w-4 h-4 mr-2" />
              {isFree ? "Premium $45" : "Upgrade $45"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for inline use
export function InlineUpgrade({ feature }: { feature: string }) {
  return <SubscriptionUpgrade feature={feature} showCompact />;
}