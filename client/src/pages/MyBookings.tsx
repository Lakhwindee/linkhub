import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  Clock,
  Package,
  Phone,
  Mail,
  User
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface TourPackageBooking {
  id: string;
  packageId: string;
  guestId: string;
  departureDate: string;
  travelers: number;
  totalPrice: string;
  platformFee: string;
  currency: string;
  status: string;
  specialRequests: string | null;
  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Mock tour package data for display
const getTourPackageInfo = (packageId: string) => {
  const packages = {
    "tour-1": {
      title: "Golden Triangle Adventure",
      description: "Explore Delhi, Agra, and Jaipur",
      duration: "7 days",
      image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=500&h=300&fit=crop"
    },
    "tour-2": {
      title: "Kerala Backwaters Experience", 
      description: "Serene houseboat journey through Kerala",
      duration: "5 days",
      image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=500&h=300&fit=crop"
    },
    "tour-3": {
      title: "Rajasthan Royal Heritage",
      description: "Discover the palaces and forts of Rajasthan",
      duration: "10 days", 
      image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=500&h=300&fit=crop"
    }
  };
  return packages[packageId as keyof typeof packages] || {
    title: "Tour Package",
    description: "Adventure awaits",
    duration: "Multiple days",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=500&h=300&fit=crop"
  };
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'completed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function MyBookings() {
  const { user } = useAuth();

  const { data: bookings = [], isLoading, error } = useQuery({
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
        throw new Error('Failed to fetch bookings');
      }
      return response.json() as Promise<TourPackageBooking[]>;
    },
    enabled: !!user?.id
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Bookings</h3>
            <p className="text-gray-600">We couldn't load your bookings. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">Track and manage your tour package reservations</p>
      </div>

      {bookings.length === 0 ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
            <p className="text-gray-600 mb-4">You haven't made any tour package bookings yet.</p>
            <Link href="/tour-packages">
              <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
                Browse Tour Packages
              </span>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => {
            const packageInfo = getTourPackageInfo(booking.packageId);
            
            return (
              <Card key={booking.id} className="overflow-hidden">
                <div className="md:flex">
                  <div className="md:w-1/3">
                    <img 
                      src={packageInfo.image} 
                      alt={packageInfo.title}
                      className="w-full h-48 md:h-full object-cover"
                    />
                  </div>
                  <div className="md:w-2/3 p-6">
                    <CardHeader className="p-0 pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {packageInfo.title}
                        </CardTitle>
                        <Badge className={`${getStatusColor(booking.status)} font-medium`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-gray-600">{packageInfo.description}</p>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Departure:</span>
                          <span>{format(parseISO(booking.departureDate), 'MMM dd, yyyy')}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Travelers:</span>
                          <span>{booking.travelers} {booking.travelers === 1 ? 'person' : 'people'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Total Price:</span>
                          <span className="font-semibold">${booking.totalPrice} {booking.currency}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Duration:</span>
                          <span>{packageInfo.duration}</span>
                        </div>
                      </div>

                      {/* Contact Information */}
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

                      {/* Special Requests */}
                      {booking.specialRequests && (
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Special Requests</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                            {booking.specialRequests}
                          </p>
                        </div>
                      )}

                      {/* Booking Details */}
                      <div className="border-t pt-4 mt-4">
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>Booking ID: {booking.id}</span>
                          <span>Booked on {format(parseISO(booking.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}