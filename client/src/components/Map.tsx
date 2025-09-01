import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Users, Filter, Search } from "lucide-react";
import type { User } from "@shared/schema";

// Leaflet imports (will be loaded dynamically)
let L: any;

interface MapProps {
  onUserSelect?: (user: User) => void;
  height?: string;
}

export function Map({ onUserSelect, height = "h-96" }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch nearby users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/discover", userLocation?.[0], userLocation?.[1], countryFilter],
    enabled: !!userLocation || !!countryFilter,
  });

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !L) {
        // Load Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          L = (window as any).L;
          initializeMap();
        };
        document.head.appendChild(script);
      } else if (L) {
        initializeMap();
      }
    };

    loadLeaflet();
  }, []);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Geolocation error:", error);
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
    if (!mapRef.current || !L || !userLocation) return;

    // Clear existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Create map with world view
    const map = L.map(mapRef.current, {
      center: userLocation,
      zoom: 3,
      minZoom: 2,
      maxZoom: 18,
      worldCopyJump: true
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Add user location marker
    L.marker(userLocation)
      .addTo(map)
      .bindPopup('Your location')
      .openPopup();

    mapInstanceRef.current = map;
  };

  // Update markers when users data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !users.length || !L) return;

    // Clear existing markers (except user location)
    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.Marker && layer.getPopup()?.getContent() !== 'Your location') {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    // Add user markers with custom icons
    users.forEach((user: User) => {
      if (user.lat && user.lng && user.showOnMap) {
        // Create custom icon based on user plan
        const iconColor = user.plan === 'creator' ? '#f59e0b' : user.plan === 'traveler' ? '#10b981' : '#6b7280';
        const userIcon = L.divIcon({
          html: `<div style="background: ${iconColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          className: 'traveler-marker',
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        
        const marker = L.marker([user.lat, user.lng], { icon: userIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div class="p-3 min-w-[220px]">
              <div class="flex items-center space-x-3 mb-3">
                <img src="${user.profileImageUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'}" 
                     class="w-10 h-10 rounded-full object-cover border-2 border-gray-200" 
                     alt="${user.displayName}" />
                <div>
                  <div class="font-semibold text-gray-900">${user.displayName || user.username}</div>
                  <div class="text-xs text-gray-500">@${user.username}</div>
                </div>
              </div>
              <div class="text-sm mb-2 flex items-center text-gray-700">
                <span class="mr-1">📍</span>
                ${user.city}, ${user.country}
              </div>
              <div class="flex items-center justify-between">
                <div class="text-xs px-2 py-1 rounded-full" style="background: ${iconColor}; color: white;">
                  ${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                </div>
                <div class="text-xs text-gray-400">${user.interests?.slice(0, 2).join(', ') || 'Explorer'}</div>
              </div>
            </div>
          `);

        marker.on('click', () => {
          setSelectedUser(user);
          onUserSelect?.(user);
        });
      }
    });
  }, [users, onUserSelect]);

  return (
    <div className="space-y-4">
      {/* Map Controls */}
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
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-country-filter">
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
                  <Link href={`/users/${selectedUser.username}`}>View Profile</Link>
                </Button>
                <Button size="sm" variant="outline" data-testid="button-connect">
                  Connect
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      {users.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span data-testid="text-users-found">Found {users.length} travelers</span>
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.slice(0, 6).map((user: User) => (
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
