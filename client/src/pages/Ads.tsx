import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  DollarSign, TrendingUp, Eye, Clock, Briefcase, Crown, 
  Lock, Zap, Target, BarChart3, CreditCard, CheckCircle,
  Plus, MapPin, Users, Calendar, Building, User, Youtube,
  Play, Link as LinkIcon, Copy, Check, Loader2, AlertTriangle
} from "lucide-react";
import { Link } from "wouter";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { SubscriptionUpgrade } from "@/components/SubscriptionUpgrade";

export default function Ads() {
  const { user, isAuthenticated } = useAuth();
  const { isFree, isStandard, isPremium } = usePlanAccess();
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  

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
            <h1 className="text-2xl font-bold">Sign in to access Earn features</h1>
            <p className="text-muted-foreground">Connect with brands and monetize your travel content</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              Earn with Travel Content
            </h1>
            <p className="text-muted-foreground mt-2">
              Connect with brands and monetize your travel experiences
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

        {/* Tabs - Now accessible to all users */}
        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="campaigns">Available Campaigns</TabsTrigger>
            <TabsTrigger value="mycampaigns">My Campaigns</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>


            <TabsContent value="campaigns">
              {(isStandard || isPremium) ? (
                <div className="grid gap-6">
                  {campaigns.map((campaign) => (
                    <Card key={campaign.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{campaign.title}</CardTitle>
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
                          <Button disabled={!isPremium}>
                            {isPremium ? "Apply Now" : "Premium Required"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <SubscriptionUpgrade 
                  feature="View and Apply to Brand Campaigns"
                  description="Connect with brands and start earning from sponsored content"
                  size="lg"
                />
              )}
            </TabsContent>

            <TabsContent value="mycampaigns">
              {(isStandard || isPremium) ? (
                <div className="text-center py-12">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Reserved Campaigns</h3>
                  <p className="text-muted-foreground">Apply to campaigns to see them here</p>
                </div>
              ) : (
                <SubscriptionUpgrade 
                  feature="Track Your Reserved Campaigns"
                  description="View and manage campaigns you've applied to"
                  size="lg"
                />
              )}
            </TabsContent>

            <TabsContent value="earnings">
              {isPremium ? (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Earnings Yet</h3>
                  <p className="text-muted-foreground">Complete campaigns to start earning</p>
                </div>
              ) : (
                <SubscriptionUpgrade 
                  feature="View Your Earnings Dashboard"
                  description="Track payments and revenue from completed campaigns"
                  size="lg"
                />
              )}
            </TabsContent>

            <TabsContent value="analytics">
              {isPremium ? (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                  <p className="text-muted-foreground">Track your campaign performance</p>
                </div>
              ) : (
                <SubscriptionUpgrade 
                  feature="Access Performance Analytics"
                  description="Get insights into your campaign performance and engagement"
                  size="lg"
                />
              )}
            </TabsContent>

            <TabsContent value="payouts">
              {isPremium ? (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Payouts Available</h3>
                  <p className="text-muted-foreground">Complete campaigns to receive payouts</p>
                </div>
              ) : (
                <SubscriptionUpgrade 
                  feature="Manage Your Payouts"
                  description="Set up payment methods and withdraw your earnings"
                  size="lg"
                />
              )}
            </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}