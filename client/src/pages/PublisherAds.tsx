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
import { DollarSign, Plus, Upload, Calendar, MapPin, Tag, Users, Eye, Edit, Trash2, Target } from "lucide-react";
import { worldCountries } from "@/data/locationData";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPublisherAdSchema } from "@shared/schema";
import { z } from "zod";

type PublisherAdFormData = z.infer<typeof insertPublisherAdSchema>;

// FRESH FORM COMPONENT - Clean, Working Implementation
function NewFreshForm({ onSuccess }: { onSuccess: () => void }) {
  const [brand, setBrand] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTier, setSelectedTier] = useState(1);
  const [numberOfInfluencers, setNumberOfInfluencers] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adImageUrl, setAdImageUrl] = useState("");

  const { toast } = useToast();

  const tiers = [
    { level: 1, description: "Micro-Influencers", range: "30K-70K", price: 125 },
    { level: 2, description: "Small Influencers", range: "70K-150K", price: 200 },
    { level: 3, description: "Mid-Tier Influencers", range: "150K-300K", price: 250 },
    { level: 4, description: "Growing Influencers", range: "300K-500K", price: 350 },
    { level: 5, description: "Established Influencers", range: "500K-800K", price: 450 },
    { level: 6, description: "Major Influencers", range: "800K-1.2M", price: 550 },
    { level: 7, description: "Top Influencers", range: "1.2M-1.6M", price: 650 },
    { level: 8, description: "Premium Influencers", range: "1.6M-2M", price: 750 },
    { level: 9, description: "Celebrity Influencers", range: "2M-3M", price: 850 },
    { level: 10, description: "Mega Influencers", range: "3M+", price: 950 },
  ];

  const currentTier = tiers.find(t => t.level === selectedTier);
  const campaignCost = (currentTier?.price || 125) * numberOfInfluencers;
  const platformFee = campaignCost * 0.10;
  const totalBudget = campaignCost + platformFee;

  const handleSubmit = async () => {
    // Validate required fields
    if (!brand.trim() || !title.trim() || !description.trim()) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in Brand, Title, and Description",
        variant: "destructive",
      });
      return;
    }

    if (!adImageUrl.trim()) {
      toast({
        title: "Image Required",
        description: "Please upload an ad image for your campaign",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    console.log('🚀 FRESH FORM SUBMITTING...');

    try {
      const campaignData = {
        brand: brand.trim(),
        title: title.trim(),
        briefMd: description.trim(),
        adImageUrl: adImageUrl.trim(),
        countries: [],
        hashtags: [],
        currency: "USD",
        deadlineAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        totalBudget: totalBudget,
        tierLevel: selectedTier,
        numberOfInfluencers: numberOfInfluencers,
      };

      console.log('📋 Fresh campaign data:', campaignData);

      const response = await fetch('/api/publisher/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      console.log('✅ Campaign created successfully:', result);

      toast({
        title: "Campaign Created!",
        description: "Redirecting to payment...",
      });

      // Redirect to payment page
      window.location.href = `/payment/${result.id}`;
      onSuccess();

    } catch (error) {
      console.error('❌ Campaign creation failed:', error);
      toast({
        title: "Campaign Creation Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="brand">Brand Name *</Label>
          <Input
            id="brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Your brand or company name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Campaign Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summer Travel Campaign"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Campaign Description *</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your campaign, requirements, and what influencers should create..."
            rows={4}
            required
          />
        </div>
      </div>

      {/* Image Upload */}
      <div className="space-y-4">
        <Label>Campaign File Upload *</Label>
        
        {/* File Upload Instructions */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-3">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center">
            <Upload className="w-4 h-4 mr-2" />
            📋 Allowed File Types & Restrictions
          </h4>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-green-600 dark:text-green-400">✅</span>
              <span><strong>📹 Video Files:</strong> MP4, AVI, MOV, WMV, FLV, WebM</span>
            </div>
            <div className="flex items-center space-x-2 ml-6">
              <span className="text-orange-600 dark:text-orange-400">⏱️</span>
              <span className="text-orange-700 dark:text-orange-300"><strong>Maximum Duration: 1 minute (60 seconds)</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600 dark:text-green-400">✅</span>
              <span><strong>🖼️ Image Files:</strong> JPG, PNG, GIF, WebP, SVG</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600 dark:text-green-400">✅</span>
              <span><strong>📄 PDF Documents:</strong> PDF files only</span>
            </div>
            <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
              <span className="text-red-600 dark:text-red-400">❌</span>
              <span className="text-red-700 dark:text-red-300"><strong>Not Allowed:</strong> Word, Excel, Audio, ZIP, EXE files</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <ObjectUploader
            maxNumberOfFiles={1}
            maxFileSize={10485760} // 10MB
            onGetUploadParameters={async () => ({
              method: "PUT" as const,
              url: "demo-upload-url"
            })}
            onComplete={(result) => {
              if (result.successful && result.successful[0]) {
                setAdImageUrl(result.successful[0].uploadURL);
                toast({
                  title: "File Uploaded!",
                  description: "Your campaign file has been uploaded successfully.",
                });
              }
            }}
            buttonClassName={`w-full ${adImageUrl ? 'bg-green-100 border-green-300' : ''}`}
          >
            <Upload className="w-4 h-4 mr-2" />
            {adImageUrl ? "✅ File Uploaded" : "📁 Upload Campaign File"}
          </ObjectUploader>
          
          {adImageUrl && (
            <div className="mt-3">
              <img 
                src={adImageUrl} 
                alt="Campaign preview" 
                className="w-full h-32 object-cover rounded-lg border"
              />
            </div>
          )}
        </div>
      </div>

      {/* Tier Selection */}
      <div className="space-y-4">
        <Label>Select Influencer Tier</Label>
        <div className="grid grid-cols-2 gap-3">
          {tiers.map((tier) => (
            <div
              key={tier.level}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedTier === tier.level 
                  ? 'border-accent bg-accent/10' 
                  : 'border-muted hover:border-accent/50'
              }`}
              onClick={() => setSelectedTier(tier.level)}
            >
              <div className="text-center">
                <h3 className="font-semibold text-sm">{tier.description}</h3>
                <p className="text-xs text-muted-foreground">{tier.range}</p>
                <div className="text-lg font-bold text-chart-2">${tier.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Number of Influencers */}
      <div className="space-y-2">
        <Label htmlFor="influencers">Number of Influencers</Label>
        <Input
          id="influencers"
          type="number"
          min="1"
          value={numberOfInfluencers}
          onChange={(e) => setNumberOfInfluencers(Math.max(1, parseInt(e.target.value) || 1))}
        />
      </div>

      {/* Cost Breakdown */}
      <Card className="p-4 bg-muted/50">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Campaign Cost:</span>
            <span>${campaignCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Platform Fee (10%):</span>
            <span>+${platformFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total Budget:</span>
            <span className="text-chart-1">${totalBudget.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isSubmitting ? "Creating..." : "Create Campaign & Pay"}
        </Button>
      </div>
    </div>
  );
}

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
    { level: 2, price: 200, range: "70K-150K", description: "Small Influencers" },
    { level: 3, price: 250, range: "150K-300K", description: "Mid-Tier Influencers" },
    { level: 4, price: 350, range: "300K-500K", description: "Growing Influencers" },
    { level: 5, price: 450, range: "500K-800K", description: "Established Influencers" },
    { level: 6, price: 550, range: "800K-1.2M", description: "Major Influencers" },
    { level: 7, price: 650, range: "1.2M-1.6M", description: "Top Influencers" },
    { level: 8, price: 750, range: "1.6M-2M", description: "Premium Influencers" },
    { level: 9, price: 850, range: "2M-3M", description: "Celebrity Influencers" },
    { level: 10, price: 950, range: "3M+", description: "Mega Influencers" },
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">🚀 Create Fresh Ad Campaign</DialogTitle>
                <p className="text-muted-foreground">Simple campaign creation with tier-based pricing</p>
              </DialogHeader>
              
              <NewFreshForm onSuccess={() => setIsCreateDialogOpen(false)} />
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
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
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
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Eye className="w-3 h-3 mr-1" />
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  Campaign Details - {ad.title}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Campaign Summary */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{ad.title}</h3>
                    <p className="text-muted-foreground">{ad.description || ad.briefMd}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <Users className="w-5 h-5 mx-auto mb-1 text-green-600" />
                      <div className="text-sm font-medium">{ad.numberOfInfluencers || ad.maxInfluencers}</div>
                      <div className="text-xs text-muted-foreground">Target Influencers</div>
                    </div>
                    
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <DollarSign className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                      <div className="text-sm font-medium">${Number(ad.totalBudget).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">Total Budget</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Brand:</span>
                      <span className="font-medium">{ad.brand}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tier Level:</span>
                      <Badge variant="secondary">Tier {ad.tierLevel}</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      {ad.status === 'active' ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          ✅ Live & Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          Pending Payment
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Reservations:</span>
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        {ad.reservedInfluencers || ad.currentReservations || 0}/{ad.numberOfInfluencers || ad.maxInfluencers}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Campaign Image */}
                <div className="space-y-4">
                  {ad.adImageUrl && (
                    <div>
                      <h4 className="font-medium mb-2">Campaign Creative</h4>
                      <img 
                        src={ad.adImageUrl} 
                        alt="Campaign creative"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {ad.status === 'active' && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">🚀 Campaign is Live!</h4>
                      <p className="text-sm text-muted-foreground">
                        Your campaign is now visible to {ad.numberOfInfluencers || ad.maxInfluencers} target creators. 
                        You'll receive notifications as creators reserve and complete your campaign.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {ad.status === 'pending_payment' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => {
                window.open(`/payment/${ad.id}`, '_blank', 'noopener,noreferrer');
              }}
            >
              <Edit className="w-3 h-3 mr-1" />
              Continue Payment
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}