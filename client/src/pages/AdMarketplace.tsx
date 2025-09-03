import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ObjectUploader } from "@/components/ObjectUploader";
import { DollarSign, Search, Filter, Calendar, MapPin, Tag, Clock, Upload, Eye, CheckCircle, Download } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import type { Ad, AdReservation } from "@shared/schema";

export default function AdMarketplace() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("campaigns");
  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);
  const [showCountdownOverlay, setShowCountdownOverlay] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Check creator plan access
  useEffect(() => {
    if (user && user.plan !== 'creator') {
      toast({
        title: "Creator Plan Required",
        description: "You need a Creator plan to access the Ad Marketplace.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Fetch ads
  const { data: ads = [], isLoading: adsLoading, error: adsError } = useQuery({
    queryKey: ["/api/ads"],
    enabled: user?.plan === 'creator',
    retry: false,
  });

  // Fetch user's reservations
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ["/api/reservations"],
    enabled: user?.plan === 'creator',
    retry: false,
  });

  // Handle unauthorized error
  useEffect(() => {
    if (adsError && isUnauthorizedError(adsError)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [adsError, toast]);

  const reserveAdMutation = useMutation({
    mutationFn: async (adId: string) => {
      return await apiRequest("POST", `/api/ads/${adId}/reserve`);
    },
    onSuccess: () => {
      setIsReserveDialogOpen(false); // Close dialog
      setShowCountdownOverlay(true); // Show countdown overlay
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      
      // Hide overlay and switch tab after 2 seconds
      setTimeout(() => {
        setShowCountdownOverlay(false);
        setCurrentTab("my-campaigns");
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Reservation Failed",
        description: error.message || "Failed to reserve campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  const submitAdMutation = useMutation({
    mutationFn: async (data: { adId: string; rawFileUrl: string }) => {
      return await apiRequest("POST", `/api/ads/${data.adId}/submit`, {
        rawFileUrl: data.rawFileUrl
      });
    },
    onSuccess: () => {
      toast({
        title: "Submission Sent",
        description: "Your content has been submitted for review.",
      });
      setIsSubmitDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMediaUpload = async () => {
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

  const handleMediaComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0 && selectedAd) {
      const uploadedFile = result.successful[0];
      try {
        const response = await apiRequest("PUT", "/api/media", {
          mediaUrl: uploadedFile.uploadURL
        });
        const { objectPath } = await response.json();
        
        submitAdMutation.mutate({
          adId: selectedAd.id,
          rawFileUrl: objectPath
        });
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: "Failed to process uploaded media. Please try again.",
          variant: "destructive",
        });
      }
    }
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

  if (user.plan !== 'creator') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="p-12 text-center">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-yellow-600 dark:text-yellow-400" />
              <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200 mb-4">
                Creator Plan Required
              </h2>
              <p className="text-yellow-700 dark:text-yellow-300 mb-6">
                Upgrade to the Creator plan to access the Ad Marketplace and start earning from brand collaborations.
              </p>
              <Button asChild className="bg-yellow-600 hover:bg-yellow-700 text-white" data-testid="button-upgrade-to-creator">
                <Link href="/subscribe">Upgrade to Creator</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const filteredAds = ads.filter((ad: Ad) => {
    const matchesSearch = !searchQuery || 
      ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.brand.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCountry = !countryFilter || 
      ad.countries?.includes(countryFilter);

    return matchesSearch && matchesCountry;
  });

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2" data-testid="heading-ad-marketplace">
              <DollarSign className="w-8 h-8 text-chart-2" />
              <span>Ad Marketplace</span>
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-marketplace-subtitle">
              Discover brand campaigns and start earning from your content
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" data-testid="badge-creator-status">
              Creator Member
            </Badge>
            <Badge variant="outline" data-testid="badge-active-reservations">
              {reservations.length} Active Reservations
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <Card data-testid="card-search-filters">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search campaigns by brand or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-campaigns"
                />
              </div>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-country-filter">
                  <SelectValue placeholder="Filter by country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="IN">India</SelectItem>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="JP">Japan</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="campaigns" data-testid="tab-available">
              Available Campaigns
            </TabsTrigger>
            <TabsTrigger value="my-campaigns" data-testid="tab-my-campaigns">
              My Campaigns
            </TabsTrigger>
          </TabsList>

          {/* Available Campaigns */}
          <TabsContent value="campaigns" className="space-y-6">
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
            ) : filteredAds.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAds.map((ad: Ad) => (
                  <Card key={ad.id} className="travel-card" data-testid={`card-ad-${ad.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-card-foreground" data-testid={`text-ad-title-${ad.id}`}>
                            {ad.title}
                          </h3>
                          <p className="text-sm text-muted-foreground" data-testid={`text-ad-brand-${ad.id}`}>
                            by {ad.brand}
                          </p>
                        </div>
                        <Badge className="bg-chart-2 text-primary" data-testid={`badge-ad-payout-${ad.id}`}>
                          £{ad.payoutAmount}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Requirements</h4>
                        <div className="text-sm text-muted-foreground" data-testid={`text-ad-brief-${ad.id}`}>
                          {ad.briefMd.slice(0, 150)}...
                        </div>
                      </div>

                      {ad.countries && ad.countries.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            Locations
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {ad.countries.slice(0, 3).map((country, index) => (
                              <Badge key={index} variant="outline" className="text-xs" data-testid={`badge-ad-country-${ad.id}-${index}`}>
                                {country}
                              </Badge>
                            ))}
                            {ad.countries.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{ad.countries.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {ad.hashtags && ad.hashtags.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm flex items-center">
                            <Tag className="w-3 h-3 mr-1" />
                            Hashtags
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {ad.hashtags.slice(0, 3).map((hashtag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs" data-testid={`badge-ad-hashtag-${ad.id}-${index}`}>
                                #{hashtag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span data-testid={`text-ad-deadline-${ad.id}`}>
                            Due {format(new Date(ad.deadlineAt), 'MMM d')}
                          </span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <span data-testid={`text-ad-quota-${ad.id}`}>
                            {ad.currentReservations}/{ad.quota} reserved
                          </span>
                        </div>
                      </div>

                      <Dialog open={isReserveDialogOpen} onOpenChange={setIsReserveDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            className="w-full bg-accent hover:bg-accent/90"
                            disabled={reserveAdMutation.isPending || (ad.currentReservations || 0) >= (ad.quota || 1)}
                            data-testid={`button-reserve-ad-${ad.id}`}
                          >
                            {reserveAdMutation.isPending ? (
                              <div className="animate-spin w-3 h-3 border-2 border-accent-foreground border-t-transparent rounded-full" />
                            ) : (
                              "Reserve Campaign"
                            )}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-xl">{ad.title}</DialogTitle>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">by {ad.brand}</span>
                              <Badge className="bg-chart-2 text-primary text-lg px-3 py-1">£{ad.payoutAmount}</Badge>
                            </div>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                            {/* Campaign Brief */}
                            <div>
                              <h4 className="font-semibold mb-3 text-lg">Campaign Brief</h4>
                              <div className="prose prose-sm text-foreground" dangerouslySetInnerHTML={{ __html: ad.briefMd }} />
                            </div>

                            {/* Promotion Instructions */}
                            <div className="bg-muted/50 p-4 rounded-lg border">
                              <h4 className="font-semibold mb-3 text-lg flex items-center">
                                <span className="w-2 h-2 bg-accent rounded-full mr-2"></span>
                                How to Promote This Campaign
                              </h4>
                              <div className="space-y-3 text-sm">
                                <p className="text-foreground leading-relaxed">
                                  <strong>Step 1:</strong> Download the brand assets and promotional materials below
                                </p>
                                <p className="text-foreground leading-relaxed">
                                  <strong>Step 2:</strong> Create your content (photo/video) featuring the brand naturally
                                </p>
                                <p className="text-foreground leading-relaxed">
                                  <strong>Step 3:</strong> Include the promotional file/image in your content or mention the brand verbally
                                </p>
                                <p className="text-foreground leading-relaxed">
                                  <strong>Step 4:</strong> Create a clip starting 5 seconds before this promotion begins and ending 5 seconds after it finishes - upload this specific segment
                                </p>
                                <p className="text-foreground leading-relaxed">
                                  <strong>Step 5:</strong> Upload your final promotion clip and your content link for approval to receive payment
                                </p>
                              </div>
                            </div>

                            {/* Download Promotional File */}
                            <div className="bg-accent/10 p-4 rounded-lg">
                              <h4 className="font-semibold mb-3 flex items-center">
                                <Download className="w-4 h-4 mr-2" />
                                Download Promotional File
                              </h4>
                              <Button variant="outline" size="lg" className="w-full justify-center">
                                <Download className="w-4 h-4 mr-2" />
                                Download File
                              </Button>
                            </div>


                            {/* Campaign Stats */}
                            <div className="flex items-center justify-between pt-4 border-t">
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4 mr-2" />
                                Deadline: {format(new Date(ad.deadlineAt), 'MMM d, yyyy')}
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <span>{ad.currentReservations}/{ad.quota} spots reserved</span>
                              </div>
                            </div>

                            {/* Reserve Button */}
                            <div className="pt-4">
                              <Button 
                                size="lg" 
                                className="w-full bg-accent hover:bg-accent/90 text-lg py-6"
                                onClick={() => {
                                  reserveAdMutation.mutate(ad.id);
                                }}
                                disabled={reserveAdMutation.isPending || (ad.currentReservations || 0) >= (ad.quota || 1)}
                              >
                                {reserveAdMutation.isPending ? (
                                  <div className="animate-spin w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full" />
                                ) : (
                                  `Reserve This Campaign for £${ad.payoutAmount}`
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card data-testid="card-no-campaigns">
                <CardContent className="p-12 text-center">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No campaigns available</h3>
                  <p className="text-muted-foreground">
                    No brand campaigns match your filters. Try adjusting your search criteria.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* My Campaigns */}
          <TabsContent value="my-campaigns" className="space-y-6">
            {reservationsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6 space-y-4">
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : reservations.length > 0 ? (
              <div className="space-y-4">
                {reservations.map((reservation: AdReservation) => (
                  <Card key={reservation.id} className="border-accent" data-testid={`card-reservation-${reservation.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-card-foreground" data-testid={`text-reservation-title-${reservation.id}`}>
                              Campaign Reserved
                            </h3>
                            <Badge 
                              variant={reservation.status === 'active' ? 'default' : 'secondary'}
                              data-testid={`badge-reservation-status-${reservation.id}`}
                            >
                              {reservation.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-sm text-muted-foreground">
                              <Clock className="w-4 h-4 inline mr-1" />
                              Deadline: {formatDistanceToNow(new Date(reservation.expiresAt!))} remaining
                            </div>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                              ⏰ 5 Days Campaign
                            </Badge>
                          </div>
                        </div>

                        {reservation.status === 'active' && (
                          <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                className="bg-chart-2 hover:bg-chart-2/90"
                                onClick={() => setSelectedAd({ id: reservation.adId! } as Ad)}
                                data-testid={`button-submit-content-${reservation.id}`}
                              >
                                <Upload className="w-3 h-3 mr-2" />
                                Submit Content
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Submit Campaign Content</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p className="text-muted-foreground">
                                  Upload your final video or image content for admin review.
                                </p>
                                
                                <ObjectUploader
                                  maxNumberOfFiles={1}
                                  maxFileSize={100 * 1024 * 1024} // 100MB
                                  onGetUploadParameters={handleMediaUpload}
                                  onComplete={handleMediaComplete}
                                  buttonClassName="w-full bg-accent hover:bg-accent/90"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Content
                                </ObjectUploader>

                                <p className="text-xs text-muted-foreground">
                                  Supported formats: MP4, MOV, JPG, PNG. Max size: 100MB
                                </p>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card data-testid="card-no-reservations">
                <CardContent className="p-12 text-center">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No active campaigns</h3>
                  <p className="text-muted-foreground mb-6">
                    You haven't reserved any campaigns yet. Browse available campaigns to get started.
                  </p>
                  <Button variant="outline" data-testid="button-browse-campaigns">
                    Browse Campaigns
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
