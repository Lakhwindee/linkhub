import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import PublisherAds from "./PublisherAds";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DollarSign, TrendingUp, Eye, Clock, Briefcase, Crown, 
  Lock, Zap, Target, BarChart3, CreditCard, CheckCircle,
  Plus, MapPin, Users, Calendar, Building, User, Youtube,
  AlertCircle, ExternalLink, Copy, CheckCircle2
} from "lucide-react";
import { Link } from "wouter";
import { usePlanAccess } from "@/hooks/usePlanAccess";

export default function Ads() {
  const { user, isAuthenticated } = useAuth();
  const { isFree, isStandard, isPremium } = usePlanAccess();
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [demoDisconnected, setDemoDisconnected] = useState(false);

  const queryClient = useQueryClient();

  // YouTube Disconnect Mutation
  const disconnectYouTube = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/youtube/disconnect");
      return response.json();
    },
    onSuccess: (data) => {
      // Clear the input field immediately
      setYoutubeUrl("");
      
      // For demo user, update local state 
      const isDemoUser = user?.id?.includes('demo');
      if (isDemoUser) {
        setDemoDisconnected(true);
        localStorage.setItem('demo_youtube_disconnected', 'true');
      }
      
      console.log('Channel disconnected successfully');
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      console.log('Disconnect Failed:', error.message);
    },
  });

  const handleDisconnect = () => {
    if (confirm("Are you sure you want to disconnect your YouTube channel? This will remove access to all earning campaigns.")) {
      disconnectYouTube.mutate();
    }
  };

  // Mock campaign data
  const campaigns = [
    {
      id: "campaign-1",
      brand: "Visit Dubai Tourism",
      title: "Luxury Desert Experience Campaign",
      description: "Promote Dubai's premium desert safari and luxury camp experience",
      budget: "$2,500",
      payPerPost: "$150-250",
      requirements: "10k+ followers, Travel content, English speaking",
      deadline: "Dec 15, 2024",
      spots: "15 spots available",
      category: "Travel & Tourism",
      tags: ["luxury", "desert", "dubai", "experience"],
      restricted: user?.plan !== 'premium'
    },
    {
      id: "campaign-2", 
      brand: "Airbnb Plus",
      title: "Unique Stays Content Series",
      description: "Showcase unique accommodations and local experiences",
      budget: "$3,000",
      payPerPost: "$200-350",
      requirements: "5k+ followers, Photography skills, Any language",
      deadline: "Jan 20, 2025",
      spots: "8 spots available",
      category: "Accommodation",
      tags: ["stays", "unique", "local", "photography"],
      restricted: user?.plan !== 'premium'
    },
    {
      id: "campaign-3",
      brand: "GoPro Adventure",
      title: "Action Travel Content Challenge",
      description: "Create epic adventure travel content using GoPro cameras",
      budget: "$5,000",
      payPerPost: "$300-500",
      requirements: "15k+ followers, Action/Adventure content, Equipment provided",
      deadline: "Feb 10, 2025",
      spots: "5 spots available",
      category: "Adventure Sports",
      tags: ["action", "adventure", "gopro", "equipment"],
      restricted: user?.plan !== 'premium'
    }
  ];

  const earnings = {
    thisMonth: 1250,
    lastMonth: 980,
    pending: 450,
    lifetime: 8900
  };

  const stats = {
    totalCampaigns: 12,
    activeCampaigns: 3,
    completedCampaigns: 9,
    approvalRate: 87
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 py-20">
            <Lock className="w-16 h-16 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-bold">Sign in to access Earn features</h1>
            <p className="text-muted-foreground">Connect with brands and monetize your travel content</p>
            <Button asChild>
              <Link href="/professional-signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }


  // Role-based routing: Publishers see PublisherAds, Creators see YouTube Creator Dashboard
  if (user?.role === '2' || user?.role === 'publisher') {
    return <PublisherAds />;
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
              {user.plan === 'free' ? 'Free Plan' : user.plan === 'standard' ? 'Standard Plan' : 'Premium Plan'}
            </Badge>
            {!isPremium && (
              <Button asChild size="sm">
                <Link href="/subscribe">Upgrade to Premium</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Restriction Alert for Non-Premium Users */}
        {!isPremium && (
          <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/10">
            <Lock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              {isFree && (
                <>You're on the Free plan. Upgrade to <strong>Standard ($25/mo)</strong> to view campaigns or <strong>Premium Earner ($45/mo)</strong> to apply and earn.</>
              )}
              {isStandard && (
                <>You're on the Standard plan. You can view campaigns but need <strong>Premium Earner ($45/mo)</strong> to apply and start earning. <Link href="/subscribe" className="underline font-medium">Upgrade now</Link></>
              )}
            </AlertDescription>
          </Alert>
        )}

        {isPremium && (
          <Tabs defaultValue="youtube-creator" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="youtube-creator">YouTube Creator</TabsTrigger>
              <TabsTrigger value="campaigns">Available Campaigns</TabsTrigger>
              <TabsTrigger value="mycampaigns">My Campaigns</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
            </TabsList>

            {/* YouTube Creator Dashboard */}
            <TabsContent value="youtube-creator" className="space-y-6">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                    <Youtube className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-red-900 dark:text-red-100">YouTube Creator Dashboard</h2>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Discover brand campaigns and start earning from your content
                    </p>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{user?.youtubeSubscribers?.toLocaleString() || '0'}</div>
                      <div className="text-sm text-muted-foreground">subscribers</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-lg font-semibold text-blue-600">Established Creator</div>
                      <div className="text-sm text-muted-foreground">{user?.youtubeSubscribers && user.youtubeSubscribers > 70000 ? '70K+ subscribers range' : 'Growing'}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Button variant="outline" size="sm" className="text-xs">
                        Tier {user?.youtubeTier || 1}
                      </Button>
                      <div className="text-sm text-muted-foreground mt-1">Status</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-lg font-semibold text-orange-600">Channel Not Verified</div>
                      <div className="text-sm text-muted-foreground">Verification required to earn money</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Channel Connection Section */}
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-700">
                      <AlertCircle className="w-5 h-5" />
                      Verify Channel Ownership
                    </CardTitle>
                    <p className="text-sm text-orange-600">
                      To prove you own this channel, add this verification code to your channel description:
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* YouTube Channel URL Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-orange-800">YouTube Channel URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          placeholder="https://www.youtube.com/channel/YOUR_CHANNEL_ID"
                          className="flex-1 p-3 border rounded-lg bg-white text-sm"
                        />
                        <Button 
                          variant="outline" 
                          className="px-4 text-orange-700 border-orange-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-orange-600">
                        Enter your YouTube channel URL to get started
                      </p>
                    </div>

                    {/* Verification Code Display */}
                    {youtubeUrl && (
                      <>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border-2 border-dashed border-gray-300">
                          <div className="flex items-center justify-between">
                            <code className="text-sm font-mono">
                              HUBLINK-VERIFY-{Math.random().toString(36).substring(2, 15).toUpperCase()}
                            </code>
                            <Button variant="ghost" size="sm">
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-orange-800">Steps:</h4>
                          <ol className="text-sm text-orange-700 space-y-1 ml-4">
                            <li>1. Go to your YouTube Studio</li>
                            <li>2. Click "Customization" → "Basic Info"</li>
                            <li>3. Add this verification code above to your channel description</li>
                            <li>4. Save changes and click "Verify Channel Ownership" below</li>
                          </ol>
                        </div>

                        <Button 
                          className="w-full bg-orange-600 hover:bg-orange-700"
                          disabled={isVerifying}
                          onClick={() => setIsVerifying(true)}
                        >
                          {isVerifying ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Verifying...
                            </div>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Verify Channel Ownership
                            </>
                          )}
                        </Button>
                      </>
                    )}

                    {/* Disconnect Option - if channel is connected */}
                    {youtubeUrl && (
                      <div className="pt-4 border-t border-orange-200">
                        <p className="text-xs text-orange-600 mb-2">
                          Need to change your YouTube channel?
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleDisconnect}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          Disconnect YouTube Channel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Premium Earnings Dashboard */}
            <TabsContent value="earnings" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">${earnings.thisMonth}</div>
                    <p className="text-xs text-muted-foreground">+{((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth * 100).toFixed(1)}% from last month</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">${earnings.pending}</div>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Lifetime Earned</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${earnings.lifetime}</div>
                    <p className="text-xs text-muted-foreground">Total earnings</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{stats.approvalRate}%</div>
                    <p className="text-xs text-muted-foreground">Campaign approval rate</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Campaign Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Reserved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">5</div>
                    <p className="text-xs text-muted-foreground">Awaiting start</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{stats.activeCampaigns}</div>
                    <p className="text-xs text-muted-foreground">In progress</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.completedCampaigns}</div>
                    <p className="text-xs text-muted-foreground">Successfully finished</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">${earnings.lifetime}</div>
                    <p className="text-xs text-muted-foreground">All time earnings</p>
                  </CardContent>
                </Card>
              </div>

              {/* Campaign History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Recent Campaign Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Visit Dubai Tourism - Desert Campaign</div>
                        <div className="text-sm text-muted-foreground">Completed • Dec 15, 2024</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-600">$250.00</div>
                        <Badge className="bg-green-100 text-green-800">Completed</Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">GoPro Adventure Challenge</div>
                        <div className="text-sm text-muted-foreground">In Progress • Started Dec 20, 2024</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-blue-600">$400.00</div>
                        <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Airbnb Plus Unique Stays</div>
                        <div className="text-sm text-muted-foreground">Reserved • Starts Jan 5, 2025</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-orange-600">$300.00</div>
                        <Badge className="bg-orange-100 text-orange-800">Reserved</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payouts" className="space-y-6">
              {/* Available Balance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Available Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <div className="text-4xl font-bold text-green-600 mb-2">$1,250.00</div>
                    <p className="text-muted-foreground mb-4">Ready for payout</p>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Request Payout
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">Minimum payout: $50.00</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Bank Account Setup */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Bank Account Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Account Holder Name</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border rounded-lg bg-background" 
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Bank Name</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border rounded-lg bg-background" 
                          placeholder="HSBC Bank"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Account Number</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border rounded-lg bg-background" 
                          placeholder="12345678"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Sort Code</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border rounded-lg bg-background" 
                          placeholder="12-34-56"
                        />
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Bank Details
                    </Button>
                  </CardContent>
                </Card>

                {/* Payout History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Payout History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">$850.00</div>
                          <div className="text-sm text-muted-foreground">Dec 1, 2024</div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Completed</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">$650.00</div>
                          <div className="text-sm text-muted-foreground">Nov 15, 2024</div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Completed</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">$450.00</div>
                          <div className="text-sm text-muted-foreground">Nov 1, 2024</div>
                        </div>
                        <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="campaigns">
              <div className="grid gap-6">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="relative overflow-hidden">
                    {campaign.restricted && (
                      <div className="absolute top-0 right-0 bg-green-600 text-white px-2 py-1 text-xs">
                        Premium Access
                      </div>
                    )}
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
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">{campaign.description}</p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Requirements</h4>
                          <p className="text-sm text-muted-foreground">{campaign.requirements}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Campaign Details</h4>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>💰 Budget: {campaign.budget}</p>
                            <p>📅 Deadline: {campaign.deadline}</p>
                            <p>👥 {campaign.spots}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {campaign.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      
                      {campaign.restricted ? (
                        <div className="bg-orange-50 dark:bg-orange-950/10 border border-orange-200 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <Lock className="w-5 h-5 text-orange-600" />
                            <div>
                              <p className="font-medium text-orange-900 dark:text-orange-100">Premium Feature</p>
                              <p className="text-sm text-orange-700 dark:text-orange-300">
                                Upgrade to Premium Earner ($45/mo) to apply for campaigns and start earning
                              </p>
                            </div>
                          </div>
                          <Button className="w-full mt-3 bg-orange-500 hover:bg-orange-600" asChild>
                            <Link href="/subscribe">
                              <Crown className="w-4 h-4 mr-2" />
                              Upgrade to Premium
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => setSelectedCampaign(campaign.id)}
                        >
                          <Target className="w-4 h-4 mr-2" />
                          Reserve Campaign
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="mycampaigns">
              <div className="grid gap-6">
                {selectedCampaign ? (
                  <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/10">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">Visit Dubai Tourism - Desert Campaign</CardTitle>
                          <p className="text-sm text-muted-foreground">Visit Dubai Tourism</p>
                          <Badge className="mt-2 bg-blue-100 text-blue-800">Reserved</Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">$150-250</div>
                          <div className="text-sm text-muted-foreground">per post</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">Promote Dubai's premium desert safari and luxury camp experience</p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Next Steps</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Wait for brand approval</li>
                            <li>• Create content as per guidelines</li>
                            <li>• Submit for review</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Status</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Reserved:</span>
                              <span className="text-blue-600">✓ Done</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Approved:</span>
                              <span className="text-orange-600">Pending</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Content:</span>
                              <span className="text-gray-600">Not Started</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="outline" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View Campaign Details
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Reserved Campaigns</h3>
                    <p className="text-muted-foreground mb-4">Reserve campaigns from the Available Campaigns tab to see them here</p>
                    <Button variant="outline">
                      Browse Available Campaigns
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Restricted View for Standard/Free Users */}
        {!isPremium && (
          <div className="space-y-6">
            <div className="grid gap-6">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="relative overflow-hidden opacity-75">
                  <div className="absolute inset-0 bg-black/10 z-10 flex items-center justify-center">
                    <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-4 text-center">
                      <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <h3 className="font-semibold mb-2">Premium Feature</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {isFree ? "Upgrade to Standard to view campaigns" : "Upgrade to Premium Earner to apply"}
                      </p>
                      <Button asChild size="sm">
                        <Link href="/subscribe">
                          {isFree ? "Upgrade to Standard" : "Upgrade to Premium"}
                        </Link>
                      </Button>
                    </div>
                  </div>
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
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{campaign.description}</p>
                    
                    {isStandard && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Requirements</h4>
                          <p className="text-sm text-muted-foreground">{campaign.requirements}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Campaign Details</h4>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div>Budget: {campaign.budget}</div>
                            <div>Deadline: {campaign.deadline}</div>
                            <div className="text-green-600">{campaign.spots}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {campaign.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Closes {campaign.deadline}</span>
                      </div>
                      <Button disabled>
                        <Lock className="w-4 h-4 mr-2" />
                        Apply Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}