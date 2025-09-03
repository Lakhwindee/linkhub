import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, MapPin, Users, Clock, Star, Plus, Search, Filter, Heart, 
  Eye, CheckCircle2, Plane, Camera, Utensils, Bed, Car, Shield, Award,
  Package, Building2, Globe, Crown, Zap, X, DollarSign, Calculator, CreditCard
} from "lucide-react";

interface TourPackage {
  id: string;
  title: string;
  description: string;
  destination: string;
  duration: number;
  price: number;
  currency: string;
  maxGroupSize: number;
  difficulty: 'easy' | 'moderate' | 'challenging';
  packageType: 'adventure' | 'cultural' | 'luxury' | 'backpacker' | 'family' | 'business';
  operatorName: string;
  operatorRating: number;
  images: string[];
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: any[];
  departureDate: string;
  availability: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  tags: string[];
  createdAt: string;
  budget: {
    basePrice: number;
    priceBreakdown: {
      accommodation: number;
      meals: number;
      transportation: number;
      activities: number;
      guide: number;
      insurance: number;
      taxes: number;
      other: number;
    };
    pricingTiers: {
      budget: { price: number; description: string; features: string[] };
      standard: { price: number; description: string; features: string[] };
      premium: { price: number; description: string; features: string[] };
    };
    additionalCosts: {
      name: string;
      price: number;
      optional: boolean;
      description: string;
    }[];
    discounts: {
      earlyBird: { percentage: number; deadline: string };
      groupDiscount: { minPeople: number; percentage: number };
      seasonalDiscount: { percentage: number; validFrom: string; validTo: string };
    };
    paymentTerms: {
      deposit: number;
      finalPayment: string;
      cancellationPolicy: string;
    };
  };
}

