import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  MapPin, 
  Users, 
  Star, 
  Plus, 
  Search, 
  Filter,
  Bed,
  Bath,
  Wifi,
  Car,
  Coffee,
  Waves,
  Heart,
  History,
  Calendar,
  DollarSign,
  Clock,
  Package,
  Phone,
  Mail,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddStayDialog } from "@/components/AddStayDialog";
import { BookingModal } from "@/components/BookingModal";
import type { Stay } from "@shared/schema";
import { worldCountries } from "@/data/locationData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO } from "date-fns";

// Mock data removed - using real data only
const mockStays: Stay[] = [];

const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  kitchen: Coffee,
  parking: Car,
  pool: Waves,
  tv: "📺",
  heating: "🔥",
  aircon: "❄️",
  balcony: "🏖️"
};

export default function Stays() {
  const { toast } = useToast();
  const { user } = useAuth();
  const permissions = usePermissions(user);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [guests, setGuests] = useState("1");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Publisher sees only their own stays, others see all stays
  const apiEndpoint = user?.role === 'publisher' ? "/api/my-stays" : "/api/stays";
  const { data: stays = [], isLoading } = useQuery({
    queryKey: [apiEndpoint, selectedCountry, selectedType, priceRange, guests, searchQuery],
    queryFn: async () => {
      // Use actual API call for publishers to show their own stays
      if (user?.role === 'publisher') {
        const response = await fetch("/api/my-stays", {
          credentials: "include"
        });
        if (!response.ok) {
          // Fallback to empty array if API fails
          return [];
        }
        return response.json();
      }
      
      // For other users, use mock data with filters for now
      return mockStays.filter(stay => {
        if (selectedCountry !== "all" && !stay.country.toLowerCase().includes(selectedCountry.toLowerCase())) {
          return false;
        }
        if (selectedType !== "all" && stay.type !== selectedType) {
          return false;
        }
        if (priceRange !== "all") {
          if (priceRange === "free" && stay.pricePerNight !== null) {
            return false;
          }
          if (priceRange === "budget" && (stay.pricePerNight === null || parseFloat(stay.pricePerNight) >= 50)) {
            return false;
          }
          if (priceRange === "mid" && (stay.pricePerNight === null || parseFloat(stay.pricePerNight) < 50 || parseFloat(stay.pricePerNight) > 100)) {
            return false;
          }
          if (priceRange === "luxury" && (stay.pricePerNight === null || parseFloat(stay.pricePerNight) <= 100)) {
            return false;
          }
        }
        if (searchQuery && !stay.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !stay.city.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        return true;
      }).sort((a, b) => {
        // Sort free stays to the top
        if (a.pricePerNight === null && b.pricePerNight !== null) return -1;
        if (a.pricePerNight !== null && b.pricePerNight === null) return 1;
        return 0;
      });
    },
    staleTime: Infinity,
  });

  // Stays bookings query
  const { data: stayBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['my-bookings', 'stays', user?.id],
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
      
      const response = await fetch('/api/my-bookings/stays', {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch stay bookings');
      }
      return response.json();
    },
    enabled: !!user?.id
  });

  const handleAddListing = () => {
    setShowAddDialog(true);
  };

  const handleBookStay = (stayId: string) => {
    const stay = stays.find((s: Stay) => s.id === stayId);
    if (stay) {
      setSelectedStay(stay);
      setIsBookingOpen(true);
    }
  };

  const handleBookingSuccess = (bookingId: string) => {
    toast({
      title: "Booking Confirmed!",
      description: "Your stay has been booked successfully.",
    });
    // Refresh bookings data
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading stays...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950">
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex-1"></div>
              <h1 className="text-4xl font-bold text-foreground flex-1">Stays</h1>
              <div className="flex-1 flex justify-end">
                {permissions.canCreateStays && (
                  <Button 
                    onClick={handleAddListing}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    List Your Property
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover unique homestays and manage your bookings
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="browse" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Browse Stays
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                My Bookings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-6">
              {/* Search and Filters */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by city or title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🌍 All Countries</SelectItem>
                    
                    {/* Real-world countries (250+ with flags) */}
                    {worldCountries.map((country) => (
                      <SelectItem key={country.name} value={country.name}>
                        {country.flag} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🏠 All Types</SelectItem>
                    
                    {/* Room Categories */}
                    <SelectItem value="guest-room">🏠 Guest Room (in Home)</SelectItem>
                    <SelectItem value="private-room">🚪 Private Room</SelectItem>
                    <SelectItem value="shared-room">👥 Shared Room</SelectItem>
                    <SelectItem value="hostel-bed">🛏️ Hostel Bed</SelectItem>
                    
                    {/* Entire Places */}
                    <SelectItem value="studio">🏢 Studio Apartment</SelectItem>
                    <SelectItem value="apartment">🏠 Entire Apartment</SelectItem>
                    <SelectItem value="house">🏘️ Entire House</SelectItem>
                    <SelectItem value="villa">🏖️ Villa</SelectItem>
                    <SelectItem value="cottage">🏡 Cottage</SelectItem>
                    <SelectItem value="loft">🏭 Loft</SelectItem>
                    <SelectItem value="townhouse">🏘️ Townhouse</SelectItem>
                    <SelectItem value="penthouse">🏢 Penthouse</SelectItem>
                    
                    {/* Unique Stays */}
                    <SelectItem value="tiny-house">🏘️ Tiny House</SelectItem>
                    <SelectItem value="cabin">🏕️ Cabin</SelectItem>
                    <SelectItem value="boat">🚤 Boat/Yacht</SelectItem>
                    <SelectItem value="treehouse">🌳 Treehouse</SelectItem>
                    <SelectItem value="castle">🏰 Castle</SelectItem>
                    <SelectItem value="farmhouse">🚜 Farmhouse</SelectItem>
                    <SelectItem value="beachhouse">🏖️ Beach House</SelectItem>
                    
                    {/* Hostels & Budget */}
                    <SelectItem value="hostel">🏨 Hostel</SelectItem>
                    <SelectItem value="guesthouse">🏡 Guesthouse</SelectItem>
                    <SelectItem value="b&b">🛏️ Bed & Breakfast</SelectItem>
                    <SelectItem value="homestay">👨‍👩‍👧‍👦 Traditional Homestay</SelectItem>
                    
                    {/* Luxury */}
                    <SelectItem value="resort">🌴 Resort</SelectItem>
                    <SelectItem value="boutique-hotel">✨ Boutique Hotel</SelectItem>
                    <SelectItem value="luxury-suite">💎 Luxury Suite</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="free" className="text-green-600 font-semibold">
                      💝 Free Stays Only
                    </SelectItem>
                    <SelectItem value="budget">Under £50</SelectItem>
                    <SelectItem value="mid">£50 - £100</SelectItem>
                    <SelectItem value="luxury">£100+</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={guests} onValueChange={setGuests}>
                  <SelectTrigger>
                    <SelectValue placeholder="Guests" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Guest</SelectItem>
                    <SelectItem value="2">2 Guests</SelectItem>
                    <SelectItem value="3">3 Guests</SelectItem>
                    <SelectItem value="4">4 Guests</SelectItem>
                    <SelectItem value="5">5+ Guests</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm text-muted-foreground">
                    {stays.length} stays found
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stays Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {stays.map((stay: Stay) => (
              <Card key={stay.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img 
                    src={stay.imageUrls?.[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&h=300&fit=crop"}
                    alt={stay.title}
                    className="w-full h-48 object-cover"
                  />
                  <button className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white">
                    <Heart className="w-4 h-4" />
                  </button>
                  {stay.pricePerNight === null && (
                    <Badge className="absolute top-3 left-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse">
                      💝 FREE STAY!
                    </Badge>
                  )}
                  {stay.featured && stay.pricePerNight !== null && (
                    <Badge className="absolute top-3 left-3 bg-yellow-500">Featured</Badge>
                  )}
                </div>
                
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg line-clamp-1">{stay.title}</h3>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">4.8</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{stay.city}, {stay.country}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {stay.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 mb-3 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{stay.maxGuests} guests</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Bed className="w-4 h-4" />
                      <span>{stay.bedrooms} bed</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Bath className="w-4 h-4" />
                      <span>{stay.bathrooms} bath</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {stay.amenities?.slice(0, 4).map((amenity: string) => {
                      const IconComponent = amenityIcons[amenity];
                      return (
                        <Badge key={amenity} variant="secondary" className="text-xs flex items-center">
                          {IconComponent && typeof IconComponent === 'function' && (
                            <IconComponent className="w-3 h-3 mr-1" />
                          )}
                          {typeof IconComponent === 'string' && (
                            <span className="mr-1">{IconComponent}</span>
                          )}
                          <span>{amenity}</span>
                        </Badge>
                      );
                    })}
                    {(stay.amenities?.length || 0) > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{(stay.amenities?.length || 0) - 4} more
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      {stay.pricePerNight === null ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                            FREE! 🎉
                          </span>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Host's Gift
                          </Badge>
                        </div>
                      ) : (
                        <>
                          <span className="text-lg font-semibold">
                            {stay.currency === "GBP" ? "£" : "€"}{stay.pricePerNight}
                          </span>
                          <span className="text-sm text-muted-foreground"> /night</span>
                        </>
                      )}
                    </div>
                    <Button 
                      onClick={() => handleBookStay(stay.id)}
                      className={stay.pricePerNight === null 
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" 
                        : "bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                      }
                    >
                      {stay.pricePerNight === null ? "💝 Request Stay" : "Book Now"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {stays.length === 0 && (
            <div className="text-center py-12">
              <Home className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No stays found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
            </div>
          )}
            </TabsContent>

            <TabsContent value="bookings" className="space-y-6">
              {bookingsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading your bookings...</p>
                </div>
              ) : stayBookings.length === 0 ? (
                <Card className="max-w-md mx-auto">
                  <CardContent className="pt-6 text-center">
                    <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stay Bookings Yet</h3>
                    <p className="text-gray-600 mb-4">You haven't made any stay bookings yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {stayBookings.map((booking: any) => (
                    <Card key={booking.id} className="overflow-hidden">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{booking.stay?.title || 'Stay Booking'}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <MapPin className="w-4 h-4" />
                              <span>{booking.stay?.city}, {booking.stay?.country}</span>
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
                              <span className="font-medium">Check-in:</span>
                              <span className="ml-1">{format(parseISO(booking.checkInDate), 'MMM dd, yyyy')}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <div>
                              <span className="font-medium">Check-out:</span>
                              <span className="ml-1">{format(parseISO(booking.checkOutDate), 'MMM dd, yyyy')}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Guests:</span>
                            <span>{booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm mb-4">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Total Price:</span>
                          <span className="font-semibold">{booking.currency} {booking.totalPrice}</span>
                        </div>

                        {booking.message && (
                          <div className="border-t pt-4 mt-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Message to Host</h4>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                              {booking.message}
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
              )}
            </TabsContent>
          </Tabs>

        </div>
      </div>
      
      <AddStayDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
      />
      
      <BookingModal 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        stay={selectedStay}
        onSuccess={handleBookingSuccess}
      />
    </div>
  );
}