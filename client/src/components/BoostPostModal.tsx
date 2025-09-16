import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, Target, Calendar, DollarSign, Globe, MapPin, 
  Clock, Zap, BarChart3, Users, Eye
} from "lucide-react";
import { worldCountries } from "@/data/locationData";
import type { Post } from "@shared/schema";

interface BoostPostModalProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BoostPostModal({ post, open, onOpenChange }: BoostPostModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [campaignData, setCampaignData] = useState({
    targetCountries: [] as string[],
    targetCities: [] as string[],
    dailyBudget: 10,
    totalBudget: 100,
    duration: 7, // days
    costPerClick: 0.10,
  });

  // Calculate campaign details
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + campaignData.duration);
  
  const estimatedClicks = Math.floor(campaignData.totalBudget / campaignData.costPerClick);
  const platformFee = campaignData.totalBudget * 0.10; // 10% platform fee
  const totalCost = campaignData.totalBudget + platformFee;

  const boostPostMutation = useMutation({
    mutationFn: async (boostData: any) => {
      const response = await apiRequest("POST", `/api/posts/${post.id}/boost`, boostData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Post Boosted Successfully!",
        description: "Your post is now being promoted to targeted audience.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/boosted"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Boost Failed",
        description: error.message || "Failed to boost your post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCampaignData({
      targetCountries: [],
      targetCities: [],
      dailyBudget: 10,
      totalBudget: 100,
      duration: 7,
      costPerClick: 0.10,
    });
  };

  const handleSubmit = () => {
    if (campaignData.totalBudget < 5) {
      toast({
        title: "Minimum Budget Required",
        description: "Total budget must be at least $5",
        variant: "destructive",
      });
      return;
    }

    if (campaignData.dailyBudget > campaignData.totalBudget) {
      toast({
        title: "Invalid Budget",
        description: "Daily budget cannot exceed total budget",
        variant: "destructive",
      });
      return;
    }

    const boostData = {
      targetCountries: campaignData.targetCountries,
      targetCities: campaignData.targetCities,
      dailyBudget: campaignData.dailyBudget,
      totalBudget: campaignData.totalBudget,
      costPerClick: campaignData.costPerClick,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    boostPostMutation.mutate(boostData);
  };

  const addCountry = (countryName: string) => {
    if (!campaignData.targetCountries.includes(countryName)) {
      setCampaignData(prev => ({
        ...prev,
        targetCountries: [...prev.targetCountries, countryName]
      }));
    }
  };

  const removeCountry = (countryName: string) => {
    setCampaignData(prev => ({
      ...prev,
      targetCountries: prev.targetCountries.filter(c => c !== countryName)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <TrendingUp className="w-6 h-6 text-primary" />
            Boost Your Post
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Campaign Setup */}
          <div className="space-y-6">
            {/* Post Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Post Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {user?.firstName?.[0] || user?.displayName?.[0] || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user?.displayName || `${user?.firstName} ${user?.lastName}`}</p>
                      <Badge variant="outline" className="text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Promoted
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm line-clamp-3">{post.body}</p>
                  {post.city && post.country && (
                    <div className="flex items-center mt-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 mr-1" />
                      {post.city}, {post.country}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Targeting Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Target Audience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Target Countries</Label>
                  <Select onValueChange={addCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select countries to target" />
                    </SelectTrigger>
                    <SelectContent>
                      {worldCountries.map((country) => (
                        <SelectItem key={country.name} value={country.name}>
                          {country.flag} {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {campaignData.targetCountries.map((country) => (
                      <Badge key={country} variant="secondary" className="cursor-pointer" onClick={() => removeCountry(country)}>
                        {country} ×
                      </Badge>
                    ))}
                    {campaignData.targetCountries.length === 0 && (
                      <Badge variant="outline">
                        <Globe className="w-3 h-3 mr-1" />
                        All Countries
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget & Duration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Budget & Duration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dailyBudget">Daily Budget ($)</Label>
                    <Input
                      id="dailyBudget"
                      type="number"
                      min="1"
                      step="1"
                      value={campaignData.dailyBudget}
                      onChange={(e) => setCampaignData(prev => ({
                        ...prev,
                        dailyBudget: parseInt(e.target.value) || 1
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalBudget">Total Budget ($)</Label>
                    <Input
                      id="totalBudget"
                      type="number"
                      min="5"
                      step="5"
                      value={campaignData.totalBudget}
                      onChange={(e) => setCampaignData(prev => ({
                        ...prev,
                        totalBudget: parseInt(e.target.value) || 5
                      }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="duration">Campaign Duration (days)</Label>
                  <Select 
                    value={campaignData.duration.toString()}
                    onValueChange={(value) => setCampaignData(prev => ({
                      ...prev,
                      duration: parseInt(value)
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">1 week</SelectItem>
                      <SelectItem value="14">2 weeks</SelectItem>
                      <SelectItem value="30">1 month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Campaign Summary & Analytics */}
          <div className="space-y-6">
            {/* Campaign Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Campaign Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-primary">${campaignData.totalBudget}</div>
                    <div className="text-sm text-muted-foreground">Ad Spend</div>
                  </div>
                  <div className="text-center p-3 bg-green-100 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">${platformFee.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Platform Fee</div>
                  </div>
                </div>

                <Separator />

                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-3xl font-bold">${totalCost.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Total Cost</div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      Estimated Clicks
                    </span>
                    <span className="font-medium">{estimatedClicks.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Duration
                    </span>
                    <span className="font-medium">{campaignData.duration} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Target Reach
                    </span>
                    <span className="font-medium">
                      {campaignData.targetCountries.length === 0 ? "Global" : `${campaignData.targetCountries.length} countries`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Campaign Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Start Date:</span>
                    <span className="font-medium">{startDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>End Date:</span>
                    <span className="font-medium">{endDate.toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleSubmit} 
                disabled={boostPostMutation.isPending}
                className="w-full text-lg py-6"
              >
                {boostPostMutation.isPending ? (
                  <>Launching Campaign...</>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Launch Boost Campaign
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="w-full"
                disabled={boostPostMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}