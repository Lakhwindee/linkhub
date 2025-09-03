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
  Package, Building2, Globe, Crown, Zap, X
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
          <div className="text-2xl font-bold">{pkg.currency} {pkg.price.toLocaleString()}</div>
          <div className="text-sm opacity-90">per person</div>
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
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
                  <div className="bg-primary/10 p-6 rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {pkg.currency} {pkg.price.toLocaleString()}
                    </div>
                    <div className="text-muted-foreground">per person</div>
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