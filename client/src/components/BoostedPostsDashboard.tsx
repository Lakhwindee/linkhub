import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, TrendingUp, DollarSign, Eye, MousePointer, Play, Pause, 
  StopCircle, Calendar, Target, MapPin, RefreshCw, AlertCircle,
  CheckCircle2, Clock, Users, Zap
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface BoostedPost {
  id: string;
  postId: string;
  userId: string;
  targetCountries: string[];
  targetCities: string[];
  dailyBudget: string;
  totalBudget: string;
  costPerClick: string;
  impressions: number;
  clicks: number;
  spend: string;
  status: 'active' | 'paused' | 'stopped' | 'completed';
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  // Post data
  postBody?: string;
  postMediaUrls?: string[];
  postCity?: string;
  postCountry?: string;
}

export function BoostedPostsDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch boosted posts
  const { data: boostedPosts = [], isLoading, refetch } = useQuery<BoostedPost[]>({
    queryKey: ["/api/posts/boosted"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/posts/boosted");
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds for live data
  });

  // Update campaign status mutation
  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const response = await apiRequest("PATCH", `/api/posts/boosted/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/boosted"] });
      toast({
        title: "Campaign Updated",
        description: "Campaign status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update campaign status.",
        variant: "destructive",
      });
    },
  });

  // Calculate summary metrics
  const summaryMetrics = boostedPosts.reduce((acc, post) => {
    const spend = parseFloat(post.spend || '0');
    const totalBudget = parseFloat(post.totalBudget || '0');
    
    return {
      totalCampaigns: acc.totalCampaigns + 1,
      activeCampaigns: acc.activeCampaigns + (post.status === 'active' ? 1 : 0),
      totalSpend: acc.totalSpend + spend,
      totalBudget: acc.totalBudget + totalBudget,
      totalImpressions: acc.totalImpressions + (post.impressions || 0),
      totalClicks: acc.totalClicks + (post.clicks || 0),
    };
  }, {
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalSpend: 0,
    totalBudget: 0,
    totalImpressions: 0,
    totalClicks: 0,
  });

  const avgCTR = summaryMetrics.totalImpressions > 0 
    ? ((summaryMetrics.totalClicks / summaryMetrics.totalImpressions) * 100).toFixed(2)
    : '0.00';

  const handleStatusChange = (campaignId: string, newStatus: string) => {
    updateCampaignMutation.mutate({ id: campaignId, status: newStatus });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'stopped': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'stopped': return <StopCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const CampaignCard = ({ campaign }: { campaign: BoostedPost }) => {
    const spend = parseFloat(campaign.spend || '0');
    const budget = parseFloat(campaign.totalBudget || '0');
    const budgetProgress = budget > 0 ? (spend / budget) * 100 : 0;
    const ctr = campaign.impressions > 0 ? ((campaign.clicks || 0) / campaign.impressions * 100).toFixed(2) : '0.00';
    const daysRemaining = Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2 mb-2">
                {campaign.postBody ? campaign.postBody.slice(0, 80) + (campaign.postBody.length > 80 ? '...' : '') : 'Post Campaign'}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getStatusColor(campaign.status)} variant="outline">
                  {getStatusIcon(campaign.status)}
                  <span className="ml-1 capitalize">{campaign.status}</span>
                </Badge>
                {campaign.postCity && campaign.postCountry && (
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="w-3 h-3 mr-1" />
                    {campaign.postCity}, {campaign.postCountry}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Performance Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{campaign.impressions || 0}</div>
              <div className="text-xs text-muted-foreground">Impressions</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{campaign.clicks || 0}</div>
              <div className="text-xs text-muted-foreground">Clicks</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{ctr}%</div>
              <div className="text-xs text-muted-foreground">CTR</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">${spend.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Spent</div>
            </div>
          </div>

          {/* Budget Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Budget Used</span>
              <span>${spend.toFixed(2)} / ${budget.toFixed(2)}</span>
            </div>
            <Progress value={budgetProgress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{budgetProgress.toFixed(1)}% used</span>
              <span>${(budget - spend).toFixed(2)} remaining</span>
            </div>
          </div>

          {/* Campaign Timeline */}
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(campaign.startDate), 'MMM dd')} - {format(new Date(campaign.endDate), 'MMM dd')}
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{daysRemaining} days left</span>
            </div>
          </div>

          {/* Targeting Info */}
          <div className="text-sm">
            <div className="flex items-center gap-1 mb-1">
              <Target className="w-4 h-4" />
              <span className="font-medium">Targeting:</span>
            </div>
            <div className="text-muted-foreground">
              {campaign.targetCountries.length > 0 
                ? `${campaign.targetCountries.length} countries selected`
                : "Global targeting"
              }
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            {campaign.status === 'active' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange(campaign.id, 'paused')}
                disabled={updateCampaignMutation.isPending}
              >
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </Button>
            )}
            {campaign.status === 'paused' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange(campaign.id, 'active')}
                disabled={updateCampaignMutation.isPending}
              >
                <Play className="w-4 h-4 mr-1" />
                Resume
              </Button>
            )}
            {(campaign.status === 'active' || campaign.status === 'paused') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange(campaign.id, 'stopped')}
                disabled={updateCampaignMutation.isPending}
                className="text-red-600 hover:text-red-700"
              >
                <StopCircle className="w-4 h-4 mr-1" />
                Stop
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Boosted Posts</h1>
          <p className="text-muted-foreground">Manage your post promotion campaigns</p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {summaryMetrics.activeCampaigns} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summaryMetrics.totalSpend.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              ${summaryMetrics.totalBudget.toFixed(2)} budgeted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
            <MousePointer className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCTR}%</div>
            <p className="text-xs text-muted-foreground">
              {summaryMetrics.totalClicks} total clicks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">All Campaigns</TabsTrigger>
          <TabsTrigger value="active">Active ({summaryMetrics.activeCampaigns})</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {boostedPosts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Boosted Posts Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start promoting your posts to reach a wider audience!
                </p>
                <p className="text-sm text-muted-foreground">
                  Go to your posts and click the boost button (📈) to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {boostedPosts.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {boostedPosts
              .filter(post => post.status === 'active')
              .map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))
            }
          </div>
        </TabsContent>

        <TabsContent value="paused" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {boostedPosts
              .filter(post => post.status === 'paused')
              .map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))
            }
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {boostedPosts
              .filter(post => post.status === 'completed' || post.status === 'stopped')
              .map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))
            }
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}