import { useState } from "react";
import { Map } from "@/components/Map";
import { UserCard } from "@/components/UserCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MapPin, Filter, Users, Search, Shield, Navigation } from "lucide-react";
import type { User } from "@shared/schema";

export default function MapPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [liveLocationSharing, setLiveLocationSharing] = useState(false);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  const countries = [
    { value: "all", label: "Select Country" },
    { value: "GB", label: "United Kingdom" },
    { value: "IN", label: "India" },
    { value: "US", label: "United States" },
    { value: "FR", label: "France" },
    { value: "DE", label: "Germany" },
    { value: "JP", label: "Japan" },
    { value: "AU", label: "Australia" },
    { value: "CA", label: "Canada" },
    { value: "IT", label: "Italy" },
    { value: "ES", label: "Spain" },
  ];

  const cities = {
    "GB": ["London", "Manchester", "Edinburgh", "Birmingham", "Bristol"],
    "IN": ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Pune"],
    "US": ["New York", "Los Angeles", "Chicago", "Miami", "San Francisco"],
    "FR": ["Paris", "Lyon", "Marseille", "Nice", "Toulouse"],
    "DE": ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"],
    "JP": ["Tokyo", "Osaka", "Kyoto", "Hiroshima", "Nagoya"],
    "AU": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
    "CA": ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
    "IT": ["Rome", "Milan", "Florence", "Venice", "Naples"],
    "ES": ["Madrid", "Barcelona", "Seville", "Valencia", "Bilbao"],
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with location controls */}
      <div className="bg-background border-b border-border p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-6 h-6 text-green-600" />
              <h1 className="text-2xl font-bold text-foreground" data-testid="heading-discover">
                Discover Travelers
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Live Location Sharing</span>
                <Switch 
                  checked={liveLocationSharing}
                  onCheckedChange={setLiveLocationSharing}
                  data-testid="switch-live-location"
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {liveLocationSharing ? "Location sharing is enabled" : "Location sharing is disabled"}
              </span>
            </div>
          </div>

          {/* Location Selection Row */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by username, city, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
                data-testid="input-search-travelers"
              />
            </div>
            
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-full md:w-48 bg-background" data-testid="select-country">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCountry && (
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full md:w-48 bg-background" data-testid="select-city">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities[selectedCountry as keyof typeof cities]?.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Map */}
      <div className="relative h-[calc(100vh-120px)]">
        <Map 
          onUserSelect={handleUserSelect} 
          height="h-full"
          selectedCountry={selectedCountry}
          selectedCity={selectedCity}
        />
        
        {/* Explore Full Map Button */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <Button 
            className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 text-lg shadow-lg"
            data-testid="button-explore-full-map"
          >
            Explore Full Map
          </Button>
        </div>

        {/* User Details Overlay */}
        {selectedUser && (
          <div className="absolute top-4 right-4 w-80">
            <UserCard user={selectedUser} detailed={true} />
          </div>
        )}
      </div>
    </div>
  );
}
