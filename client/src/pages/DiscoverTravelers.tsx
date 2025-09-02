import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Globe, Radar, User as UserIcon, MessageCircle, Users, ZoomIn, ZoomOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";

// World geography map URL
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Define available countries and cities
const COUNTRIES = [
  { code: "all", name: "All Countries", lat: 20, lng: 0, zoom: 2 },
  { code: "GB", name: "United Kingdom", lat: 54.7753, lng: -2.3508, zoom: 6 },
  { code: "IN", name: "India", lat: 20.5937, lng: 78.9629, zoom: 5 },
  { code: "US", name: "United States", lat: 39.8283, lng: -98.5795, zoom: 4 },
  { code: "FR", name: "France", lat: 46.6034, lng: 1.8883, zoom: 6 },
  { code: "DE", name: "Germany", lat: 51.1657, lng: 10.4515, zoom: 6 },
  { code: "JP", name: "Japan", lat: 36.2048, lng: 138.2529, zoom: 6 },
  { code: "KR", name: "South Korea", lat: 35.9078, lng: 127.7669, zoom: 7 },
  { code: "AU", name: "Australia", lat: -25.2744, lng: 133.7751, zoom: 5 },
  { code: "CA", name: "Canada", lat: 56.1304, lng: -106.3468, zoom: 4 },
  { code: "IT", name: "Italy", lat: 41.8719, lng: 12.5674, zoom: 6 },
  { code: "ES", name: "Spain", lat: 40.4637, lng: -3.7492, zoom: 6 },
];

const CITIES = {
  "GB": [
    { name: "London", lat: 51.5074, lng: -0.1278, zoom: 10 },
    { name: "Manchester", lat: 53.4808, lng: -2.2426, zoom: 10 },
    { name: "Birmingham", lat: 52.4862, lng: -1.8904, zoom: 10 },
    { name: "Edinburgh", lat: 55.9533, lng: -3.1883, zoom: 10 },
  ],
  "IN": [
    { name: "Mumbai", lat: 19.0760, lng: 72.8777, zoom: 10 },
    { name: "Delhi", lat: 28.7041, lng: 77.1025, zoom: 10 },
    { name: "Bangalore", lat: 12.9716, lng: 77.5946, zoom: 10 },
    { name: "Chennai", lat: 13.0827, lng: 80.2707, zoom: 10 },
  ],
  "KR": [
    { name: "Seoul", lat: 37.5665, lng: 126.9780, zoom: 11 },
    { name: "Busan", lat: 35.1796, lng: 129.0756, zoom: 11 },
    { name: "Incheon", lat: 37.4563, lng: 126.7052, zoom: 11 },
    { name: "Daegu", lat: 35.8714, lng: 128.6014, zoom: 11 },
    { name: "Jeju", lat: 33.4996, lng: 126.5312, zoom: 11 },
  ],
  "US": [
    { name: "New York", lat: 40.7128, lng: -74.0060, zoom: 10 },
    { name: "Los Angeles", lat: 34.0522, lng: -118.2437, zoom: 10 },
    { name: "Chicago", lat: 41.8781, lng: -87.6298, zoom: 10 },
    { name: "San Francisco", lat: 37.7749, lng: -122.4194, zoom: 10 },
  ],
};

