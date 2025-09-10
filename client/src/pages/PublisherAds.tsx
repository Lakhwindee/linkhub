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
import { worldCountries } from "@/data/locationData";
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
  const [numberOfInfluencers, setNumberOfInfluencers] = useState<number>(1);
  const [calculatedBudget, setCalculatedBudget] = useState<number>(0);
  const [adImageUrl, setAdImageUrl] = useState<string>("");

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<PublisherAdFormData>({
    resolver: zodResolver(insertPublisherAdSchema),
    defaultValues: {
      currency: "USD", 
      tierLevel: 1,
      numberOfInfluencers: 1,
    }
  });

  const watchedValues = watch();

  // Tier pricing configuration (USD)
  const tiers = [
    { level: 1, price: 125, range: "30K-70K", description: "Micro-Influencers" },
    { level: 2, price: 250, range: "70K-150K", description: "Small Influencers" },
    { level: 3, price: 440, range: "150K-300K", description: "Mid-Tier Influencers" },
    { level: 4, price: 625, range: "300K-500K", description: "Growing Influencers" },
    { level: 5, price: 875, range: "500K-800K", description: "Established Influencers" },
    { level: 6, price: 1125, range: "800K-1.2M", description: "Major Influencers" },
    { level: 7, price: 1500, range: "1.2M-1.6M", description: "Top Influencers" },
    { level: 8, price: 1875, range: "1.6M-2M", description: "Premium Influencers" },
    { level: 9, price: 2250, range: "2M-3M", description: "Celebrity Influencers" },
    { level: 10, price: 2500, range: "3M+", description: "Mega Influencers" },
  ];

  // Calculate budget from tier and number of influencers
  const calculateBudgetFromInfluencers = (tierLevel: number, numInfluencers: number) => {
    const tierPrice = tiers.find(t => t.level === tierLevel)?.price || 125;
    const campaignCost = tierPrice * numInfluencers; // Cost for all influencers
    const platformFee = campaignCost * 0.10; // 10% platform fee
    const totalBudget = campaignCost + platformFee; // Total budget needed
    
    return {
      tierPrice,
      campaignCost, // Money going to influencers
      platformFee, // Platform fee
      totalBudget, // Total budget required
      numberOfInfluencers: numInfluencers
    };
  };

  // Update calculated budget when tier changes
  const updateCalculatedBudget = () => {
    const budget = calculateBudgetFromInfluencers(selectedTier, numberOfInfluencers);
    setCalculatedBudget(budget.totalBudget);
  };

  // Fetch publisher's ads
  const { data: publisherAds = [], isLoading: adsLoading } = useQuery({
    queryKey: ["/api/publisher/ads"],
    enabled: user?.role === 'publisher',
  });

  // Create ad mutation
  const createAdMutation = useMutation({
    mutationFn: async (data: PublisherAdFormData) => {
      console.log('🚀 ACTUAL API CALL STARTING...');
      
      const response = await fetch('/api/publisher/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          adImageUrl,
          totalBudget: calculatedBudget,
          tierLevel: Number(data.tierLevel),
          numberOfInfluencers,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      console.log('✅ API RESPONSE:', result);
      return result;
    },
    onSuccess: (campaign: any) => {
      console.log('🎉 Campaign created, redirecting to payment...', campaign);
      toast({
        title: "Campaign Created",
        description: "Redirecting to payment...",
      });
      setIsCreateDialogOpen(false);
      
      // Redirect to payment page with campaign ID
      window.location.href = `/payment/${campaign.id}`;
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
    console.log('🚀 Form submission started!');
    console.log('📊 Form data:', data);
    console.log('🎯 Selected tier:', selectedTier);
    console.log('👥 Number of influencers:', numberOfInfluencers);
    console.log('💰 Calculated budget:', calculatedBudget);
    
    // Validate required fields
    if (!data.brand || !data.title || !data.briefMd) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in Brand, Title, and Description",
        variant: "destructive",
      });
      return;
    }
    
    // For demo purposes, allow submission without image
    const finalImageUrl = adImageUrl || "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop";
    console.log('🖼️ Using image URL:', finalImageUrl);
    
    console.log('✅ Creating campaign and redirecting to payment...');
    
    // Calculate budget fresh to ensure it's not 0
    const currentBudget = calculateBudgetFromInfluencers(selectedTier, numberOfInfluencers);
    
    // Prepare campaign data with proper structure matching schema
    const campaignData = {
      brand: data.brand,
      title: data.title,
      briefMd: data.briefMd,
      adImageUrl: finalImageUrl,
      countries: data.countries || [],
      hashtags: data.hashtags || [],
      currency: data.currency || "USD",
      deadlineAt: data.deadlineAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Send as Date object, not string
      totalBudget: currentBudget.totalBudget, // Use fresh calculation, not state
      tierLevel: Number(selectedTier),
      numberOfInfluencers: numberOfInfluencers,
    };
    
    console.log('📋 Final campaign data being sent:', campaignData);
    createAdMutation.mutate(campaignData);
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
  const costBreakdown = calculateBudgetFromInfluencers(selectedTier, numberOfInfluencers);

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
              
              <form onSubmit={handleSubmit(onSubmit, (errors) => {
                console.log('❌ Form validation failed!');
                console.log('🚨 Validation errors:', errors);
              })} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand">Brand Name</Label>
                      <Input
                        id="brand"
                        {...register("brand", { required: "Brand name is required" })}
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
                              const budget = calculateBudgetFromInfluencers(tier.level, numberOfInfluencers);
                              setCalculatedBudget(budget.totalBudget);
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

                    {/* Number of Influencers Input */}
                    <div className="space-y-2">
                      <Label htmlFor="numberOfInfluencers">How Many Influencers Do You Need?</Label>
                      <Input
                        id="numberOfInfluencers"
                        type="number"
                        min="1"
                        step="1"
                        {...register("numberOfInfluencers", { 
                          onChange: (e) => {
                            const num = Number(e.target.value) || 1;
                            setNumberOfInfluencers(num);
                            const budget = calculateBudgetFromInfluencers(selectedTier, num);
                            setCalculatedBudget(budget.totalBudget);
                          }
                        })}
                        placeholder="5"
                        value={numberOfInfluencers}
                      />
                      {errors.numberOfInfluencers && (
                        <p className="text-sm text-destructive">{errors.numberOfInfluencers.message}</p>
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
                            <span className="font-medium">Number of Influencers:</span>
                            <span className="font-bold">{numberOfInfluencers}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Price per influencer:</span>
                            <span className="text-muted-foreground">${currentTier?.price}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Campaign Cost:</span>
                            <span className="text-muted-foreground">${costBreakdown.campaignCost.toFixed(2)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-destructive">Platform Fee (10%):</span>
                            <span className="text-destructive">+${costBreakdown.platformFee.toFixed(2)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-lg font-bold border-t border-muted-foreground/20 pt-3">
                            <span className="text-chart-1">Total Budget Required:</span>
                            <span className="text-chart-1">${costBreakdown.totalBudget.toFixed(2)}</span>
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
                              <p className="text-2xl font-bold text-primary">{numberOfInfluencers}</p>
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
                    type="button"
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🚀 SUBMIT BUTTON CLICKED! Event:', e);
                      
                      // Get current form values
                      const formValues = watch();
                      console.log('📋 Raw form values:', formValues);
                      
                      // Ensure required fields are populated from state
                      const submissionData = {
                        ...formValues,
                        tierLevel: selectedTier,
                        numberOfInfluencers: numberOfInfluencers,
                        totalBudget: calculatedBudget,
                        currency: formValues.currency || "USD",
                        countries: formValues.countries || [],
                        hashtags: formValues.hashtags || [],
                        deadlineAt: formValues.deadlineAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                      };
                      
                      console.log('📊 Enhanced submission data:', submissionData);
                      console.log('🔥 Attempting form submission...');
                      
                      try {
                        onSubmit(submissionData);
                      } catch (error) {
                        console.error('❌ Submit error:', error);
                      }
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign & Pay
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
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)} 
                    className="bg-accent hover:bg-accent/90"
                  >
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
    { level: 1, description: "Micro-Influencers", range: "30K-70K" },
    { level: 2, description: "Small Influencers", range: "70K-150K" },
    { level: 3, description: "Mid-Tier Influencers", range: "150K-300K" },
    { level: 4, description: "Growing Influencers", range: "300K-500K" },
    { level: 5, description: "Established Influencers", range: "500K-800K" },
    { level: 6, description: "Major Influencers", range: "800K-1.2M" },
    { level: 7, description: "Top Influencers", range: "1.2M-1.6M" },
    { level: 8, description: "Premium Influencers", range: "1.6M-2M" },
    { level: 9, description: "Celebrity Influencers", range: "2M-3M" },
    { level: 10, description: "Mega Influencers", range: "3M+" },
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
            <span className="text-muted-foreground">Usable Budget:</span>
            <span className="font-semibold text-chart-2">${(ad.totalBudget * 0.9).toFixed(2)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Budget:</span>
            <span className="font-semibold">${ad.totalBudget}</span>
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