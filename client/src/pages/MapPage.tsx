import { useState } from "react";
import { Map } from "@/components/Map";
import { UserCard } from "@/components/UserCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Globe } from "lucide-react";
import type { User } from "@shared/schema";

export default function MapPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [liveLocationSharing, setLiveLocationSharing] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [mapCenter, setMapCenter] = useState({ lat: 51.5074, lng: -0.1278 }); // Default to London
  const [mapZoom, setMapZoom] = useState(6);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  // Countries with their coordinates for map centering
  const countries = [
    { value: "all", label: "Select Country", lat: 20, lng: 0, zoom: 2 },
    { value: "GB", label: "United Kingdom", lat: 54.7753, lng: -2.3508, zoom: 6 },
    { value: "IN", label: "India", lat: 20.5937, lng: 78.9629, zoom: 5 },
    { value: "US", label: "United States", lat: 39.8283, lng: -98.5795, zoom: 4 },
    { value: "FR", label: "France", lat: 46.6034, lng: 1.8883, zoom: 6 },
    { value: "DE", label: "Germany", lat: 51.1657, lng: 10.4515, zoom: 6 },
    { value: "JP", label: "Japan", lat: 36.2048, lng: 138.2529, zoom: 6 },
    { value: "AU", label: "Australia", lat: -25.2744, lng: 133.7751, zoom: 5 },
    { value: "CA", label: "Canada", lat: 56.1304, lng: -106.3468, zoom: 4 },
    { value: "IT", label: "Italy", lat: 41.8719, lng: 12.5674, zoom: 6 },
    { value: "ES", label: "Spain", lat: 40.4637, lng: -3.7492, zoom: 6 },
  ];

  // Cities with their coordinates
  const cities = {
    "GB": [
      { value: "all", label: "All Cities", lat: 54.7753, lng: -2.3508, zoom: 6 },
      { value: "London", label: "London", lat: 51.5074, lng: -0.1278, zoom: 10 },
      { value: "Manchester", label: "Manchester", lat: 53.4808, lng: -2.2426, zoom: 10 },
      { value: "Edinburgh", label: "Edinburgh", lat: 55.9533, lng: -3.1883, zoom: 10 },
      { value: "Birmingham", label: "Birmingham", lat: 52.4862, lng: -1.8904, zoom: 10 },
      { value: "Bristol", label: "Bristol", lat: 51.4545, lng: -2.5879, zoom: 10 },
    ],
    "IN": [
      { value: "all", label: "All Cities", lat: 20.5937, lng: 78.9629, zoom: 5 },
      { value: "Mumbai", label: "Mumbai", lat: 19.0760, lng: 72.8777, zoom: 10 },
      { value: "Delhi", label: "Delhi", lat: 28.7041, lng: 77.1025, zoom: 10 },
      { value: "Bangalore", label: "Bangalore", lat: 12.9716, lng: 77.5946, zoom: 10 },
      { value: "Chennai", label: "Chennai", lat: 13.0827, lng: 80.2707, zoom: 10 },
      { value: "Kolkata", label: "Kolkata", lat: 22.5726, lng: 88.3639, zoom: 10 },
    ],
    "US": [
      { value: "all", label: "All Cities", lat: 39.8283, lng: -98.5795, zoom: 4 },
      { value: "New York", label: "New York", lat: 40.7128, lng: -74.0060, zoom: 10 },
      { value: "Los Angeles", label: "Los Angeles", lat: 34.0522, lng: -118.2437, zoom: 10 },
      { value: "Chicago", label: "Chicago", lat: 41.8781, lng: -87.6298, zoom: 10 },
      { value: "Miami", label: "Miami", lat: 25.7617, lng: -80.1918, zoom: 10 },
      { value: "San Francisco", label: "San Francisco", lat: 37.7749, lng: -122.4194, zoom: 10 },
    ],
  };

  const handleCountryChange = (countryValue: string) => {
    setSelectedCountry(countryValue);
    setSelectedCity("all");
    
    const country = countries.find(c => c.value === countryValue);
    if (country) {
      setMapCenter({ lat: country.lat, lng: country.lng });
      setMapZoom(country.zoom);
    }
  };

  const handleCityChange = (cityValue: string) => {
    setSelectedCity(cityValue);
    
    if (selectedCountry !== "all" && cities[selectedCountry as keyof typeof cities]) {
      const cityData = cities[selectedCountry as keyof typeof cities];
      const city = cityData.find(c => c.value === cityValue);
      if (city) {
        setMapCenter({ lat: city.lat, lng: city.lng });
        setMapZoom(city.zoom);
      }
    }
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

          {/* Country and City Selection */}
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Location:</span>
            </div>
            
            <Select value={selectedCountry} onValueChange={handleCountryChange}>
              <SelectTrigger className="w-full md:w-64 bg-background" data-testid="select-country">
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

            {selectedCountry !== "all" && cities[selectedCountry as keyof typeof cities] && (
              <Select value={selectedCity} onValueChange={handleCityChange}>
                <SelectTrigger className="w-full md:w-64 bg-background" data-testid="select-city">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  {cities[selectedCountry as keyof typeof cities]?.map((city) => (
                    <SelectItem key={city.value} value={city.value}>
                      {city.label}
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
          center={mapCenter}
          zoom={mapZoom}
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
