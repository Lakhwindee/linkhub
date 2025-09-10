import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  DollarSign, TrendingUp, Eye, Clock, Briefcase, Crown, 
  Lock, Zap, Target, BarChart3, CreditCard, CheckCircle,
  Plus, MapPin, Users, Calendar, Building, User, Youtube,
  Play, Link as LinkIcon, Copy, Check, Loader2, AlertTriangle, X
} from "lucide-react";
import { Link } from "wouter";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { SubscriptionUpgrade } from "@/components/SubscriptionUpgrade";

export default function Ads() {
  const { user, isAuthenticated } = useAuth();
  const { 
    isFree, 
    isStandard, 
    isPremium, 
    canViewCampaigns, 
    canApplyCampaigns, 
    canAccessAnalytics, 
    canAccessPayouts 
  } = usePlanAccess();
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  

  // Demo campaigns data
  const campaigns = [
    {
      id: "ad-1",
      title: "Travel Photography Campaign",
      brand: "Canon",
      category: "Photography",
      payPerPost: "$150-250",
      description: "Showcase travel destinations with Canon cameras and lenses",
      requirements: "10k+ followers, travel content focus",
      deadline: "Jan 31, 2025",
      budget: "$2,500",
      spots: "15 spots available",
      tags: ["travel", "photography", "canon"],
      restricted: false
    }
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 py-20">
            <Lock className="w-16 h-16 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-bold">Sign in to access Campaign features</h1>
            <p className="text-muted-foreground">Manage your advertising campaigns and brand partnerships</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              Campaigns
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your advertising campaigns and brand partnerships
            </p>
          </div>
          
          {/* Plan Status Badge */}
          <div className="flex items-center gap-3">
            <Badge variant={isPremium ? "default" : isStandard ? "secondary" : "outline"} className="text-sm">
              {isPremium && <Crown className="w-4 h-4 mr-1" />}
              {user?.plan === 'free' ? 'Free Plan' : user?.plan === 'standard' ? 'Standard Plan' : 'Premium Plan'}
            </Badge>
            {!isPremium && (
              <Button asChild size="sm">
                <Link href="/subscribe">Upgrade to Premium</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Tabs with consistent capability-based gating */}
        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList className="w-full flex md:grid md:grid-cols-5 overflow-x-auto md:overflow-x-visible gap-1 scrollbar-hide">
            {/* Campaigns Tab - All users can view, but with different capabilities */}
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="campaigns" className="text-xs md:text-sm whitespace-nowrap min-w-fit">
                  <span className="flex items-center gap-2">
                    Available Campaigns
                    {!canViewCampaigns && <Lock className="w-3 h-3 text-red-500" />}
                  </span>
                </TabsTrigger>
              </TooltipTrigger>
              {!canViewCampaigns && (
                <TooltipContent>
                  <p>Upgrade to Standard or Premium to view campaigns</p>
                </TooltipContent>
              )}
            </Tooltip>

            {/* My Campaigns Tab - Standard+ can view */}
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="mycampaigns" className="text-xs md:text-sm whitespace-nowrap min-w-fit">
                  <span className="flex items-center gap-2">
                    My Campaigns
                    {!canViewCampaigns && <Lock className="w-3 h-3 text-red-500" />}
                  </span>
                </TabsTrigger>
              </TooltipTrigger>
              {!canViewCampaigns && (
                <TooltipContent>
                  <p>Upgrade to Standard or Premium to track your campaigns</p>
                </TooltipContent>
              )}
            </Tooltip>

            {/* Earnings Tab - Premium only */}
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="earnings" className="text-xs md:text-sm whitespace-nowrap min-w-fit">
                  <span className="flex items-center gap-2">
                    Earnings
                    {!isPremium && <Lock className="w-3 h-3 text-red-500" />}
                  </span>
                </TabsTrigger>
              </TooltipTrigger>
              {!isPremium && (
                <TooltipContent>
                  <p>Upgrade to Premium to track your earnings</p>
                </TooltipContent>
              )}
            </Tooltip>

            {/* Analytics Tab - Premium only */}
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="analytics" className="text-xs md:text-sm whitespace-nowrap min-w-fit">
                  <span className="flex items-center gap-2">
                    Analytics
                    {!canAccessAnalytics && <Lock className="w-3 h-3 text-red-500" />}
                  </span>
                </TabsTrigger>
              </TooltipTrigger>
              {!canAccessAnalytics && (
                <TooltipContent>
                  <p>Upgrade to Premium to access performance insights</p>
                </TooltipContent>
              )}
            </Tooltip>

            {/* Payouts Tab - Premium only */}
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="payouts" className="text-xs md:text-sm whitespace-nowrap min-w-fit">
                  <span className="flex items-center gap-2">
                    Payouts
                    {!canAccessPayouts && <Lock className="w-3 h-3 text-red-500" />}
                  </span>
                </TabsTrigger>
              </TooltipTrigger>
              {!canAccessPayouts && (
                <TooltipContent>
                  <p>Upgrade to Premium to manage your payouts</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TabsList>


            <TabsContent value="campaigns">
              {!canViewCampaigns ? (
                <div className="text-center py-12">
                  <Lock className="w-12 h-12 mx-auto mb-4 text-red-500" />
                  <h3 className="text-lg font-semibold mb-2">Campaigns Locked</h3>
                  <p className="text-muted-foreground mb-4">Upgrade to Standard or Premium to view available campaigns</p>
                  <Button asChild size="sm">
                    <Link href="/subscribe">Upgrade Now</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6">
                  {campaigns.map((campaign) => (
                    <Card key={campaign.id} className={!canApplyCampaigns ? "relative overflow-hidden" : ""}>
                      {!canApplyCampaigns && (
                        <div className="absolute top-4 right-4 z-20">
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="bg-amber-500 text-white rounded-full p-1">
                                <Lock className="w-4 h-4" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Upgrade to Premium to apply for campaigns</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {campaign.title}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">{campaign.brand}</p>
                            <Badge variant="outline" className="mt-2">{campaign.category}</Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">{campaign.payPerPost}</div>
                            <div className="text-sm text-muted-foreground">per post</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">{campaign.description}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>Closes {campaign.deadline}</span>
                          </div>
                          {canApplyCampaigns ? (
                            <Button>
                              Apply Now
                            </Button>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  onClick={() => setShowUpgradeDialog(true)}
                                  className="relative cursor-pointer bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                                  variant="outline"
                                >
                                  <Lock className="w-4 h-4 mr-2" />
                                  Premium Required
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Click to upgrade to Premium and apply for campaigns</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        {!canApplyCampaigns && (
                          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                              <Lock className="w-4 h-4" />
                              {isStandard ? 'Upgrade to Premium to apply for campaigns' : 'Upgrade to Premium to apply for campaigns'}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="mycampaigns">
              {!canViewCampaigns ? (
                <div className="text-center py-12">
                  <Lock className="w-12 h-12 mx-auto mb-4 text-red-500" />
                  <h3 className="text-lg font-semibold mb-2">My Campaigns Locked</h3>
                  <p className="text-sm text-muted-foreground mb-4">Upgrade to Standard or Premium to track your campaigns</p>
                  <Button asChild size="sm">
                    <Link href="/subscribe">Upgrade Now</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Reserved Campaigns</h3>
                  <p className="text-muted-foreground">
                    {canApplyCampaigns ? 'Apply to campaigns to see them here' : 'Upgrade to Premium to apply for campaigns'}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="earnings">
              {!isPremium ? (
                <div className="text-center py-12">
                  <Lock className="w-12 h-12 mx-auto mb-4 text-red-500" />
                  <h3 className="text-lg font-semibold mb-2">Earnings Dashboard Locked</h3>
                  <p className="text-sm text-muted-foreground mb-4">Upgrade to Premium to track your earnings</p>
                  <Button asChild size="sm">
                    <Link href="/subscribe">Upgrade to Premium</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Earnings Yet</h3>
                  <p className="text-muted-foreground">Complete campaigns to start earning</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics">
              {!canAccessAnalytics ? (
                <div className="text-center py-12">
                  <Lock className="w-12 h-12 mx-auto mb-4 text-red-500" />
                  <h3 className="text-lg font-semibold mb-2">Analytics Locked</h3>
                  <p className="text-sm text-muted-foreground mb-4">Upgrade to Premium to access performance insights</p>
                  <Button asChild size="sm">
                    <Link href="/subscribe">Upgrade to Premium</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                  <p className="text-muted-foreground">Track your campaign performance</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="payouts">
              {!canAccessPayouts ? (
                <div className="text-center py-12">
                  <Lock className="w-12 h-12 mx-auto mb-4 text-red-500" />
                  <h3 className="text-lg font-semibold mb-2">Payouts Locked</h3>
                  <p className="text-sm text-muted-foreground mb-4">Upgrade to Premium to manage your payouts</p>
                  <Button asChild size="sm">
                    <Link href="/subscribe">Upgrade to Premium</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Payouts Available</h3>
                  <p className="text-muted-foreground">Complete campaigns to receive payouts</p>
                </div>
              )}
            </TabsContent>

        </Tabs>
        
        {/* Upgrade Dialog */}
        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upgrade Required</DialogTitle>
              <DialogDescription>
                You need a Premium plan to apply for campaigns and access all monetization features.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Premium Plan</h3>
                  <p className="text-sm text-muted-foreground">Full access to campaigns, analytics, and payouts</p>
                </div>
                <Button asChild>
                  <Link href="/subscribe">Upgrade Now</Link>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
      </div>
    </div>
    </TooltipProvider>
  );
}