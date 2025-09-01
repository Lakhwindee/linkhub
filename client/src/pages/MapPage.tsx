import { useState } from "react";
import { Map } from "@/components/Map";
import { UserCard } from "@/components/UserCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Filter, Users, Search } from "lucide-react";
import type { User } from "@shared/schema";

export default function MapPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    country: "",
    interests: "",
    plan: "",
    language: ""
  });

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2" data-testid="heading-discover">
              <MapPin className="w-8 h-8 text-accent" />
              <span>Discover Travelers</span>
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-discover-subtitle">
              Find and connect with travelers around the world
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center space-x-1" data-testid="badge-total-travelers">
            <Users className="w-4 h-4" />
            <span>50K+ Active Travelers</span>
          </Badge>
        </div>

        {/* Search and Filters */}
        <Card data-testid="card-search-filters">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Search & Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search travelers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-travelers"
                />
              </div>
              
              <Select value={filters.country} onValueChange={(value) => handleFilterChange('country', value)}>
                <SelectTrigger data-testid="select-country">
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
                <SelectTrigger data-testid="select-interests">
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
                  <SelectItem value="backpacking">Backpacking</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.plan} onValueChange={(value) => handleFilterChange('plan', value)}>
                <SelectTrigger data-testid="select-plan">
                  <SelectValue placeholder="Plan Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="traveler">Traveler</SelectItem>
                  <SelectItem value="creator">Creator</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.language} onValueChange={(value) => handleFilterChange('language', value)}>
                <SelectTrigger data-testid="select-language">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                  <SelectItem value="german">German</SelectItem>
                  <SelectItem value="italian">Italian</SelectItem>
                  <SelectItem value="portuguese">Portuguese</SelectItem>
                  <SelectItem value="hindi">Hindi</SelectItem>
                  <SelectItem value="mandarin">Mandarin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchQuery || Object.values(filters).some(Boolean)) && (
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <Badge variant="secondary" data-testid="badge-search-query">
                      Search: {searchQuery}
                    </Badge>
                  )}
                  {Object.entries(filters).map(([key, value]) => value && (
                    <Badge key={key} variant="secondary" data-testid={`badge-filter-${key}`}>
                      {key}: {value}
                    </Badge>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setFilters({ country: "", interests: "", plan: "", language: "" });
                  }}
                  data-testid="button-clear-filters"
                >
                  Clear All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card data-testid="card-map">
              <CardContent className="p-0">
                <Map onUserSelect={handleUserSelect} height="h-[600px]" />
              </CardContent>
            </Card>
          </div>

          {/* User Details */}
          <div className="space-y-6">
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

            {/* Map Legend */}
            <Card data-testid="card-map-legend">
              <CardHeader>
                <CardTitle className="text-lg">Map Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                  <span className="text-sm">Online Now</span>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Notice */}
            <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950" data-testid="card-privacy-notice">
              <CardContent className="p-4">
                <div className="flex items-start space-x-2">
                  <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 text-sm">
                      Privacy Protected
                    </h4>
                    <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                      Location data is approximate and respects user privacy settings. Only travelers who have enabled map visibility are shown.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
