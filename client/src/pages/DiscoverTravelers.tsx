import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Globe, Radar, User as UserIcon, MessageCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import Globe3D from "@/components/Globe3D";

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

// Leaflet global variable
let L: any = null;

export default function DiscoverTravelers() {
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [liveLocationSharing, setLiveLocationSharing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [currentLayer, setCurrentLayer] = useState<"satellite" | "streets">("satellite");
  
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  
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

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !L) {
        try {
          // Check if already loaded
          if ((window as any).L) {
            L = (window as any).L;
            return;
          }

          // Load CSS
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(cssLink);

          // Load JS
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => {
            L = (window as any).L;
          };
          document.head.appendChild(script);
        } catch (error) {
          console.error('Error loading Leaflet:', error);
        }
      }
    };
    loadLeaflet();
  }, []);

  // Initialize map
  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current || !L) return;

    // Create map with zoom limits and globe-like appearance
    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: true,
      scrollWheelZoom: true,
      worldCopyJump: true,
      maxBounds: [[-85, -180], [85, 180]],
    });
    
    // Add globe-like styling
    if (mapRef.current) {
      mapRef.current.style.borderRadius = '50%';
      mapRef.current.style.overflow = 'hidden';
      mapRef.current.style.boxShadow = '0 0 50px rgba(0,0,0,0.3), inset 0 0 100px rgba(0,0,0,0.1)';
      mapRef.current.style.border = '3px solid rgba(255,255,255,0.1)';
      mapRef.current.style.background = 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent 50%), linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)';
    }

    // Default satellite layer
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri',
      minZoom: 2,
      maxZoom: 18,
    });

    // Street map layer with labels
    const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      minZoom: 2,
      maxZoom: 18,
    });

    // Satellite with labels overlay
    const labels = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri',
      minZoom: 2,
      maxZoom: 18,
      opacity: 0.8
    });

    // Add default layers (satellite + labels)
    satellite.addTo(map);
    labels.addTo(map);

    // Layer control
    const baseLayers = {
      'Satellite': satellite,
      'Streets': streets,
    };
    
    const overlayLayers = {
      'Country/City Names': labels
    };
    
    L.control.layers(baseLayers, overlayLayers).addTo(map);

    mapInstanceRef.current = map;

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation([lat, lng]);
          
          // Add user location marker
          const userIcon = L.divIcon({
            html: '<div style="background: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
            iconSize: [16, 16],
            className: 'user-location-marker'
          });
          
          L.marker([lat, lng], { icon: userIcon })
            .addTo(map)
            .bindPopup('📍 Your Location')
            .openPopup();
        },
        () => {
          // Default to London if geolocation fails
          setUserLocation([51.5074, -0.1278]);
        }
      );
    }
  };

  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (L && mapRef.current && !mapInstanceRef.current) {
      const timer = setTimeout(initializeMap, 100);
      return () => clearTimeout(timer);
    }
  }, [L]);

  // Update map view when country/city changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (selectedCity !== "all" && selectedCountry !== "all") {
      const city = CITIES[selectedCountry as keyof typeof CITIES]?.find((c: any) => c.name === selectedCity);
      if (city) {
        mapInstanceRef.current.setView([city.lat, city.lng], city.zoom);
      }
    } else if (selectedCountry !== "all") {
      const country = COUNTRIES.find(c => c.code === selectedCountry);
      if (country) {
        mapInstanceRef.current.setView([country.lat, country.lng], country.zoom);
      }
    }
  }, [selectedCountry, selectedCity]);

  // Update markers when users data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !typedUsers.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add user markers
    typedUsers.forEach((user: any) => {
      if (!user.lat || !user.lng || !user.showOnMap) return;

      const planColors: {[key: string]: string} = {
        free: '#9ca3af',
        traveler: '#22c55e', 
        creator: '#f97316'
      };

      const color = planColors[user.plan] || '#9ca3af';
      
      const userIcon = L.divIcon({
        html: `<div style="background: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); cursor: pointer;"></div>`,
        iconSize: [20, 20],
        className: 'user-marker'
      });

      const marker = L.marker([user.lat, user.lng], { icon: userIcon })
        .addTo(mapInstanceRef.current);

      const popupContent = `
        <div style="min-width: 200px; padding: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <img src="${user.profileImageUrl || '/api/placeholder/40/40'}" 
                 style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />
            <div>
              <div style="font-weight: 600; font-size: 14px;">${user.displayName || user.username}</div>
              <div style="font-size: 12px; color: #666;">📍 ${user.city}, ${user.country}</div>
            </div>
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
            ${user.interests?.slice(0, 2).join(', ') || 'Explorer'}
          </div>
          <button onclick="sendConnectRequest('${user.id}', '${user.displayName || user.username}')" 
                  style="width: 100%; background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">
            🤝 Connect Me
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
    });
  }, [typedUsers]);

  // Connect request function (global for popup buttons)
  useEffect(() => {
    (window as any).sendConnectRequest = (userId: string, userName: string) => {
      toast({
        title: "Connection Request Sent!",
        description: `Your request to connect with ${userName} has been sent.`,
      });
      console.log(`Connect request sent to ${userId}`);
    };
  }, [toast]);

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setSelectedCity("all");
  };

  const getCitiesForCountry = () => {
    if (selectedCountry === "all") return [];
    return CITIES[selectedCountry as keyof typeof CITIES] || [];
  };

  if (!L) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">🗺️ Loading Discovery Map</h3>
            <p className="text-sm text-muted-foreground">Preparing Google Earth-style traveler discovery...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar with Controls */}
      <div className="w-80 bg-card border-r border-border p-4 space-y-4 overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
            <Globe className="w-6 h-6 text-blue-500" />
            Discover Travelers
          </h1>
          <p className="text-xs text-muted-foreground">Find and connect with travelers worldwide</p>
        </div>

        {/* Location Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Country</Label>
              <Select value={selectedCountry} onValueChange={handleCountryChange}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs">City</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity} disabled={selectedCountry === "all"}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="all">All Cities</SelectItem>
                  {getCitiesForCountry().map((city: any) => (
                    <SelectItem key={city.name} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Live Sharing */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Radar className="w-4 h-4" />
              Live Sharing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="live-location"
                checked={liveLocationSharing}
                onCheckedChange={setLiveLocationSharing}
              />
              <Label htmlFor="live-location" className="text-xs">
                Share Live Location
              </Label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {liveLocationSharing ? "📍 Sharing with connected users" : "🔒 Location sharing disabled"}
            </p>
          </CardContent>
        </Card>

        {/* Travelers Found */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Travelers Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{users.length}</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Travelers
                  </span>
                  <span>{users.filter((u: any) => u.plan === 'traveler').length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Creators
                  </span>
                  <span>{users.filter((u: any) => u.plan === 'creator').length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Countries</span>
                <Badge variant="secondary">{COUNTRIES.length - 1}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Cities</span>
                <Badge variant="secondary">
                  {Object.values(CITIES).reduce((acc, cities) => acc + cities.length, 0)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Online</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {Math.floor(users.length * 0.7)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Full Screen Map Area */}
      <div className="flex-1 relative bg-background overflow-hidden">
        <div 
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }}
        >
          <Globe3D 
            users={typedUsers} 
            width={1200} 
            height={1200}
            userLocation={userLocation}
          />
        </div>
      </div>

      {/* Selected User Details - Hidden for now */}
      <div className="hidden">
        {selectedUser && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Selected Traveler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedUser?.profileImageUrl || undefined} />
                  <AvatarFallback>{selectedUser?.displayName?.[0] || selectedUser?.username?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedUser?.displayName || selectedUser?.username}</h3>
                  <p className="text-sm text-muted-foreground">📍 {selectedUser?.city}, {selectedUser?.country}</p>
                  <div className="flex gap-2 mt-2">
                    {selectedUser?.interests?.map((interest) => (
                      <Badge key={interest} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">
                    <UserIcon className="w-4 h-4 mr-1" />
                    View Profile
                  </Button>
                  <Button size="sm">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Connect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}