export default function DiscoverTravelers() {
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [liveLocationSharing, setLiveLocationSharing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapPosition, setMapPosition] = useState({ coordinates: [0, 0], zoom: 1 });
  const [hoveredCountry, setHoveredCountry] = useState("");
  
  const { toast } = useToast();

  // Fetch users based on location and filters
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/discover"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCountry !== "all") params.append("country", selectedCountry);
      if (selectedCity !== "all") params.append("city", selectedCity);
      if (userLocation) {
        params.append("lat", userLocation[0].toString());
        params.append("lng", userLocation[1].toString());
      }
      
      const response = await fetch(`/api/discover?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: true,
  });

  console.log('Frontend users data:', users.length, users);
  
  // Type users data properly
  const typedUsers = users as any[];

  // Handle zoom controls
  const handleZoomIn = () => {
    setMapPosition(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.5, 8)
    }));
  };

  const handleZoomOut = () => {
    setMapPosition(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.5, 1)
    }));
  };

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation([lat, lng]);
        },
        () => {
          // Default to London if geolocation fails
          setUserLocation([51.5074, -0.1278]);
        }
      );
    }
  }, []);

  // Update map position when country/city changes
  useEffect(() => {
    if (selectedCity !== "all" && selectedCountry !== "all") {
      const city = CITIES[selectedCountry as keyof typeof CITIES]?.find((c: any) => c.name === selectedCity);
      if (city) {
        setMapPosition({ coordinates: [city.lng, city.lat], zoom: 4 });
      }
    } else if (selectedCountry !== "all") {
      const country = COUNTRIES.find(c => c.code === selectedCountry);
      if (country) {
        setMapPosition({ coordinates: [country.lng, country.lat], zoom: 3 });
      }
    } else {
      // Reset to global view
      setMapPosition({ coordinates: [0, 0], zoom: 1 });
    }
  }, [selectedCountry, selectedCity]);

  // Connect request function
  const sendConnectRequest = (userId: string, username: string) => {
    toast({
      title: "Connect Request Sent! 🤝",
      description: `Your connect request has been sent to ${username}. They'll receive a notification.`,
      duration: 3000,
    });
  };

  // Get current cities for selected country
  const currentCities = selectedCountry !== "all" ? CITIES[selectedCountry as keyof typeof CITIES] || [] : [];

  // Reset city when country changes
  useEffect(() => {
    setSelectedCity("all");
  }, [selectedCountry]);

  // Toggle live location sharing
  const toggleLiveLocationSharing = () => {
    setLiveLocationSharing(!liveLocationSharing);
    if (!liveLocationSharing) {
      toast({
        title: "Live Location Enabled! 📍",
        description: "Your location is now visible to other travelers nearby.",
        duration: 3000,
      });
    } else {
      toast({
        title: "Live Location Disabled",
        description: "Your location is no longer shared with other travelers.",
        duration: 3000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            🌍 Discover Travelers
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Find and connect with fellow travelers around the world. Explore, discover, and build meaningful connections.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-48" data-testid="select-country">
              <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(country => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCity} onValueChange={setSelectedCity} disabled={selectedCountry === "all"}>
            <SelectTrigger className="w-48" data-testid="select-city">
              <SelectValue placeholder="Select City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {currentCities.map((city: any) => (
                <SelectItem key={city.name} value={city.name}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Switch
              id="live-location"
              checked={liveLocationSharing}
              onCheckedChange={toggleLiveLocationSharing}
              data-testid="switch-live-location"
            />
            <Label htmlFor="live-location" className="text-sm font-medium">
              📍 Share Live Location
            </Label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Interactive Map */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    World Map
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomIn}
                      data-testid="button-zoom-in"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomOut}
                      data-testid="button-zoom-out"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-80px)]">
                <div 
                  className="w-full h-full rounded-full overflow-hidden border-4 border-blue-200 dark:border-blue-800"
                  style={{
                    width: '600px',
                    height: '600px',
                    margin: '0 auto',
                    background: 'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.1), transparent 70%), linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    boxShadow: '0 0 50px rgba(59, 130, 246, 0.2), inset 0 0 100px rgba(59, 130, 246, 0.1)'
                  }}
                >
                  <ComposableMap
                    projectionConfig={{
                      scale: 147 * mapPosition.zoom,
                      center: mapPosition.coordinates as [number, number]
                    }}
                    width={600}
                    height={600}
                    style={{ width: "100%", height: "100%" }}
                  >
                    <ZoomableGroup zoom={mapPosition.zoom} center={mapPosition.coordinates as [number, number]}>
                      <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                          geographies.map((geo) => (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              onMouseEnter={() => setHoveredCountry(geo.properties.NAME)}
                              onMouseLeave={() => setHoveredCountry("")}
                              style={{
                                default: {
                                  fill: hoveredCountry === geo.properties.NAME ? "#60a5fa" : "#e5e7eb",
                                  outline: "none",
                                  stroke: "#ffffff",
                                  strokeWidth: 0.5
                                },
                                hover: {
                                  fill: "#3b82f6",
                                  outline: "none",
                                  stroke: "#ffffff",
                                  strokeWidth: 0.5
                                },
                                pressed: {
                                  fill: "#1d4ed8",
                                  outline: "none"
                                }
                              }}
                            />
                          ))
                        }
                      </Geographies>
                      
                      {/* User markers */}
                      {typedUsers.map((user: any) => {
                        if (!user.lat || !user.lng || !user.showOnMap) return null;

                        const planColors: {[key: string]: string} = {
                          free: '#9ca3af',
                          traveler: '#22c55e', 
                          creator: '#f97316'
                        };

                        const color = planColors[user.plan] || '#9ca3af';

                        return (
                          <Marker key={user.id} coordinates={[user.lng, user.lat]}>
                            <circle
                              r={6}
                              fill={color}
                              stroke="#ffffff"
                              strokeWidth={2}
                              style={{ cursor: "pointer" }}
                              onClick={() => setSelectedUser(user)}
                            />
                          </Marker>
                        );
                      })}

                      {/* User location marker */}
                      {userLocation && (
                        <Marker coordinates={[userLocation[1], userLocation[0]]}>
                          <circle
                            r={8}
                            fill="#3b82f6"
                            stroke="#ffffff"
                            strokeWidth={3}
                            style={{ cursor: "pointer" }}
                          />
                        </Marker>
                      )}
                    </ZoomableGroup>
                  </ComposableMap>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Travelers List */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radar className="h-5 w-5 text-green-600" />
                  Nearby Travelers ({typedUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto space-y-4">
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Finding travelers...</p>
                  </div>
                ) : typedUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No travelers found in this area</p>
                  </div>
                ) : (
                  typedUsers.map((user: any) => (
                    <Card key={user.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedUser(user)}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.profileImageUrl || `/api/placeholder/48/48`} />
                            <AvatarFallback>{(user.displayName || user.username).charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">{user.displayName || user.username}</h3>
                              <Badge 
                                variant={user.plan === 'creator' ? 'default' : user.plan === 'traveler' ? 'secondary' : 'outline'}
                                className="text-xs"
                              >
                                {user.plan}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {user.city}, {user.country}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {user.interests?.slice(0, 2).join(', ') || 'Explorer'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedUser(null)}>
            <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedUser.profileImageUrl || `/api/placeholder/64/64`} />
                    <AvatarFallback className="text-xl">
                      {(selectedUser.displayName || selectedUser.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{selectedUser.displayName || selectedUser.username}</h3>
                    <p className="text-gray-500 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedUser.city}, {selectedUser.country}
                    </p>
                    <Badge 
                      variant={selectedUser.plan === 'creator' ? 'default' : selectedUser.plan === 'traveler' ? 'secondary' : 'outline'}
                      className="mt-1"
                    >
                      {selectedUser.plan} member
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.interests?.map((interest: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    )) || <span className="text-gray-500">No interests listed</span>}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => sendConnectRequest(selectedUser.id, selectedUser.displayName || selectedUser.username)}
                    data-testid="button-connect"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                  <Button variant="outline" className="flex-1" data-testid="button-message">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}