export default function TourPackages() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<TourPackage | null>(null);
  const [searchFilters, setSearchFilters] = useState({
    destination: "",
    duration: "",
    priceRange: "",
    packageType: "",
    search: ""
  });

  const queryClient = useQueryClient();

  // Fetch tour packages
  const { data: packages = [], isLoading } = useQuery<TourPackage[]>({
    queryKey: ["/api/tour-packages", searchFilters],
    retry: false,
  });

  // Create package mutation
  const createPackageMutation = useMutation({
    mutationFn: async (packageData: any) => {
      const response = await fetch("/api/tour-packages", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-demo-user": "true"
        },
        credentials: "include",
        body: JSON.stringify(packageData),
      });
      if (!response.ok) throw new Error("Failed to create package");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tour-packages"] });
      setIsCreateModalOpen(false);
    },
  });

  const handleCreatePackage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const packageData = {
      title: formData.get("title"),
      description: formData.get("description"),
      destination: formData.get("destination"),
      duration: Number(formData.get("duration")),
      price: Number(formData.get("price")),
      currency: "GBP",
      maxGroupSize: Number(formData.get("maxGroupSize")),
      difficulty: formData.get("difficulty"),
      packageType: formData.get("packageType"),
      operatorName: formData.get("operatorName"),
      highlights: (formData.get("highlights") as string)?.split('\n').filter(h => h.trim()),
      inclusions: (formData.get("inclusions") as string)?.split('\n').filter(i => i.trim()),
      exclusions: (formData.get("exclusions") as string)?.split('\n').filter(e => e.trim()),
      departureDate: formData.get("departureDate"),
      availability: Number(formData.get("availability")),
      tags: (formData.get("tags") as string)?.split(',').map(t => t.trim()).filter(t => t),
    };

    createPackageMutation.mutate(packageData);
  };

  const getPackageTypeIcon = (type: string) => {
    switch (type) {
      case 'adventure': return <Zap className="w-4 h-4" />;
      case 'cultural': return <Camera className="w-4 h-4" />;
      case 'luxury': return <Crown className="w-4 h-4" />;
      case 'backpacker': return <Package className="w-4 h-4" />;
      case 'family': return <Users className="w-4 h-4" />;
      case 'business': return <Building2 className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'challenging': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const PackageCard = ({ package: pkg }: { package: TourPackage }) => (
    <Card className="hover:shadow-xl transition-all duration-300 group overflow-hidden">
      {/* Package Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
        <div className="absolute top-3 left-3 z-20">
          {pkg.featured && <Badge className="bg-yellow-500 text-white">⭐ Featured</Badge>}
        </div>
        <div className="absolute top-3 right-3 z-20">
          <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
            <Heart className="w-4 h-4" />
          </Button>
        </div>
        <div className="absolute bottom-3 left-3 z-20 text-white">
          <div className="text-2xl font-bold">{pkg.currency} {pkg.budget?.basePrice.toLocaleString() || pkg.price.toLocaleString()}</div>
          <div className="text-sm opacity-90">per person</div>
          {pkg.budget?.pricingTiers && (
            <div className="text-xs opacity-75 mt-1">
              From {pkg.currency} {pkg.budget.pricingTiers.budget.price.toLocaleString()} 
            </div>
          )}
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {pkg.title}
          </CardTitle>
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{pkg.rating}</span>
            <span className="text-muted-foreground">({pkg.reviewCount})</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{pkg.destination}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{pkg.duration} days</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>Max {pkg.maxGroupSize}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{pkg.description}</p>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={getDifficultyColor(pkg.difficulty)}>
            {pkg.difficulty}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            {getPackageTypeIcon(pkg.packageType)}
            {pkg.packageType}
          </Badge>
          {pkg.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="space-y-3">
          {/* Budget Information */}
          {pkg.budget?.pricingTiers && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg p-3">
              <div className="text-sm font-medium mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Budget Options
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium text-green-600">Budget</div>
                  <div>{pkg.currency} {pkg.budget.pricingTiers.budget.price.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-blue-600">Standard</div>
                  <div>{pkg.currency} {pkg.budget.pricingTiers.standard.price.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-purple-600">Premium</div>
                  <div>{pkg.currency} {pkg.budget.pricingTiers.premium.price.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm font-medium mb-1">Tour Operator</div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="font-medium">{pkg.operatorName}</span>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs">{pkg.operatorRating}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => {
              // Handle booking logic
              console.log(`Booking package: ${pkg.id}`);
            }}
          >
            Book Now
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setSelectedPackage(pkg)}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const PackageDetailsModal = ({ package: pkg }: { package: TourPackage }) => (
    <Dialog open={!!selectedPackage} onOpenChange={() => setSelectedPackage(null)}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl">{pkg.title}</DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {pkg.destination}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {pkg.duration} days
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              Max {pkg.maxGroupSize} people
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {pkg.rating} ({pkg.reviewCount} reviews)
            </div>
          </div>
        </DialogHeader>
        
        <div className="overflow-y-auto">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
              <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
              <TabsTrigger value="inclusions">Inclusions</TabsTrigger>
              <TabsTrigger value="booking">Booking</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <div className="prose max-w-none">
                <p>{pkg.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Package Highlights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pkg.highlights?.map((highlight, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                        <span className="text-sm">{highlight}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Tour Operator
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Company:</span>
                      <span className="font-medium">{pkg.operatorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rating:</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{pkg.operatorRating}/5</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Group Size:</span>
                      <span className="font-medium">Max {pkg.maxGroupSize} people</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Difficulty:</span>
                      <Badge className={getDifficultyColor(pkg.difficulty)}>
                        {pkg.difficulty}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="budget" className="space-y-6">
              {pkg.budget && (
                <div className="space-y-6">
                  {/* Pricing Tiers */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        Pricing Tiers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50 dark:bg-green-950">
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600 mb-2">Budget</div>
                            <div className="text-2xl font-bold">{pkg.currency} {pkg.budget.pricingTiers.budget.price.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground mb-3">{pkg.budget.pricingTiers.budget.description}</div>
                            <div className="space-y-1 text-sm">
                              {pkg.budget.pricingTiers.budget.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600 mb-2">Standard</div>
                            <div className="text-2xl font-bold">{pkg.currency} {pkg.budget.pricingTiers.standard.price.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground mb-3">{pkg.budget.pricingTiers.standard.description}</div>
                            <div className="space-y-1 text-sm">
                              {pkg.budget.pricingTiers.standard.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50 dark:bg-purple-950">
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600 mb-2">Premium</div>
                            <div className="text-2xl font-bold">{pkg.currency} {pkg.budget.pricingTiers.premium.price.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground mb-3">{pkg.budget.pricingTiers.premium.description}</div>
                            <div className="space-y-1 text-sm">
                              {pkg.budget.pricingTiers.premium.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <CheckCircle2 className="w-3 h-3 text-purple-600" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Price Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-blue-600" />
                        Price Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 border rounded-lg">
                          <Bed className="w-6 h-6 mx-auto mb-2 text-primary" />
                          <div className="font-semibold">Accommodation</div>
                          <div className="text-lg">{pkg.currency} {pkg.budget.priceBreakdown.accommodation.toLocaleString()}</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <Utensils className="w-6 h-6 mx-auto mb-2 text-primary" />
                          <div className="font-semibold">Meals</div>
                          <div className="text-lg">{pkg.currency} {pkg.budget.priceBreakdown.meals.toLocaleString()}</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <Car className="w-6 h-6 mx-auto mb-2 text-primary" />
                          <div className="font-semibold">Transport</div>
                          <div className="text-lg">{pkg.currency} {pkg.budget.priceBreakdown.transportation.toLocaleString()}</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <Camera className="w-6 h-6 mx-auto mb-2 text-primary" />
                          <div className="font-semibold">Activities</div>
                          <div className="text-lg">{pkg.currency} {pkg.budget.priceBreakdown.activities.toLocaleString()}</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                          <div className="font-semibold">Guide</div>
                          <div className="text-lg">{pkg.currency} {pkg.budget.priceBreakdown.guide.toLocaleString()}</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                          <div className="font-semibold">Insurance</div>
                          <div className="text-lg">{pkg.currency} {pkg.budget.priceBreakdown.insurance.toLocaleString()}</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <Calculator className="w-6 h-6 mx-auto mb-2 text-primary" />
                          <div className="font-semibold">Taxes</div>
                          <div className="text-lg">{pkg.currency} {pkg.budget.priceBreakdown.taxes.toLocaleString()}</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <Package className="w-6 h-6 mx-auto mb-2 text-primary" />
                          <div className="font-semibold">Other</div>
                          <div className="text-lg">{pkg.currency} {pkg.budget.priceBreakdown.other.toLocaleString()}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Terms */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-green-600" />
                        Payment Terms
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <div className="font-semibold mb-2">Deposit Required</div>
                          <div className="text-2xl font-bold text-green-600">{pkg.budget.paymentTerms.deposit}%</div>
                          <div className="text-sm text-muted-foreground">of total package price</div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="font-semibold mb-2">Final Payment</div>
                          <div className="text-lg">{pkg.budget.paymentTerms.finalPayment}</div>
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <div className="font-semibold mb-2">Cancellation Policy</div>
                        <div className="text-sm">{pkg.budget.paymentTerms.cancellationPolicy}</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Discounts */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        Available Discounts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg text-center">
                          <div className="font-semibold text-orange-600 mb-2">Early Bird</div>
                          <div className="text-2xl font-bold">{pkg.budget.discounts.earlyBird.percentage}% OFF</div>
                          <div className="text-sm text-muted-foreground">Book before {pkg.budget.discounts.earlyBird.deadline}</div>
                        </div>
                        <div className="p-4 border rounded-lg text-center">
                          <div className="font-semibold text-blue-600 mb-2">Group Discount</div>
                          <div className="text-2xl font-bold">{pkg.budget.discounts.groupDiscount.percentage}% OFF</div>
                          <div className="text-sm text-muted-foreground">{pkg.budget.discounts.groupDiscount.minPeople}+ people</div>
                        </div>
                        <div className="p-4 border rounded-lg text-center">
                          <div className="font-semibold text-green-600 mb-2">Seasonal</div>
                          <div className="text-2xl font-bold">{pkg.budget.discounts.seasonalDiscount.percentage}% OFF</div>
                          <div className="text-sm text-muted-foreground">Valid season dates</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="inclusions" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-green-600">✅ What's Included</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pkg.inclusions?.map((inclusion, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                        <span className="text-sm">{inclusion}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-red-600">❌ What's Not Included</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pkg.exclusions?.map((exclusion, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <X className="w-4 h-4 text-red-500 mt-0.5" />
                        <span className="text-sm">{exclusion}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="booking" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Book This Package</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-primary/10 p-6 rounded-lg space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {pkg.currency} {pkg.budget?.basePrice.toLocaleString() || pkg.price.toLocaleString()}
                      </div>
                      <div className="text-muted-foreground">per person (Standard Package)</div>
                    </div>
                    
                    {pkg.budget?.pricingTiers && (
                      <div className="border-t pt-4">
                        <div className="text-sm font-medium mb-3">Choose Your Package:</div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="p-2 border rounded text-center hover:bg-green-50 cursor-pointer">
                            <div className="font-medium text-green-600">Budget</div>
                            <div>{pkg.currency} {pkg.budget.pricingTiers.budget.price.toLocaleString()}</div>
                          </div>
                          <div className="p-2 border-2 border-primary rounded text-center bg-primary/10">
                            <div className="font-medium text-primary">Standard</div>
                            <div>{pkg.currency} {pkg.budget.pricingTiers.standard.price.toLocaleString()}</div>
                          </div>
                          <div className="p-2 border rounded text-center hover:bg-purple-50 cursor-pointer">
                            <div className="font-medium text-purple-600">Premium</div>
                            <div>{pkg.currency} {pkg.budget.pricingTiers.premium.price.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Departure Date</Label>
                      <Input type="date" defaultValue={pkg.departureDate} />
                    </div>
                    <div>
                      <Label>Number of Travelers</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select travelers" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: pkg.maxGroupSize }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>
                              {i + 1} {i === 0 ? 'traveler' : 'travelers'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Special Requirements</Label>
                    <Textarea placeholder="Any dietary restrictions, accessibility needs, or special requests..." />
                  </div>

                  <Button size="lg" className="w-full">
                    <Shield className="w-5 h-5 mr-2" />
                    Secure Booking - Reserve Now
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    <Shield className="w-4 h-4 inline mr-1" />
                    Secure payment • Free cancellation up to 48 hours • Best price guarantee
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Professional Tour Packages</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover amazing travel experiences from verified tour operators worldwide
            </p>
            <div className="flex justify-center">
              <Button 
                size="lg" 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-5 h-5 mr-2" />
                List Your Package
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Search & Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Find Your Perfect Package
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Input
                placeholder="Search packages..."
                value={searchFilters.search}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, search: e.target.value }))}
              />
              <Input
                placeholder="Destination"
                value={searchFilters.destination}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, destination: e.target.value }))}
              />
              <Select value={searchFilters.duration} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, duration: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Durations</SelectItem>
                  <SelectItem value="1-3">1-3 days</SelectItem>
                  <SelectItem value="4-7">4-7 days</SelectItem>
                  <SelectItem value="8-14">8-14 days</SelectItem>
                  <SelectItem value="15+">15+ days</SelectItem>
                </SelectContent>
              </Select>
              <Select value={searchFilters.priceRange} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, priceRange: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="0-500">£0 - £500</SelectItem>
                  <SelectItem value="500-1000">£500 - £1,000</SelectItem>
                  <SelectItem value="1000-2000">£1,000 - £2,000</SelectItem>
                  <SelectItem value="2000+">£2,000+</SelectItem>
                </SelectContent>
              </Select>
              <Select value={searchFilters.packageType} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, packageType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Package Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="adventure">Adventure</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="backpacker">Backpacker</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} package={pkg} />
          ))}
        </div>

        {packages.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No packages found</h3>
            <p className="text-muted-foreground mb-4">Be the first to create an amazing tour package!</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Package
            </Button>
          </div>
        )}
      </div>

      {/* Package Details Modal */}
      {selectedPackage && <PackageDetailsModal package={selectedPackage} />}

      {/* Create Package Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Create Tour Package</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreatePackage} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Package Title *</Label>
                <Input id="title" name="title" placeholder="Amazing Europe Photography Tour" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operatorName">Tour Operator Name *</Label>
                <Input id="operatorName" name="operatorName" placeholder="Your Company Name" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" name="description" placeholder="Describe your amazing tour package..." rows={3} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="destination">Destination *</Label>
                <Input id="destination" name="destination" placeholder="Europe, Asia, etc." required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days) *</Label>
                <Input id="duration" name="duration" type="number" min="1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (£) *</Label>
                <Input id="price" name="price" type="number" min="0" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxGroupSize">Max Group Size *</Label>
                <Input id="maxGroupSize" name="maxGroupSize" type="number" min="1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select name="difficulty">
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="challenging">Challenging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="packageType">Package Type</Label>
                <Select name="packageType">
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adventure">Adventure</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                    <SelectItem value="backpacker">Backpacker</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departureDate">Departure Date</Label>
                <Input id="departureDate" name="departureDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availability">Available Spots</Label>
                <Input id="availability" name="availability" type="number" min="1" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="highlights">Package Highlights (one per line)</Label>
              <Textarea id="highlights" name="highlights" placeholder="Professional photography guidance&#10;Visit to iconic landmarks&#10;Local cultural experiences" rows={4} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inclusions">What's Included (one per line)</Label>
                <Textarea id="inclusions" name="inclusions" placeholder="Accommodation&#10;Meals&#10;Transportation&#10;Tour guide" rows={4} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exclusions">What's NOT Included (one per line)</Label>
                <Textarea id="exclusions" name="exclusions" placeholder="International flights&#10;Personal expenses&#10;Travel insurance" rows={4} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" name="tags" placeholder="photography, culture, adventure, food" />
            </div>

            {/* Budget Planning Section */}
            <div className="space-y-6 border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-semibold">Budget & Pricing</h3>
              </div>

              {/* Pricing Tiers */}
              <div className="space-y-4">
                <Label className="text-lg font-medium">Pricing Tiers</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50 dark:bg-green-950">
                    <Label className="text-base font-medium text-green-600 mb-3 block">Budget Package</Label>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="budgetPrice" className="text-sm">Price (£)</Label>
                        <Input id="budgetPrice" name="budgetPrice" type="number" placeholder="599" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="budgetDescription" className="text-sm">Description</Label>
                        <Input id="budgetDescription" name="budgetDescription" placeholder="Essential experience" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="budgetFeatures" className="text-sm">Features (one per line)</Label>
                        <Textarea id="budgetFeatures" name="budgetFeatures" placeholder="Basic accommodation&#10;Group transport&#10;Essential activities" rows={3} className="mt-1" />
                      </div>
                    </div>
                  </div>

                  <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
                    <Label className="text-base font-medium text-blue-600 mb-3 block">Standard Package</Label>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="standardPrice" className="text-sm">Price (£)</Label>
                        <Input id="standardPrice" name="standardPrice" type="number" placeholder="899" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="standardDescription" className="text-sm">Description</Label>
                        <Input id="standardDescription" name="standardDescription" placeholder="Complete experience" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="standardFeatures" className="text-sm">Features (one per line)</Label>
                        <Textarea id="standardFeatures" name="standardFeatures" placeholder="Comfortable accommodation&#10;Private transport&#10;All activities included&#10;Professional guide" rows={3} className="mt-1" />
                      </div>
                    </div>
                  </div>

                  <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50 dark:bg-purple-950">
                    <Label className="text-base font-medium text-purple-600 mb-3 block">Premium Package</Label>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="premiumPrice" className="text-sm">Price (£)</Label>
                        <Input id="premiumPrice" name="premiumPrice" type="number" placeholder="1299" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="premiumDescription" className="text-sm">Description</Label>
                        <Input id="premiumDescription" name="premiumDescription" placeholder="Luxury experience" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="premiumFeatures" className="text-sm">Features (one per line)</Label>
                        <Textarea id="premiumFeatures" name="premiumFeatures" placeholder="Luxury accommodation&#10;Premium transport&#10;Exclusive activities&#10;Personal guide&#10;Fine dining" rows={3} className="mt-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-4">
                <Label className="text-lg font-medium">Price Breakdown (Standard Package)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="accommodationCost" className="text-sm">Accommodation (£)</Label>
                    <Input id="accommodationCost" name="accommodationCost" type="number" placeholder="300" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="mealsCost" className="text-sm">Meals (£)</Label>
                    <Input id="mealsCost" name="mealsCost" type="number" placeholder="200" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="transportCost" className="text-sm">Transport (£)</Label>
                    <Input id="transportCost" name="transportCost" type="number" placeholder="150" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="activitiesCost" className="text-sm">Activities (£)</Label>
                    <Input id="activitiesCost" name="activitiesCost" type="number" placeholder="180" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="guideCost" className="text-sm">Guide (£)</Label>
                    <Input id="guideCost" name="guideCost" type="number" placeholder="100" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="insuranceCost" className="text-sm">Insurance (£)</Label>
                    <Input id="insuranceCost" name="insuranceCost" type="number" placeholder="50" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="taxesCost" className="text-sm">Taxes (£)</Label>
                    <Input id="taxesCost" name="taxesCost" type="number" placeholder="80" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="otherCost" className="text-sm">Other (£)</Label>
                    <Input id="otherCost" name="otherCost" type="number" placeholder="40" className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Payment Terms */}
              <div className="space-y-4">
                <Label className="text-lg font-medium">Payment Terms</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="depositPercentage" className="text-sm">Deposit Required (%)</Label>
                    <Input id="depositPercentage" name="depositPercentage" type="number" placeholder="25" min="0" max="100" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="finalPaymentDue" className="text-sm">Final Payment Due</Label>
                    <Input id="finalPaymentDue" name="finalPaymentDue" placeholder="30 days before departure" className="mt-1" />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="cancellationPolicy" className="text-sm">Cancellation Policy</Label>
                    <Textarea id="cancellationPolicy" name="cancellationPolicy" placeholder="Free cancellation up to 48 hours before departure..." rows={2} className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Discounts */}
              <div className="space-y-4">
                <Label className="text-lg font-medium">Available Discounts</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <Label className="text-base font-medium text-orange-600 block mb-2">Early Bird Discount</Label>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="earlyBirdPercentage" className="text-sm">Discount (%)</Label>
                        <Input id="earlyBirdPercentage" name="earlyBirdPercentage" type="number" placeholder="15" min="0" max="50" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="earlyBirdDeadline" className="text-sm">Booking Deadline</Label>
                        <Input id="earlyBirdDeadline" name="earlyBirdDeadline" placeholder="60 days before departure" className="mt-1" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <Label className="text-base font-medium text-blue-600 block mb-2">Group Discount</Label>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="groupDiscountPercentage" className="text-sm">Discount (%)</Label>
                        <Input id="groupDiscountPercentage" name="groupDiscountPercentage" type="number" placeholder="10" min="0" max="30" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="groupMinPeople" className="text-sm">Minimum People</Label>
                        <Input id="groupMinPeople" name="groupMinPeople" type="number" placeholder="6" min="2" className="mt-1" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <Label className="text-base font-medium text-green-600 block mb-2">Seasonal Discount</Label>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="seasonalPercentage" className="text-sm">Discount (%)</Label>
                        <Input id="seasonalPercentage" name="seasonalPercentage" type="number" placeholder="20" min="0" max="40" className="mt-1" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="seasonalStart" className="text-xs">Valid From</Label>
                          <Input id="seasonalStart" name="seasonalStart" type="date" className="mt-1" />
                        </div>
                        <div>
                          <Label htmlFor="seasonalEnd" className="text-xs">Valid To</Label>
                          <Input id="seasonalEnd" name="seasonalEnd" type="date" className="mt-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createPackageMutation.isPending}>
                {createPackageMutation.isPending ? "Creating..." : "Create Package"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}