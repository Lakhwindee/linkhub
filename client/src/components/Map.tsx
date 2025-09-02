import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Users, Filter, Search, Globe, Navigation, Radar, RadioIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

// Leaflet imports (will be loaded dynamically)
let L: any;

interface MapProps {
  onUserSelect?: (user: User) => void;
  height?: string;
  selectedCountry?: string;
  selectedCity?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
}

interface CountryData {
  code: string;
  name: string;
  lat: number;
  lng: number;
  zoom: number;
}

interface CityData {
  name: string;
  country: string;
  lat: number;
  lng: number;
  zoom: number;
}

const COUNTRIES: CountryData[] = [
  { code: 'GB', name: 'United Kingdom', lat: 54.7, lng: -3.3, zoom: 6 },
  { code: 'US', name: 'United States', lat: 39.8, lng: -98.5, zoom: 4 },
  { code: 'IN', name: 'India', lat: 20.6, lng: 78.9, zoom: 5 },
  { code: 'FR', name: 'France', lat: 46.6, lng: 2.2, zoom: 6 },
  { code: 'DE', name: 'Germany', lat: 51.2, lng: 10.5, zoom: 6 },
  { code: 'JP', name: 'Japan', lat: 36.2, lng: 138.2, zoom: 5 },
  { code: 'KR', name: 'South Korea', lat: 35.9078, lng: 127.7669, zoom: 7 },
  { code: 'AU', name: 'Australia', lat: -25.3, lng: 133.8, zoom: 4 },
  { code: 'ES', name: 'Spain', lat: 40.5, lng: -3.7, zoom: 6 },
  { code: 'IT', name: 'Italy', lat: 41.9, lng: 12.6, zoom: 6 },
  { code: 'BR', name: 'Brazil', lat: -14.2, lng: -51.9, zoom: 4 },
];

const CITIES: Record<string, CityData[]> = {
  GB: [
    { name: 'London', country: 'GB', lat: 51.5074, lng: -0.1278, zoom: 11 },
    { name: 'Manchester', country: 'GB', lat: 53.4808, lng: -2.2426, zoom: 11 },
    { name: 'Birmingham', country: 'GB', lat: 52.4862, lng: -1.8904, zoom: 11 },
    { name: 'Edinburgh', country: 'GB', lat: 55.9533, lng: -3.1883, zoom: 11 },
  ],
  US: [
    { name: 'New York', country: 'US', lat: 40.7128, lng: -74.0060, zoom: 11 },
    { name: 'Los Angeles', country: 'US', lat: 34.0522, lng: -118.2437, zoom: 11 },
    { name: 'Chicago', country: 'US', lat: 41.8781, lng: -87.6298, zoom: 11 },
    { name: 'Miami', country: 'US', lat: 25.7617, lng: -80.1918, zoom: 11 },
  ],
  IN: [
    { name: 'Mumbai', country: 'IN', lat: 19.0760, lng: 72.8777, zoom: 11 },
    { name: 'Delhi', country: 'IN', lat: 28.7041, lng: 77.1025, zoom: 11 },
    { name: 'Bangalore', country: 'IN', lat: 12.9716, lng: 77.5946, zoom: 11 },
    { name: 'Goa', country: 'IN', lat: 15.2993, lng: 74.1240, zoom: 11 },
  ],
  JP: [
    { name: 'Tokyo', country: 'JP', lat: 35.6762, lng: 139.6503, zoom: 11 },
    { name: 'Kyoto', country: 'JP', lat: 35.0116, lng: 135.7681, zoom: 11 },
    { name: 'Osaka', country: 'JP', lat: 34.6937, lng: 135.5023, zoom: 11 },
    { name: 'Hiroshima', country: 'JP', lat: 34.3853, lng: 132.4553, zoom: 11 },
  ],
  KR: [
    { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.9780, zoom: 11 },
    { name: 'Busan', country: 'KR', lat: 35.1796, lng: 129.0756, zoom: 11 },
    { name: 'Incheon', country: 'KR', lat: 37.4563, lng: 126.7052, zoom: 11 },
    { name: 'Daegu', country: 'KR', lat: 35.8714, lng: 128.6014, zoom: 11 },
    { name: 'Jeju', country: 'KR', lat: 33.4996, lng: 126.5312, zoom: 11 },
  ],
};

