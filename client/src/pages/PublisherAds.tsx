import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ObjectUploader } from "@/components/ObjectUploader";
import { DollarSign, Plus, Upload, Calendar, MapPin, Tag, Users, Eye, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPublisherAdSchema } from "@shared/schema";
import { z } from "zod";

type PublisherAdFormData = z.infer<typeof insertPublisherAdSchema>;

export default function PublisherAds() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [totalBudget, setTotalBudget] = useState<number>(120);
  const [adImageUrl, setAdImageUrl] = useState<string>("");

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<PublisherAdFormData>({
    resolver: zodResolver(insertPublisherAdSchema),
    defaultValues: {
      currency: "USD",
      tierLevel: 1,
      totalBudget: 120,
    }
  });

  const watchedValues = watch();

  // Tier pricing configuration
  const tiers = [
    { level: 1, price: 120, range: "10K-40K", description: "Micro-Influencers" },
    { level: 2, price: 240, range: "40K-70K", description: "Mid-Tier Influencers" },
    { level: 3, price: 360, range: "70K+", description: "Macro-Influencers" },
  ];

  // Calculate costs with platform fees
  const calculateCosts = (budget: number, tierLevel: number) => {
    const tierPrice = tiers.find(t => t.level === tierLevel)?.price || 120;
    const platformFee = budget * 0.10; // 10% platform fee
    const totalCost = budget + platformFee;
    const maxInfluencers = Math.floor(budget / tierPrice);
    
    return {
      baseAmount: budget,
      platformFee,
      totalCost,
      maxInfluencers,
      tierPrice
    };
  };

  // Calculate max influencers based on budget and tier
  const calculateMaxInfluencers = (budget: number, tierLevel: number) => {
    return calculateCosts(budget, tierLevel).maxInfluencers;
  };

  // Fetch publisher's ads
  const { data: publisherAds = [], isLoading: adsLoading } = useQuery({
    queryKey: ["/api/publisher/ads"],
    enabled: user?.role === 'publisher',
  });

  // Create ad mutation
  const createAdMutation = useMutation({
    mutationFn: async (data: PublisherAdFormData) => {
      // Demo mode - simulate successful ad creation
      await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 second delay
      
      return {
        id: `demo-ad-${Date.now()}`,
        ...data,
        adImageUrl,
        totalBudget: Number(data.totalBudget),
        tierLevel: Number(data.tierLevel),
        maxInfluencers: calculateMaxInfluencers(Number(data.totalBudget), Number(data.tierLevel)),
        status: 'active',
        createdAt: new Date().toISOString(),
      };
    },
    onSuccess: () => {
      toast({
        title: "Ad Created Successfully",
        description: "Your ad campaign has been created and is now live.",
      });
      setIsCreateDialogOpen(false);
      reset();
      setAdImageUrl("");
      queryClient.invalidateQueries({ queryKey: ["/api/publisher/ads"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Ad",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async () => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload");
      const { uploadURL } = await response.json();
      return { method: "PUT" as const, url: uploadURL };
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to get upload URL. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleImageComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      
      // For demo purposes, use the uploaded file URL directly
      setAdImageUrl(uploadedFile.uploadURL);
      setValue("adImageUrl", uploadedFile.uploadURL);
      
      toast({
        title: "Image Uploaded",
        description: "Ad creative has been uploaded successfully.",
      });
    }
  };

  const onSubmit = (data: PublisherAdFormData) => {
    if (!adImageUrl) {
      toast({
        title: "Image Required",
        description: "Please upload an ad creative image.",
        variant: "destructive",
      });
      return;
    }
    createAdMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role !== 'publisher') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="p-12 text-center">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-yellow-600 dark:text-yellow-400" />
              <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200 mb-4">
                Publisher Role Required
              </h2>
              <p className="text-yellow-700 dark:text-yellow-300 mb-6">
                You need Publisher role to create and manage ad campaigns.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentTier = tiers.find(t => t.level === selectedTier);
  const costBreakdown = calculateCosts(totalBudget, selectedTier);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-chart-2" />
              <span>My Ad Campaigns</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your advertising campaigns with tier-based pricing
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90">
                <Plus className="w-4 h-4 mr-2" />
                Create New Ad
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">Create Ad Campaign</DialogTitle>
                <p className="text-muted-foreground">Set up your ad campaign with tier-based pricing</p>
              </DialogHeader>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand">Brand Name</Label>
                      <Input
                        id="brand"
                        {...register("brand")}
                        placeholder="Your brand or company name"
                      />
                      {errors.brand && (
                        <p className="text-sm text-destructive">{errors.brand.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Campaign Title</Label>
                      <Input
                        id="title"
                        {...register("title")}
                        placeholder="Summer Travel Campaign"
                      />
                      {errors.title && (
                        <p className="text-sm text-destructive">{errors.title.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="briefMd">Campaign Description</Label>
                    <Textarea
                      id="briefMd"
                      {...register("briefMd")}
                      placeholder="Describe your campaign, requirements, and what influencers should create..."
                      rows={6}
                      className="resize-none"
                    />
                    {errors.briefMd && (
                      <p className="text-sm text-destructive">{errors.briefMd.message}</p>
                    )}
                  </div>

                </div>

                {/* Ad Creative Upload */}
                <Card className="p-6 bg-gradient-to-br from-background to-muted/30 border-2 border-muted-foreground/10 shadow-lg">
                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-accent to-chart-2 rounded-xl flex items-center justify-center shadow-md">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground mb-1">Campaign Creative</h3>
                          <p className="text-sm text-muted-foreground max-w-md">
                            Upload high-resolution creative assets to maximize campaign effectiveness
                          </p>
                        </div>
                      </div>
                    </div>

                    {!adImageUrl ? (
                      <div className="space-y-4">
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={10 * 1024 * 1024} // 10MB
                          onGetUploadParameters={handleImageUpload}
                          onComplete={handleImageComplete}
                          buttonClassName="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          <div className="flex items-center justify-center space-x-3">
                            <Upload className="w-5 h-5" />
                            <span>Upload Campaign Creative</span>
                          </div>
                        </ObjectUploader>
                        
                        <div className="text-center text-sm text-muted-foreground">
                          <p>JPG, PNG, GIF • Max 10MB • High Resolution Recommended</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {/* Preview uploaded image */}
                        <div className="relative rounded-2xl overflow-hidden border-2 border-green-200 dark:border-green-700 shadow-xl">
                          <img 
                            src={adImageUrl} 
                            alt="Campaign creative preview" 
                            className="w-full h-56 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          <div className="absolute top-4 right-4">
                            <Badge className="bg-green-500/90 backdrop-blur-sm text-white shadow-lg">
                              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                              Creative Ready
                            </Badge>
                          </div>
                          <div className="absolute bottom-4 left-4">
                            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1">
                              <p className="text-white text-sm font-medium">Campaign Creative Preview</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Change image button */}
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={10 * 1024 * 1024} // 10MB
                          onGetUploadParameters={handleImageUpload}
                          onComplete={handleImageComplete}
                          buttonClassName="w-full bg-card hover:bg-accent/5 text-foreground border border-border hover:border-primary/40 transition-all duration-300 py-3 px-4 rounded-lg"
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <Upload className="w-4 h-4" />
                            <span className="font-medium">Change Creative</span>
                          </div>
                        </ObjectUploader>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Tier & Budget System */}
                <Card className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-chart-2" />
                      <Label className="text-base font-semibold">Pricing & Budget</Label>
                    </div>
                    
                    {/* Tier Selection */}
                    <div className="space-y-3">
                      <Label>Select Influencer Tier</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {tiers.map((tier) => (
                          <div
                            key={tier.level}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              selectedTier === tier.level 
                                ? 'border-accent bg-accent/10' 
                                : 'border-muted hover:border-accent/50'
                            }`}
                            onClick={() => {
                              setSelectedTier(tier.level);
                              setValue("tierLevel", tier.level);
                            }}
                          >
                            <div className="text-center">
                              <h3 className="font-semibold">{tier.description}</h3>
                              <p className="text-sm text-muted-foreground">{tier.range} subscribers</p>
                              <div className="text-lg font-bold text-chart-2 mt-2">
                                ${tier.price} each
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Budget Input */}
                    <div className="space-y-2">
                      <Label htmlFor="totalBudget">Total Budget (USD)</Label>
                      <Input
                        id="totalBudget"
                        type="number"
                        min="120"
                        step="10"
                        {...register("totalBudget", { 
                          onChange: (e) => setTotalBudget(Number(e.target.value))
                        })}
                        placeholder="1200"
                      />
                      {errors.totalBudget && (
                        <p className="text-sm text-destructive">{errors.totalBudget.message}</p>
                      )}
                    </div>

                    {/* Budget Calculator */}
                    <Card className="p-6 bg-gradient-to-br from-muted/20 to-muted/40 border-2 border-muted-foreground/10">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-muted-foreground/20">
                          <span className="font-semibold text-lg">Cost Breakdown</span>
                          <Badge variant="secondary" className="bg-chart-2/20 text-chart-2">{currentTier?.description}</Badge>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Campaign Budget:</span>
                            <span className="font-bold">${totalBudget || 0}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Price per influencer:</span>
                            <span className="text-muted-foreground">${currentTier?.price}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Platform Fee (10%):</span>
                            <span className="text-muted-foreground">+${costBreakdown.platformFee.toFixed(2)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-lg font-bold border-t border-muted-foreground/20 pt-3">
                            <span className="text-foreground">Total Cost:</span>
                            <span className="text-chart-1">${costBreakdown.totalCost.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="bg-primary/10 rounded-lg p-4 mt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">Campaign Reach</p>
                                <p className="text-sm text-muted-foreground">Maximum influencers you can work with</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">{costBreakdown.maxInfluencers}</p>
                              <p className="text-sm text-muted-foreground">influencers</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                </div>
                </Card>


                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createAdMutation.isPending || !adImageUrl}
                    className="bg-accent hover:bg-accent/90"
                  >
                    {createAdMutation.isPending ? (
                      <div className="animate-spin w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Create Campaign
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Ad Campaigns List */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">Active Campaigns</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="paused">Paused</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {adsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6 space-y-4">
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded w-full"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (publisherAds as any[]).length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(publisherAds as any[]).filter((ad: any) => ad.status === 'active').map((ad: any) => (
                  <AdCampaignCard key={ad.id} ad={ad} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Active Campaigns</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first ad campaign to start reaching influencers
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-accent hover:bg-accent/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Campaign
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(publisherAds as any[]).filter((ad: any) => ad.status === 'completed').map((ad: any) => (
                <AdCampaignCard key={ad.id} ad={ad} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="paused">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(publisherAds as any[]).filter((ad: any) => ad.status === 'paused').map((ad: any) => (
                <AdCampaignCard key={ad.id} ad={ad} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Ad Campaign Card Component
function AdCampaignCard({ ad }: { ad: any }) {
  const tiers = [
    { level: 1, description: "Micro-Influencers", range: "10K-40K" },
    { level: 2, description: "Mid-Tier Influencers", range: "40K-70K" },
    { level: 3, description: "Macro-Influencers", range: "70K+" },
  ];

  const currentTier = tiers.find(t => t.level === ad.tierLevel);

  return (
    <Card className="travel-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-card-foreground">{ad.title}</h3>
            <p className="text-sm text-muted-foreground">by {ad.brand}</p>
          </div>
          <Badge 
            className={
              ad.status === 'active' ? 'bg-green-500' : 
              ad.status === 'completed' ? 'bg-blue-500' : 'bg-yellow-500'
            }
          >
            {ad.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Campaign Image */}
        {ad.adImageUrl && (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <img 
              src={ad.adImageUrl} 
              alt="Campaign creative" 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Campaign Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Budget:</span>
            <span className="font-semibold text-chart-2">${ad.totalBudget}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tier:</span>
            <Badge variant="outline">{currentTier?.description}</Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Max Influencers:</span>
            <span className="font-semibold">{ad.maxInfluencers}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current Reservations:</span>
            <span className="font-semibold">
              {ad.currentReservations || 0}/{ad.maxInfluencers}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}