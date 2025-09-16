import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/lib/permissions";
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
  Package, Building2, Globe, X, DollarSign, History, Mail, Phone, User
} from "lucide-react";

// Use simplified tour package interface
import { SimpleTourPackage } from '@/types/simpleTourPackage';
import { worldCountries, countryCodes } from '@/data/locationData';
import { PlatformFeeBreakdown } from '@/components/PlatformFeeBreakdown';
import { BookingConfirmation } from '@/components/BookingConfirmation';
import { format, parseISO } from "date-fns";

type TourPackage = SimpleTourPackage;

export default function TourPackages() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<TourPackage | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingPackage, setBookingPackage] = useState<TourPackage | null>(null);
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  const [currentBookingPackage, setCurrentBookingPackage] = useState<TourPackage | null>(null);
  const [bookingDetails, setBookingDetails] = useState({
    travelers: 1,
    departureDate: '',
    specialRequests: '',
    contactInfo: {
      name: '',
      email: '',
      countryCode: '+44', // Default to UK
      phone: '',
      emergencyContact: ''
    }
  });
  const [searchFilters, setSearchFilters] = useState({
    destination: "",
    duration: "",
    priceRange: "",
    packageType: "",
    search: ""
  });

  const { user } = useAuth();
  const permissions = usePermissions(user);
  const queryClient = useQueryClient();

  // Fetch tour packages - Publisher sees only their own packages
  const apiEndpoint = user?.role === 'publisher' ? "/api/my-tour-packages" : "/api/tour-packages";
  const { data: packages = [], isLoading } = useQuery<TourPackage[]>({
    queryKey: [apiEndpoint, searchFilters],
    retry: false,
  });

  // Tour package bookings query
  const { data: tourBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['my-bookings', 'tour-packages', user?.id],
    queryFn: async () => {
      // Check if demo user is authenticated via localStorage system
      const demoUser = localStorage.getItem('demo_user');
      const isDemoUser = !!demoUser;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add demo session header for authentication if demo user
      if (isDemoUser) {
        const demoSession = localStorage.getItem('demo_session');
        if (demoSession) {
          headers['x-demo-session'] = demoSession;
        }
      }
      
      const response = await fetch('/api/my-bookings/tour-packages', {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch tour package bookings');
      }
      return response.json();
    },
    enabled: !!user?.id
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
      queryClient.invalidateQueries({ queryKey: ["/api/my-tour-packages"] });
      setIsCreateModalOpen(false);
    },
  });

  // Book package mutation
  const bookPackageMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      // Get demo session for authentication
      const demoSession = localStorage.getItem('demo_session');
      
      const headers: Record<string, string> = { 
        "Content-Type": "application/json"
      };
      
      // Add demo session header if available
      if (demoSession) {
        headers["x-demo-session"] = demoSession;
      } else {
        headers["x-demo-user"] = "true"; // Fallback
      }
      
      const response = await fetch(`/api/tour-packages/${bookingData.packageId}/book`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(bookingData),
      });
      if (!response.ok) throw new Error("Failed to book package");
      return response.json();
    },
  });

  const handleCreatePackage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const packageData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      destination: formData.get("destination") as string,
      country: formData.get("country") as string,
      city: formData.get("city") as string,
      duration: Number(formData.get("duration")),
      price: Number(formData.get("price")),
      currency: formData.get("currency") as string || "USD",
      maxGroupSize: Number(formData.get("maxGroupSize")),
      difficulty: formData.get("difficulty"),
      packageType: formData.get("packageType"),
      operatorName: formData.get("operatorName"),
      highlights: (formData.get("highlights") as string)?.split('\n').filter(h => h.trim()),
      inclusions: (formData.get("inclusions") as string)?.split('\n').filter(i => i.trim()),
      exclusions: (formData.get("exclusions") as string)?.split('\n').filter(e => e.trim()),
      departureDate: formData.get("departureDate"),
      returnDate: formData.get("returnDate"),
      availability: Number(formData.get("availability")),
      tags: (formData.get("tags") as string)?.split(',').map(t => t.trim()).filter(t => t),
    };

    createPackageMutation.mutate(packageData);
  };

  const handleBookNow = (pkg: TourPackage) => {
    setCurrentBookingPackage(pkg);
    setBookingDetails(prev => ({
      ...prev,
      contactInfo: {
        name: user?.displayName || `${user?.firstName} ${user?.lastName}` || '',
        email: user?.email || '',
        countryCode: prev.contactInfo.countryCode || '+44', // Preserve existing or default
        phone: '',
        emergencyContact: ''
      }
    }));
    setBookingFormOpen(true);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBookingPackage) return;

    // Validate and normalize phone number to E.164 format
    const validatePhoneNumber = (countryCode: string, phone: string) => {
      if (!countryCode || !phone) {
        throw new Error('Phone number and country code are required');
      }
      
      // Remove all non-digits except + from country code
      const cleanCountryCode = countryCode.replace(/[^\d+]/g, '');
      // Remove all non-digits from phone number
      const cleanPhone = phone.replace(/\D/g, '');
      
      if (!cleanPhone) {
        throw new Error('Please enter a valid phone number');
      }
      
      // Compose E.164 format: countryCode + phone
      const e164Phone = cleanCountryCode + cleanPhone;
      
      // Validate E.164 length (8-15 digits after +)
      const digitsOnly = e164Phone.replace(/\D/g, '');
      if (digitsOnly.length < 8 || digitsOnly.length > 15) {
        throw new Error('Phone number must be between 8-15 digits');
      }
      
      return e164Phone;
    };

    try {
      // Validate phone number
      const phoneE164 = validatePhoneNumber(
        bookingDetails.contactInfo.countryCode, 
        bookingDetails.contactInfo.phone
      );

      const bookingData = {
        packageId: currentBookingPackage.id,
        travelers: bookingDetails.travelers,
        departureDate: bookingDetails.departureDate,
        specialRequests: bookingDetails.specialRequests,
        contactInfo: {
          ...bookingDetails.contactInfo,
          phoneE164, // Include normalized phone number
        },
        message: `Booking for ${bookingDetails.travelers} travelers. Contact: ${bookingDetails.contactInfo.name} (${bookingDetails.contactInfo.email}), Phone: ${phoneE164}`
      };

      await bookPackageMutation.mutateAsync(bookingData);
      setBookingPackage(currentBookingPackage);
      setBookingFormOpen(false);
      setIsBookingModalOpen(true);
    } catch (error) {
      console.error('Booking failed:', error);
      if (error instanceof Error) {
        alert(`Booking failed: ${error.message}`);
      } else {
        alert('Booking failed. Please try again.');
      }
    }
  };

  const getPackageTypeIcon = (type: string) => {
    switch (type) {
      case 'adventure': return <Plane className="w-4 h-4" />;
      case 'cultural': return <Camera className="w-4 h-4" />;
      case 'luxury': return <Award className="w-4 h-4" />;
      case 'wildlife': return <Shield className="w-4 h-4" />;
      case 'beach': return <Utensils className="w-4 h-4" />;
      case 'heritage': return <Package className="w-4 h-4" />;
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

        {/* Simple Tour Operator Info - Travel Website Style */}
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">{pkg.operatorName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{pkg.operatorRating}</span>
            </div>
          </div>
        </div>

        {/* Key Highlights */}
        {pkg.highlights && pkg.highlights.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Highlights:</div>
            <div className="space-y-1">
              {pkg.highlights.slice(0, 3).map((highlight, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground text-xs leading-relaxed">{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={() => handleBookNow(pkg)}
            disabled={bookPackageMutation.isPending}
          >
            {bookPackageMutation.isPending ? "Booking..." : "Book Now"}
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
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Package Pricing</h3>
                <div className="bg-primary/10 rounded-lg p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{pkg.currency} {pkg.price.toLocaleString()}</div>
                    <div className="text-muted-foreground">per person</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="itinerary" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Tour Itinerary</h3>
                <p className="text-muted-foreground">Detailed itinerary will be provided upon booking confirmation.</p>
              </div>
            </TabsContent>

            <TabsContent value="inclusions" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-green-600">✓ What's Included</CardTitle>
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
                    <CardTitle className="text-lg text-red-600">✗ What's Not Included</CardTitle>
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
                  <CardTitle className="text-xl">Ready to Book?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-primary/10 rounded-lg p-4">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold">{pkg.currency} {pkg.price.toLocaleString()}</div>
                      <div className="text-muted-foreground">per person</div>
                    </div>
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="w-full"
                    onClick={() => {
                      setSelectedPackage(null);
                      handleBookNow(pkg);
                    }}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Secure Booking - Reserve Now
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    <Shield className="w-4 h-4 inline mr-1" />
                    Secure payment • Free cancellation up to 48 hours • Best price guarantee
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Customer Reviews</h3>
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Reviews will be displayed here once customers start booking this package.</p>
                </div>
              </div>
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
        <div className="max-w-[1600px] mx-auto px-6 py-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Tour Packages</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover amazing travel experiences and manage your bookings
            </p>
            
            {/* Properly Structured Tabs */}
            <Tabs defaultValue="browse" className="w-full max-w-4xl mx-auto">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="browse" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Browse Tour Packages
                </TabsTrigger>
                <TabsTrigger value="bookings" className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  My Bookings
                </TabsTrigger>
              </TabsList>

              {/* Browse Tab Content */}
              <TabsContent value="browse" className="space-y-6">
                <div className="flex justify-center">
                  {permissions.canCreateTourPackages ? (
                    <Button 
                      size="lg" 
                      onClick={() => setIsCreateModalOpen(true)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      List Your Package
                    </Button>
                  ) : user?.role === 'creator' ? (
                    <div className="text-center">
                      <p className="text-muted-foreground mb-2">
                        <strong>Creator users can browse and view all packages</strong>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Contact our team to upgrade to Publisher role for listing packages
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-muted-foreground mb-2">
                        To create tour packages, you need Publisher role
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Current role: {permissions.roleDisplayName}
                      </p>
                    </div>
                  )}
                </div>

                <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                  {/* Search & Filters */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Find Your Perfect Package
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
                            <SelectItem value="8-14">1-2 weeks</SelectItem>
                            <SelectItem value="15+">2+ weeks</SelectItem>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {packages.map((pkg) => (
                      <PackageCard key={pkg.id} package={pkg} />
                    ))}
                  </div>

                  {packages.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No packages found</h3>
                      <p className="text-muted-foreground mb-4">
                        {permissions.canCreateTourPackages 
                          ? "Be the first to create an amazing tour package!" 
                          : "No tour packages available yet. Tour providers will add packages soon!"
                        }
                      </p>
                      {permissions.canCreateTourPackages && (
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Package
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Bookings Tab Content */}
              <TabsContent value="bookings" className="space-y-6">
                {bookingsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading your bookings...</p>
                  </div>
                ) : tourBookings.length === 0 ? (
                  <Card className="max-w-md mx-auto">
                    <CardContent className="pt-6 text-center">
                      <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tour Package Bookings Yet</h3>
                      <p className="text-gray-600 mb-4">You haven't made any tour package bookings yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="container mx-auto px-4 py-8">
                    <div className="grid gap-6">
                      {tourBookings.map((booking: any) => (
                        <Card key={booking.id} className="overflow-hidden">
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-semibold">{booking.package?.title || 'Tour Package'}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{booking.package?.destination || 'Tour Destination'}</span>
                                </div>
                              </div>
                              <Badge className={`${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {booking.status}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <div>
                                  <span className="font-medium">Departure:</span>
                                  <span className="ml-1">{format(parseISO(booking.departureDate), 'MMM dd, yyyy')}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Travelers:</span>
                                <span>{booking.travelers} {booking.travelers === 1 ? 'person' : 'people'}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Duration:</span>
                                <span>{booking.package?.duration || 'N/A'} days</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm mb-4">
                              <DollarSign className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">Total Price:</span>
                              <span className="font-semibold">{booking.currency} {booking.totalPrice}</span>
                            </div>

                            {/* Contact Information */}
                            {booking.contactInfo && (
                              <div className="border-t pt-4 mt-4">
                                <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span>{booking.contactInfo.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span>{booking.contactInfo.email}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span>{booking.contactInfo.phone}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {booking.specialRequests && (
                              <div className="border-t pt-4 mt-4">
                                <h4 className="font-semibold text-gray-900 mb-2">Special Requests</h4>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                  {booking.specialRequests}
                                </p>
                              </div>
                            )}

                            <div className="border-t pt-4 mt-4">
                              <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>Booking ID: {booking.id}</span>
                                <span>Booked on {format(parseISO(booking.createdAt), 'MMM dd, yyyy')}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* All Dialog components as siblings outside Tabs */}
      
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

      {/* Professional Booking Form Modal */}
      <Dialog open={bookingFormOpen} onOpenChange={setBookingFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Book Your Tour Package
            </DialogTitle>
            {currentBookingPackage && (
              <div className="text-muted-foreground">
                <p className="font-medium">{currentBookingPackage.title}</p>
                <p className="text-sm">{currentBookingPackage.destination} • {currentBookingPackage.duration} days</p>
              </div>
            )}
          </DialogHeader>

          <form onSubmit={handleBookingSubmit} className="space-y-6">
            {/* Package Summary with Platform Fee */}
            {currentBookingPackage && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Booking Summary
                </h3>
                <PlatformFeeBreakdown
                  basePrice={currentBookingPackage.price * bookingDetails.travelers}
                  currency={currentBookingPackage.currency}
                  serviceType="trip"
                />
              </div>
            )}

            {/* Travelers & Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="travelers">Number of Travelers *</Label>
                <Select 
                  value={bookingDetails.travelers.toString()} 
                  onValueChange={(value) => setBookingDetails(prev => ({...prev, travelers: parseInt(value)}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: currentBookingPackage?.maxGroupSize || 10}, (_, i) => (
                      <SelectItem key={i+1} value={(i+1).toString()}>
                        {i+1} {i === 0 ? 'Traveler' : 'Travelers'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="departureDate">Preferred Departure Date *</Label>
                <Input
                  type="date"
                  value={bookingDetails.departureDate}
                  onChange={(e) => setBookingDetails(prev => ({...prev, departureDate: e.target.value}))}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactName">Full Name *</Label>
                  <Input
                    id="contactName"
                    value={bookingDetails.contactInfo.name}
                    onChange={(e) => setBookingDetails(prev => ({...prev, contactInfo: {...prev.contactInfo, name: e.target.value}}))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Email Address *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={bookingDetails.contactInfo.email}
                    onChange={(e) => setBookingDetails(prev => ({...prev, contactInfo: {...prev.contactInfo, email: e.target.value}}))}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="contactPhone">Phone Number *</Label>
                <div className="flex gap-2">
                  <div className="w-40">
                    <Select 
                      value={bookingDetails.contactInfo.countryCode} 
                      onValueChange={(value) => setBookingDetails(prev => ({...prev, contactInfo: {...prev.contactInfo, countryCode: value}}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-48">
                        {countryCodes.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.flag} {country.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    className="flex-1"
                    placeholder="Phone number"
                    value={bookingDetails.contactInfo.phone}
                    onChange={(e) => setBookingDetails(prev => ({...prev, contactInfo: {...prev.contactInfo, phone: e.target.value}}))}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  placeholder="Emergency contact name and phone"
                  value={bookingDetails.contactInfo.emergencyContact}
                  onChange={(e) => setBookingDetails(prev => ({...prev, contactInfo: {...prev.contactInfo, emergencyContact: e.target.value}}))}
                />
              </div>
            </div>

            {/* Special Requests */}
            <div>
              <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
              <Textarea
                id="specialRequests"
                placeholder="Any dietary restrictions, accessibility needs, or other special requests..."
                value={bookingDetails.specialRequests}
                onChange={(e) => setBookingDetails(prev => ({...prev, specialRequests: e.target.value}))}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setBookingFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={bookPackageMutation.isPending}>
                {bookPackageMutation.isPending ? "Processing..." : "Confirm Booking"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Booking Confirmation Modal */}
      {isBookingModalOpen && bookingPackage && (
        <BookingConfirmation 
          isOpen={isBookingModalOpen}
          onOpenChange={setIsBookingModalOpen}
          serviceType="tour-package"
          booking={{
            id: 'booking-' + Date.now(),
            packageTitle: bookingPackage.title,
            destination: bookingPackage.destination,
            duration: bookingPackage.duration,
            travelers: bookingDetails.travelers,
            departureDate: bookingDetails.departureDate,
            price: bookingPackage.price,
            currency: bookingPackage.currency,
            contactInfo: bookingDetails.contactInfo
          }}
        />
      )}
    </div>
  );
}