import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Map as MapComponent } from "@/components/Map";
import { UserCard } from "@/components/UserCard";
import { MapPin, Filter, Users, Search, Globe, Maximize2, Minimize2, Settings, Info } from "lucide-react";
import { Link } from "wouter";
import type { User } from "@shared/schema";

export default function Map() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    country: "",
    interests: "",
    plan: "",
    language: ""
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch traveler statistics
  const { data: stats } = useQuery({
    queryKey: ["/api/discover/stats"],
    retry: false,
  });

  const handleUserSelect = (selectedUser: User) => {
    setSelectedUser(selectedUser);
    setIsUserDialogOpen(true);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilters({ country: "", interests: "", plan: "", language: "" });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Full screen map view
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={toggleFullscreen}
              data-testid="button-exit-fullscreen"
            >
              <Minimize2 className="w-4 h-4 mr-2" />
              Exit Fullscreen
            </Button>
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              <Globe className="w-3 h-3 mr-1" />
              Global View
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search travelers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-background/80 backdrop-blur-sm"
                data-testid="input-fullscreen-search"
              />
            </div>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="absolute top-16 right-4 z-10 w-80 bg-background/95 backdrop-blur-sm border" data-testid="card-fullscreen-filters">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={filters.country} onValueChange={(value) => handleFilterChange('country', value)}>
                <SelectTrigger data-testid="select-fullscreen-country">
                  <SelectValue placeholder="Country" />
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

              <Select value={filters.plan} onValueChange={(value) => handleFilterChange('plan', value)}>
                <SelectTrigger data-testid="select-fullscreen-plan">
                  <SelectValue placeholder="Plan Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="traveler">Traveler</SelectItem>
                  <SelectItem value="creator">Creator</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="w-full"
                data-testid="button-clear-fullscreen-filters"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="w-full h-full">
          <MapComponent onUserSelect={handleUserSelect} height="h-full" />
        </div>

        {/* Selected User Dialog */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Traveler Profile</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <UserCard user={selectedUser} detailed={true} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Normal map view
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2" data-testid="heading-map">
              <MapPin className="w-8 h-8 text-accent" />
              <span>World Traveler Map</span>
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-map-subtitle">
              Discover and connect with travelers around the globe
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="flex items-center space-x-1" data-testid="badge-online-travelers">
              <Users className="w-4 h-4 text-green-500" />
              <span>{stats?.onlineCount || '2.1K'} online</span>
            </Badge>
            <Badge variant="outline" data-testid="badge-total-travelers">
              {stats?.totalCount || '50K+'} total travelers
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card data-testid="card-stat-countries">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{stats?.countries || '180+'}</div>
              <div className="text-sm text-muted-foreground">Countries</div>
            </CardContent>
          </Card>
          <Card data-testid="card-stat-cities">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{stats?.cities || '5K+'}</div>
              <div className="text-sm text-muted-foreground">Cities</div>
            </CardContent>
          </Card>
          <Card data-testid="card-stat-connections">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{stats?.connections || '1M+'}</div>
              <div className="text-sm text-muted-foreground">Connections</div>
            </CardContent>
          </Card>
          <Card data-testid="card-stat-active">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground text-green-600">{stats?.activeNow || '150+'}</div>
              <div className="text-sm text-muted-foreground">Active now</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Controls */}
        <Card data-testid="card-map-controls">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search travelers by username, city, or interests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-travelers"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  data-testid="button-toggle-filters-normal"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <Button 
                  variant="outline"
                  onClick={toggleFullscreen}
                  data-testid="button-fullscreen"
                >
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Fullscreen
                </Button>
                <Button variant="outline" asChild data-testid="button-detailed-view">
                  <Link href="/map">
                    <Settings className="w-4 h-4 mr-2" />
                    Detailed View
                  </Link>
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                <Select value={filters.country} onValueChange={(value) => handleFilterChange('country', value)}>
                  <SelectTrigger data-testid="select-normal-country">
                    <SelectValue placeholder="Country" />
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

                <Select value={filters.interests} onValueChange={(value) => handleFilterChange('interests', value)}>
                  <SelectTrigger data-testid="select-normal-interests">
                    <SelectValue placeholder="Interests" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Interests</SelectItem>
                    <SelectItem value="photography">Photography</SelectItem>
                    <SelectItem value="hiking">Hiking</SelectItem>
                    <SelectItem value="food">Food & Culture</SelectItem>
                    <SelectItem value="adventure">Adventure Sports</SelectItem>
                    <SelectItem value="history">History & Museums</SelectItem>
                    <SelectItem value="nightlife">Nightlife</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.plan} onValueChange={(value) => handleFilterChange('plan', value)}>
                  <SelectTrigger data-testid="select-normal-plan">
                    <SelectValue placeholder="Plan Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="traveler">Traveler</SelectItem>
                    <SelectItem value="creator">Creator</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  data-testid="button-clear-normal-filters"
                >
                  Clear All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Map */}
          <div className="lg:col-span-3">
            <Card data-testid="card-main-map">
              <CardContent className="p-0">
                <MapComponent onUserSelect={handleUserSelect} height="h-[600px]" />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected User */}
            {selectedUser ? (
              <UserCard user={selectedUser} detailed={true} />
            ) : (
              <Card data-testid="card-no-selection">
                <CardContent className="p-8 text-center">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold text-foreground mb-2">Select a Traveler</h3>
                  <p className="text-muted-foreground text-sm">
                    Click on any pin on the map to view traveler details and connect with them.
                  </p>
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
                    <div className="w-4 h-4 bg-accent rounded-full border-2 border-background"></div>
                    <span className="text-sm">Free Plan Users</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-background"></div>
                    <span className="text-sm">Traveler Plan Users</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-chart-2 rounded-full border-2 border-background"></div>
                    <span className="text-sm">Creator Plan Users</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
                    <span className="text-sm">Online Now</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border">
                  <h4 className="font-semibold text-sm mb-2">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start" asChild data-testid="button-find-nearby">
                      <Link href="/map">
                        <MapPin className="w-4 h-4 mr-2" />
                        Find Nearby
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start" asChild data-testid="button-browse-travelers">
                      <Link href="/map">
                        <Users className="w-4 h-4 mr-2" />
                        Browse All
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Notice */}
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950" data-testid="card-privacy-notice">
              <CardContent className="p-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 text-sm">
                      Privacy Protected
                    </h4>
                    <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                      Locations are approximate and respect user privacy settings. Only travelers who have enabled map visibility are shown.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* User Details Dialog */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Traveler Profile</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="max-h-[70vh] overflow-y-auto">
                <UserCard user={selectedUser} detailed={true} />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
