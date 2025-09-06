import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DollarSign, TrendingUp, Eye, Clock, Briefcase, Crown, 
  Lock, Zap, Target, BarChart3, CreditCard, CheckCircle,
  Plus, MapPin, Users, Calendar, Building, User, Youtube,
  Play, Link as LinkIcon, Copy, Check, Loader2
} from "lucide-react";
import { Link } from "wouter";
import { usePlanAccess } from "@/hooks/usePlanAccess";

export default function Ads() {
  const { user, isAuthenticated } = useAuth();
  const { isFree, isStandard, isPremium } = usePlanAccess();
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  
  // YouTube Creator states
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // YouTube functionality
  const handleConnectYoutube = async () => {
    if (!youtubeUrl.trim()) {
      setErrorMessage('Please enter a YouTube channel URL');
      return;
    }

    setIsConnecting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/youtube/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl: youtubeUrl.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationCode(data.verificationCode);
        setSuccessMessage(`Connected! You have ${data.subscribers.toLocaleString()} subscribers (Tier ${data.tier}).`);
        setYoutubeUrl('');
      } else {
        setErrorMessage(data.message || 'Failed to connect YouTube channel');
      }
    } catch (error) {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleVerifyChannel = async () => {
    setIsVerifying(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/youtube/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('🎉 Channel verified successfully! You can now apply for campaigns.');
        setVerificationCode('');
      } else {
        setErrorMessage(data.message || 'Verification failed');
      }
    } catch (error) {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisconnectYoutube = async () => {
    try {
      const response = await fetch('/api/youtube/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setSuccessMessage('YouTube channel disconnected successfully.');
        setVerificationCode('');
        setErrorMessage('');
      } else {
        setErrorMessage('Failed to disconnect channel');
      }
    } catch (error) {
      setErrorMessage('Network error. Please try again.');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
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

        {/* Restriction Alert for Free Users Only */}
        {isFree && (
          <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/10">
            <Lock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              You're on the Free plan. Upgrade to <strong>Standard ($25/mo)</strong> to view campaigns or <strong>Premium Earner ($45/mo)</strong> to apply and earn.
              <Link href="/subscribe" className="underline font-medium ml-1">Upgrade now</Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Info Alert for Standard Users */}
        {isStandard && (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/10">
            <Crown className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              You're on the Standard plan. You can view campaigns but need <strong>Premium Earner ($45/mo)</strong> to apply and start earning. 
              <Link href="/subscribe" className="underline font-medium ml-1">Upgrade to Premium</Link>
            </AlertDescription>
          </Alert>
        )}

        {(isPremium || isStandard) && (
          <Tabs defaultValue="campaigns" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="campaigns">Available Campaigns</TabsTrigger>
              <TabsTrigger value="mycampaigns">My Campaigns</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
              <TabsTrigger value="youtube">YouTube Creator</TabsTrigger>
            </TabsList>

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
                  <Card 
                    key={campaign.id} 
                    className={`relative overflow-hidden ${isStandard ? 'group cursor-pointer hover:shadow-lg transition-all duration-300' : ''}`}
                  >
                    {/* Hover X Indicator for Standard Users */}
                    {isStandard && (
                      <div className="absolute inset-0 bg-red-500/10 z-20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 pointer-events-none">
                        <div className="bg-red-500 text-white p-4 rounded-full shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      </div>
                    )}
                    
                    {!isStandard && campaign.restricted && (
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
                      
                      {isStandard ? (
                        <Button disabled className="w-full bg-gray-400">
                          <Lock className="w-4 h-4 mr-2" />
                          Upgrade to Premium to Apply
                        </Button>
                      ) : campaign.restricted ? (
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

            {/* YouTube Creator Dashboard */}
            <TabsContent value="youtube" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Youtube className="w-5 h-5 text-red-600" />
                    YouTube Creator Dashboard
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Connect your YouTube channel to access premium brand campaigns
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current Status */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Play className="w-4 h-4" />
                          Channel Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {user?.youtubeChannelId ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Badge variant={(user as any).youtubeVerified ? "default" : "secondary"}>
                                {(user as any).youtubeVerified ? "✓ Verified" : "⏳ Connected"}
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Subscribers:</span>
                                <span className="font-medium">{(user as any).youtubeSubscribers?.toLocaleString() || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Tier:</span>
                                <span className="font-medium">Tier {(user as any).youtubeTier || 'N/A'}</span>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDisconnectYoutube}
                              className="w-full text-red-600 hover:text-red-700"
                            >
                              Disconnect Channel
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <Youtube className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-muted-foreground">No channel connected</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <LinkIcon className="w-4 h-4" />
                          Connect Channel
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              YouTube Channel URL
                            </label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="https://youtube.com/channel/UCxxxxx or @username"
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                className="flex-1"
                                disabled={isConnecting}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Paste your YouTube channel URL here
                            </p>
                          </div>
                          
                          <Button
                            onClick={handleConnectYoutube}
                            disabled={isConnecting || !youtubeUrl.trim()}
                            className="w-full"
                          >
                            {isConnecting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                <LinkIcon className="w-4 h-4 mr-2" />
                                Connect Channel
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Verification Process */}
                  {verificationCode && (
                    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/10">
                      <CardHeader>
                        <CardTitle className="text-lg text-blue-800 dark:text-blue-200">
                          🔐 Verification Required
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-white dark:bg-gray-900 border rounded-lg p-4">
                          <h4 className="font-semibold mb-2">Step 1: Copy Verification Code</h4>
                          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-3 rounded border">
                            <code className="flex-1 text-sm font-mono">{verificationCode}</code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(verificationCode)}
                            >
                              {copied ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 border rounded-lg p-4">
                          <h4 className="font-semibold mb-2">Step 2: Add to Channel Description</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            1. Go to your YouTube Studio → Customization → Basic Info<br/>
                            2. Paste the verification code in your channel description<br/>
                            3. Click Save and return here to verify
                          </p>
                        </div>

                        <Button
                          onClick={handleVerifyChannel}
                          disabled={isVerifying}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          {isVerifying ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Verify Channel
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Success/Error Messages */}
                  {successMessage && (
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-950/10">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        {successMessage}
                      </AlertDescription>
                    </Alert>
                  )}

                  {errorMessage && (
                    <Alert className="border-red-200 bg-red-50 dark:bg-red-950/10">
                      <Lock className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800 dark:text-red-200">
                        {errorMessage}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Help Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Need Help?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <h5 className="font-medium">Requirements:</h5>
                        <ul className="list-disc list-inside text-muted-foreground ml-2">
                          <li>Minimum 10,000 subscribers</li>
                          <li>Travel-related content</li>
                          <li>Active channel (recent uploads)</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium">Supported URL Formats:</h5>
                        <ul className="list-disc list-inside text-muted-foreground ml-2">
                          <li>https://youtube.com/channel/UCxxxxx</li>
                          <li>https://youtube.com/@username</li>
                          <li>https://youtube.com/c/channelname</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Restricted View for Free Users */}
        {isFree && (
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