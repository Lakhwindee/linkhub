import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Globe, MapPin, Users, Filter, Search, Maximize2, Minimize2, Settings, Info, Bed } from "lucide-react";
import Globe3D from "@/components/Globe3D";
import { UserCard } from "@/components/UserCard";
import type { User, Stay } from "@shared/schema";

export default function Map() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [liveLocationSharing, setLiveLocationSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStays, setShowStays] = useState(true);
  
  // Fetch travelers data
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/discover"],
    retry: false,
  });

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
  };

  const handleStayClick = (stay: Stay) => {
    console.log('Stay clicked:', stay);
    setSelectedStay(stay);
  };

  // Country options
  const countries = [
    { value: "all", label: "All Countries" },
    { value: "GB", label: "United Kingdom" },
    { value: "US", label: "United States" },
    { value: "IN", label: "India" },
    { value: "FR", label: "France" },
    { value: "DE", label: "Germany" },
    { value: "JP", label: "Japan" },
    { value: "AU", label: "Australia" },
    { value: "CA", label: "Canada" },
    { value: "IT", label: "Italy" },
    { value: "ES", label: "Spain" },
  ];

  // Filter users based on selections
  const filteredUsers = users.filter(user => {
    if (selectedCountry !== "all" && user.country !== selectedCountry) return false;
    if (selectedCity !== "all" && user.city !== selectedCity) return false;
    return true;
  });

  const globeWidth = isFullscreen ? window.innerWidth - 100 : 1200;
  const globeHeight = isFullscreen ? window.innerHeight - 200 : 800;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading world travelers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Globe className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground" data-testid="heading-world-map">
                World Traveler Map
              </h1>
              <p className="text-muted-foreground" data-testid="text-map-subtitle">
                Discover travelers around the world in 3D
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800" data-testid="badge-users-online">
              {filteredUsers.filter(u => u.showOnMap).length} Online
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              data-testid="button-toggle-fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </Button>
          </div>
        </div>

        {/* Controls */}
        <Card data-testid="card-map-controls">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Map Controls</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Country Filter */}
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry} data-testid="select-country">
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City Filter */}
              <div className="space-y-2">
                <Label>City</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity} disabled={selectedCountry === "all"} data-testid="select-city">
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Live Location */}
              <div className="space-y-2">
                <Label>Live Location</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={liveLocationSharing}
                    onCheckedChange={setLiveLocationSharing}
                    data-testid="switch-live-location"
                  />
                  <span className="text-sm text-muted-foreground">
                    {liveLocationSharing ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                <Label>Statistics</Label>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Total Users:</span>
                    <span className="font-medium">{users.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Visible:</span>
                    <span className="font-medium">{filteredUsers.filter(u => u.showOnMap).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-6 gap-6">
          {/* Map */}
          <div className="lg:col-span-5">
            <Card data-testid="card-3d-globe">
              <CardContent className="p-0">
                {isFullscreen ? (
                  <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
                    <div className="relative">
                      <Button
                        className="absolute top-4 right-4 z-10"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFullscreen(false)}
                        data-testid="button-exit-fullscreen"
                      >
                        <Minimize2 className="w-4 h-4 mr-2" />
                        Exit Fullscreen
                      </Button>
                      <Globe3D
                        users={filteredUsers}
                        width={globeWidth}
                        height={globeHeight}
                        onUserClick={handleUserClick}
                        onStayClick={handleStayClick}
                        selectedCountry={selectedCountry}
                        selectedState={selectedCity}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-6 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <Globe3D
                      users={filteredUsers}
                      width={globeWidth}
                      height={globeHeight}
                      onUserClick={handleUserClick}
                      onStayClick={handleStayClick}
                      selectedCountry={selectedCountry}
                      selectedState={selectedCity}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected User */}
            {selectedUser && (
              <Card data-testid="card-selected-user">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-accent" />
                    <span>Selected Traveler</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserCard user={selectedUser} detailed={true} />
                </CardContent>
              </Card>
            )}

            {/* Map Info */}
            <Card data-testid="card-map-info">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="w-5 h-5" />
                  <span>Map Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Creator Members</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Traveler Members</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="text-sm">Free Members</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t space-y-2">
                  <h4 className="font-medium text-sm">How to Use</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Drag to rotate the globe</li>
                    <li>• Scroll to zoom in/out</li>
                    <li>• Click on markers to view profiles</li>
                    <li>• Use filters to find specific travelers</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card data-testid="card-quick-actions">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" data-testid="button-find-nearby">
                  <MapPin className="w-4 h-4 mr-2" />
                  Find Nearby
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="button-connect-travelers">
                  <Users className="w-4 h-4 mr-2" />
                  Connect with Travelers
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="button-share-location">
                  <Search className="w-4 h-4 mr-2" />
                  Share My Location
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}