import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, Eye, Clock, Briefcase, 
  Target, BarChart3, CheckCircle, Youtube, Star
} from "lucide-react";

export default function Ads() {
  const { user, isAuthenticated } = useAuth();

  // All Creator Tiers - Simple Display
  const creatorTiers = [
    { tier: 1, name: 'Bronze Creator', range: '1k-5k', color: 'bg-orange-600', textColor: 'text-white' },
    { tier: 2, name: 'Silver Creator', range: '5k-10k', color: 'bg-gray-400', textColor: 'text-white' },
    { tier: 3, name: 'Gold Creator', range: '10k-25k', color: 'bg-yellow-500', textColor: 'text-white' },
    { tier: 4, name: 'Platinum Creator', range: '25k-50k', color: 'bg-blue-500', textColor: 'text-white' },
    { tier: 5, name: 'Diamond Creator', range: '50k-100k', color: 'bg-purple-500', textColor: 'text-white' },
    { tier: 6, name: 'Elite Creator', range: '100k-250k', color: 'bg-indigo-600', textColor: 'text-white' },
    { tier: 7, name: 'Master Creator', range: '250k-500k', color: 'bg-pink-600', textColor: 'text-white' },
    { tier: 8, name: 'Legend Creator', range: '500k-1M', color: 'bg-red-600', textColor: 'text-white' },
    { tier: 9, name: 'Champion Creator', range: '1M-5M', color: 'bg-green-600', textColor: 'text-white' },
    { tier: 10, name: 'Ultimate Creator', range: '5M+', color: 'bg-black', textColor: 'text-white' }
  ];

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
      tags: ["travel", "photography", "canon"]
    },
    {
      id: "ad-2",
      title: "Tech Review Campaign",
      brand: "Samsung",
      category: "Technology",
      payPerPost: "$200-400",
      description: "Review latest Samsung devices and accessories",
      requirements: "25k+ followers, tech content focus",
      deadline: "Feb 15, 2025",
      budget: "$5,000",
      spots: "10 spots available",
      tags: ["tech", "reviews", "samsung"]
    }
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 py-20">
            <DollarSign className="w-16 h-16 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-bold">Sign in to access Creator Dashboard</h1>
            <p className="text-muted-foreground">View all creator tiers and campaigns</p>
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
              Creator Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              View all creator tiers and manage campaigns
            </p>
          </div>
          
          {/* Current User Status */}
          <div className="flex items-center gap-3">
            <Badge variant="default" className="text-sm">
              <Youtube className="w-4 h-4 mr-1" />
              {user?.role || 'Creator'}
            </Badge>
          </div>
        </div>

        {/* Simple Tabs - All Features Available */}
        <Tabs defaultValue="tiers" className="space-y-6">
          <TabsList className="w-full flex md:grid md:grid-cols-4 overflow-x-auto md:overflow-x-visible gap-1">
            <TabsTrigger value="tiers" className="text-xs md:text-sm whitespace-nowrap min-w-fit">
              <Star className="w-4 h-4 mr-2" />
              All Creator Tiers
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="text-xs md:text-sm whitespace-nowrap min-w-fit">
              <Target className="w-4 h-4 mr-2" />
              Available Campaigns
            </TabsTrigger>
            <TabsTrigger value="mycampaigns" className="text-xs md:text-sm whitespace-nowrap min-w-fit">
              <Briefcase className="w-4 h-4 mr-2" />
              My Campaigns
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs md:text-sm whitespace-nowrap min-w-fit">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* All Creator Tiers Tab */}
          <TabsContent value="tiers">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {creatorTiers.map((tier) => (
                <Card key={tier.tier} className="relative overflow-hidden">
                  <CardHeader className={`${tier.color} ${tier.textColor}`}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold">
                        Tier {tier.tier}
                      </CardTitle>
                      <Youtube className="w-6 h-6" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{tier.name}</h3>
                    <p className="text-muted-foreground mb-4">
                      {tier.range} subscribers
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Campaign Access</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Analytics Dashboard</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Payout Management</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Available Campaigns Tab */}
          <TabsContent value="campaigns">
            <div className="grid gap-6">
              {campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {campaign.title}
                          <Badge variant="secondary">{campaign.category}</Badge>
                        </CardTitle>
                        <p className="text-muted-foreground mt-2">{campaign.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">{campaign.payPerPost}</div>
                        <div className="text-sm text-muted-foreground">{campaign.spots}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Deadline: {campaign.deadline}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Budget: {campaign.budget}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Requirements: {campaign.requirements}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        {campaign.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      <Button>
                        Apply Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* My Campaigns Tab */}
          <TabsContent value="mycampaigns">
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Active Campaigns</h3>
              <p className="text-muted-foreground">
                Apply to campaigns to see them here
              </p>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234,567</div>
                  <p className="text-xs text-muted-foreground">
                    +12.3% from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Campaigns Applied</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">23</div>
                  <p className="text-xs text-muted-foreground">
                    +5 this month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$5,432</div>
                  <p className="text-xs text-muted-foreground">
                    +18.2% from last month
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
        
      </div>
    </div>
  );
}