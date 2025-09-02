import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Pool,
  Heart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddStayDialog } from "@/components/AddStayDialog";
import type { Stay } from "@shared/schema";

// Mock data for demo
const mockStays: Stay[] = [
  {
    id: "stay-1",
    hostId: "test-user-1",
    title: "Beautiful London Apartment",
    description: "Stylish 2-bedroom apartment in the heart of London with amazing city views. Perfect for travelers looking to explore the city.",
    type: "apartment",
    country: "United Kingdom",
    city: "London", 
    address: "123 Baker Street, London",
    lat: 51.5074,
    lng: -0.1278,
    pricePerNight: "85.00",
    currency: "GBP",
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    amenities: ["wifi", "kitchen", "heating", "tv"],
    imageUrls: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=300&fit=crop"],
    houseRules: "No smoking, no pets, quiet hours after 10pm",
    checkInTime: "15:00",
    checkOutTime: "11:00",
    minimumStay: 2,
    maximumStay: 30,
    instantBooking: true,
    contactInfo: "+44 20 1234 5678",
    availableFrom: new Date("2025-01-01"),
    availableTo: new Date("2025-12-31"),
    status: "active",
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "stay-2", 
    hostId: "test-user-2",
    title: "Cozy Barcelona Studio",
    description: "Modern studio apartment near Sagrada Familia. Perfect for solo travelers or couples.",
    type: "studio",
    country: "Spain",
    city: "Barcelona",
    address: "456 Carrer de Mallorca, Barcelona", 
    lat: 41.3851,
    lng: 2.1734,
    pricePerNight: "60.00",
    currency: "EUR",
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ["wifi", "kitchen", "aircon", "balcony"],
    imageUrls: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=300&fit=crop"],
    houseRules: "No smoking, check-in after 3pm",
    checkInTime: "15:00", 
    checkOutTime: "11:00",
    minimumStay: 1,
    maximumStay: null,
    instantBooking: false,
    contactInfo: "+34 93 123 4567",
    availableFrom: new Date("2025-01-01"),
    availableTo: new Date("2025-12-31"),
    status: "active",
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  kitchen: Coffee,
  parking: Car,
  pool: Pool,
  tv: "📺",
  heating: "🔥",
  aircon: "❄️",
  balcony: "🏖️"
};

export default function Stays() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [guests, setGuests] = useState("1");
  const [showAddDialog, setShowAddDialog] = useState(false);

  // For demo, use mock data instead of API call
  const { data: stays = mockStays, isLoading } = useQuery({
    queryKey: ["stays", selectedCountry, selectedType, priceRange, guests],
    queryFn: async () => {
      // TODO: Replace with actual API call when backend is ready
      // const params = new URLSearchParams();
      // if (selectedCountry !== "all") params.append("country", selectedCountry);
      // if (selectedType !== "all") params.append("type", selectedType);
      // if (guests) params.append("guests", guests);
      // const response = await fetch(`/api/stays?${params}`);
      // return response.json();
      
      // Return filtered mock data for now
      return mockStays.filter(stay => {
        if (selectedCountry !== "all" && !stay.country.toLowerCase().includes(selectedCountry.toLowerCase())) {
          return false;
        }
        if (selectedType !== "all" && stay.type !== selectedType) {
          return false;
        }
        if (searchQuery && !stay.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !stay.city.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        return true;
      });
    },
    staleTime: Infinity,
  });

  const handleAddListing = () => {
    setShowAddDialog(true);
  };

  const handleBookStay = (stayId: string) => {
    toast({
      title: "Booking",
      description: "Booking flow will start here",
    });
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
            <h1 className="text-4xl font-bold text-foreground mb-4">Find Your Perfect Stay</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover unique homestays and rooms from locals around the world
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                    <SelectItem value="all">All Countries</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="Spain">Spain</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="Italy">Italy</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="room">Room</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
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
                <Button onClick={handleAddListing} className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add Your Stay</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stays Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {stays.map((stay) => (
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
                  {stay.featured && (
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
                    {stay.amenities?.slice(0, 4).map((amenity) => {
                      const Icon = amenityIcons[amenity];
                      return (
                        <Badge key={amenity} variant="secondary" className="text-xs">
                          {Icon && typeof Icon === 'function' ? <Icon className="w-3 h-3 mr-1" /> : Icon}
                          {amenity}
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
                      <span className="text-lg font-semibold">
                        {stay.currency === "GBP" ? "£" : "€"}{stay.pricePerNight}
                      </span>
                      <span className="text-sm text-muted-foreground"> /night</span>
                    </div>
                    <Button 
                      onClick={() => handleBookStay(stay.id)}
                      className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                    >
                      Book Now
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

        </div>
      </div>
      
      <AddStayDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
      />
    </div>
  );
}