export function Map({ onUserSelect, height = "h-96", selectedCountry, selectedCity, center, zoom }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [internalSelectedCountry, setInternalSelectedCountry] = useState<string>("");
  const [internalSelectedCity, setInternalSelectedCity] = useState<string>("");
  
  // Use props if provided, otherwise use internal state
  const currentCountry = selectedCountry || internalSelectedCountry;
  const currentCity = selectedCity || internalSelectedCity;
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const [liveLocationEnabled, setLiveLocationEnabled] = useState<boolean>(false);
  const [connectedUsers, setConnectedUsers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Global function for sending connect requests from map popups
  useEffect(() => {
    (window as any).sendConnectRequest = async (userId: string, userName: string) => {
      if (connectingTo) return; // Prevent multiple requests
      
      setConnectingTo(userId);
      try {
        await apiRequest('POST', '/api/connect-requests', {
          toUserId: userId,
          message: `Hi ${userName}! I'd like to connect with you. Let's explore together! 🌍`
        });
        
        toast({
          title: "Connection Request Sent! ✅",
          description: `Your request to connect with ${userName} has been sent successfully.`,
        });
      } catch (error) {
        console.error('Connection request failed:', error);
        toast({
          title: "Connection Failed ❌",
          description: "Please try again or log in to send connection requests.",
          variant: "destructive",
        });
      } finally {
        setConnectingTo(null);
      }
    };

    return () => {
      delete (window as any).sendConnectRequest;
    };
  }, [toast, connectingTo]);

  // Live location sharing functionality
  useEffect(() => {
    let watchId: number | null = null;

    if (liveLocationEnabled && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          
          // Update user location on map
          setUserLocation(newLocation);
          
          // Send location update to connected users (mock implementation)
          if (connectedUsers.size > 0) {
            console.log('Sharing live location with connected users:', Array.from(connectedUsers));
            // In a real app, this would send the location to the server via WebSocket
          }
        },
        (error) => {
          console.error('Location tracking error:', error);
          toast({
            title: "Location Tracking Error",
            description: "Unable to track your live location. Please check your permissions.",
            variant: "destructive",
          });
          setLiveLocationEnabled(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 1000
        }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [liveLocationEnabled, connectedUsers, toast]);

  // Fetch nearby users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/discover", userLocation?.[0], userLocation?.[1], currentCountry],
    enabled: !!userLocation || !!currentCountry,
  });

  // Update map view when center/zoom props change
  useEffect(() => {
    if (mapInstanceRef.current && center && zoom) {
      mapInstanceRef.current.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom]);

  // Fallback: Update map view when country/city props change (for internal controls)
  useEffect(() => {
    if (mapInstanceRef.current && selectedCountry && !center) {
      const country = COUNTRIES.find(c => c.code === selectedCountry);
      if (country) {
        mapInstanceRef.current.setView([country.lat, country.lng], country.zoom);
      }
    }
  }, [selectedCountry, center]);

  useEffect(() => {
    if (mapInstanceRef.current && selectedCity && selectedCountry && !center) {
      const city = CITIES[selectedCountry]?.find(c => c.name === selectedCity);
      if (city) {
        mapInstanceRef.current.setView([city.lat, city.lng], city.zoom);
      }
    }
  }, [selectedCity, selectedCountry, center]);

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !L) {
        try {
          // Check if Leaflet is already loaded
          if ((window as any).L) {
            L = (window as any).L;
            return;
          }

          // Load Leaflet CSS
          const existingLink = document.querySelector('link[href*="leaflet"]');
          if (!existingLink) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
          }

          // Load Leaflet JS
          const existingScript = document.querySelector('script[src*="leaflet"]');
          if (!existingScript) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => {
              L = (window as any).L;
            };
            script.onerror = () => {
              console.error('Failed to load Leaflet');
            };
            document.head.appendChild(script);
          }
        } catch (error) {
          console.error('Error loading Leaflet:', error);
        }
      } else if (L) {
        // L is already loaded, userLocation effect will handle initialization
      }
    };

    loadLeaflet();
  }, []);

  // Initialize map when conditions are met (only once)
  useEffect(() => {
    if (L && mapRef.current && !mapInstanceRef.current) {
      // Small delay to ensure DOM stability
      const timer = setTimeout(() => {
        if (mapRef.current && !mapInstanceRef.current) {
          initializeMap();
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [L]);

  // Get user's location (simplified)
  useEffect(() => {
    if (navigator.geolocation && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn("Geolocation error:", error);
          // Default to London
          setUserLocation([51.5074, -0.1278]);
        }
      );
    } else {
      // Default to London
      setUserLocation([51.5074, -0.1278]);
    }
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !L) {
      return;
    }
    
    // Use userLocation if available, otherwise default to London
    const mapLocation = userLocation || [51.5074, -0.1278];

    // Clear existing map
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (error) {
        // Ignore removal errors
      }
    }

    // Create map with world view
    const map = L.map(mapRef.current, {
      center: mapLocation,
      zoom: 2,
      minZoom: 2,
      maxZoom: 18,
      worldCopyJump: true
    });

    // Add Google-style satellite tiles with fallback
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri, Maxar, Earthstar Geographics',
      maxZoom: 18,
      id: 'satellite'
    });
    
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
      id: 'street'
    });
    
    // Default to satellite for Google Earth-like experience
    satelliteLayer.addTo(map);
    
    // Add layer control for switching between views
    const baseLayers = {
      '🛰️ Satellite': satelliteLayer,
      '🗺️ Street Map': streetLayer
    };
    
    L.control.layers(baseLayers).addTo(map);

    // Add user location marker with custom icon
    const userIcon = L.divIcon({
      html: `<div style="background: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
      className: 'user-location-marker',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    
    L.marker(mapLocation, { icon: userIcon })
      .addTo(map)
      .bindPopup('<div class="text-center"><strong>Your Location</strong><br/><span class="text-xs text-gray-600">Current Position</span></div>');

    mapInstanceRef.current = map;
  };

  // Update markers when users data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !users || !Array.isArray(users) || !users.length || !L) return;

    // Clear existing markers (except user location)
    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.Marker && layer.getPopup()?.getContent() !== 'Your location') {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    // Add user markers with custom icons
    if (Array.isArray(users)) {
      (users as User[]).forEach((user: User) => {
      if (user.lat && user.lng && user.showOnMap) {
        // Create custom icon based on user plan
        const plan = user.plan || 'free';
        const iconColor = plan === 'creator' ? '#f59e0b' : plan === 'traveler' ? '#10b981' : '#6b7280';
        const userIcon = L.divIcon({
          html: `<div style="background: ${iconColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          className: 'traveler-marker',
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        
        const marker = L.marker([user.lat, user.lng], { icon: userIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div class="p-4 min-w-[260px]">
              <div class="flex items-center space-x-3 mb-3">
                <img src="${user.profileImageUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'}" 
                     class="w-12 h-12 rounded-full object-cover border-2 border-gray-200 shadow-sm" 
                     alt="${user.displayName}" />
                <div class="flex-1">
                  <div class="font-semibold text-gray-900 text-sm">${user.displayName || user.username}</div>
                  <div class="text-xs text-gray-500">@${user.username}</div>
                  <div class="text-xs px-2 py-1 rounded-full mt-1 inline-block" style="background: ${iconColor}; color: white;">
                    ${plan.charAt(0).toUpperCase() + plan.slice(1)}
                  </div>
                </div>
              </div>
              <div class="text-sm mb-3 flex items-center text-gray-700">
                <span class="mr-1">📍</span>
                ${user.city}, ${user.country}
              </div>
              <div class="text-xs text-gray-600 mb-3">
                ${user.interests?.slice(0, 2).join(', ') || 'Explorer'}
              </div>
              <button 
                onclick="window.sendConnectRequest('${user.id}', '${user.displayName || user.username}')"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                🤝 Connect Me
              </button>
            </div>
          `);

        marker.on('click', () => {
          setSelectedUser(user);
          onUserSelect?.(user);
        });
      }
    });
    }
  }, [users, onUserSelect]);

  // Loading map if Leaflet isn't ready
  if (!L) {
    return (
      <div className={`${height} w-full bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 border border-border rounded-lg relative overflow-hidden`}>
        {/* Loading State */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">🗺️ Loading Interactive Map</h3>
              <p className="text-sm text-muted-foreground">Preparing Google Earth-style traveler discovery...</p>
              <div className="flex justify-center space-x-4 mt-4">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs">Traveler</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-xs">Creator</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-xs">Free</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mock pins scattered around */}
        <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-2/3 left-1/4 w-4 h-4 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-1/4 right-1/3 w-4 h-4 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '1.5s'}}></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Show search/selection controls only if no external center/zoom control is provided */}
      {!center && (
        <>
          {/* Live Location Controls */}
          <div className="flex items-center justify-between p-4 bg-card border rounded-lg">
              <div className="flex items-center space-x-3">
                <Radar className={`w-5 h-5 ${liveLocationEnabled ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
                <div>
                  <Label htmlFor="live-location" className="text-sm font-medium">Live Location Sharing</Label>
                  <p className="text-xs text-muted-foreground">
                    {liveLocationEnabled ? '📍 Sharing your live location with connected users' : '🔒 Location sharing is disabled'}
                  </p>
                </div>
              </div>
              <Switch
                id="live-location"
                checked={liveLocationEnabled}
                onCheckedChange={setLiveLocationEnabled}
                data-testid="switch-live-location"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by username, city, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-users"
              />
            </div>
            <div className="flex gap-2">
              <Select value={currentCountry} onValueChange={(value) => {
                setInternalSelectedCountry(value);
                setInternalSelectedCity("");
                if (value && value !== "all") {
                  const country = COUNTRIES.find(c => c.code === value);
                  if (country && mapInstanceRef.current) {
                    mapInstanceRef.current.setView([country.lat, country.lng], country.zoom);
                  }
                }
              }}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-country">
                  <Globe className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🌍 All Countries</SelectItem>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {currentCountry && currentCountry !== "all" && CITIES[currentCountry] && (
                <Select value={currentCity} onValueChange={(value) => {
                  setInternalSelectedCity(value);
                  if (value && value !== "all") {
                    const city = CITIES[currentCountry]?.find(c => c.name === value);
                    if (city && mapInstanceRef.current) {
                      mapInstanceRef.current.setView([city.lat, city.lng], city.zoom);
                    }
                  }
                }}>
                  <SelectTrigger className="w-full sm:w-48" data-testid="select-city">
                    <Navigation className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🏙️ All Cities</SelectItem>
                    {CITIES[currentCountry]?.map((city) => (
                      <SelectItem key={city.name} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </>
      )}

      {/* Map Container */}
      <div className={`${height} w-full rounded-xl border border-border overflow-hidden relative`}>
        <div ref={mapRef} className="w-full h-full" data-testid="map-container" />
        
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Selected User Card */}
      {selectedUser && (
        <Card className="border-accent" data-testid="card-selected-user">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={selectedUser.avatarUrl || selectedUser.profileImageUrl || ""} />
                  <AvatarFallback data-testid="text-selected-user-initials">
                    {(selectedUser.displayName || selectedUser.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-card-foreground" data-testid="text-selected-username">
                    {selectedUser.displayName || selectedUser.username}
                  </div>
                  <div className="text-sm text-muted-foreground" data-testid="text-selected-location">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {selectedUser.city}, {selectedUser.country}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" data-testid="badge-user-plan">{selectedUser.plan}</Badge>
                    {selectedUser.interests?.slice(0, 2).map((interest, idx) => (
                      <Badge key={idx} variant="outline" data-testid={`badge-interest-${idx}`}>
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" data-testid="button-view-profile">
                  View Profile
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  data-testid="button-connect"
                  disabled={connectingTo === selectedUser.id}
                  onClick={async () => {
                    if (connectingTo || !selectedUser) return;
                    
                    setConnectingTo(selectedUser.id);
                    try {
                      await apiRequest('POST', '/api/connect-requests', {
                        toUserId: selectedUser.id,
                        message: `Hi ${selectedUser.displayName || selectedUser.username}! I'd like to connect with you. Let's explore together! 🌍`
                      });
                      
                      toast({
                        title: "Connection Request Sent! ✅",
                        description: `Your request to connect with ${selectedUser.displayName || selectedUser.username} has been sent successfully.`,
                      });
                    } catch (error) {
                      console.error('Connection request failed:', error);
                      toast({
                        title: "Connection Failed ❌",
                        description: "Please try again or log in to send connection requests.",
                        variant: "destructive",
                      });
                    } finally {
                      setConnectingTo(null);
                    }
                  }}
                >
                  {connectingTo === selectedUser.id ? "Connecting..." : "🤝 Connect"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      {(users as User[]).length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span data-testid="text-users-found">Found {(users as User[]).length} travelers</span>
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(users as User[]).slice(0, 6).map((user: User) => (
              <Card key={user.id} className="travel-card cursor-pointer" onClick={() => setSelectedUser(user)} data-testid={`card-user-${user.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={user.avatarUrl || user.profileImageUrl || ""} />
                      <AvatarFallback data-testid={`text-user-initials-${user.id}`}>
                        {(user.displayName || user.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-card-foreground" data-testid={`text-username-${user.id}`}>
                        {user.displayName || user.username}
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid={`text-location-${user.id}`}>
                        {user.city}, {user.country}
                      </div>
                      <Badge variant="secondary" className="text-xs" data-testid={`badge-plan-${user.id}`}>
                        {user.plan}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
