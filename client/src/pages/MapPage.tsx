import { useState } from "react";
import { Map } from "@/components/Map";
import { UserCard } from "@/components/UserCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MapPin } from "lucide-react";
import type { User } from "@shared/schema";

export default function MapPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [liveLocationSharing, setLiveLocationSharing] = useState(false);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
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

        </div>
      </div>

      {/* Full Screen Map */}
      <div className="relative h-[calc(100vh-120px)]">
        <Map 
          onUserSelect={handleUserSelect} 
          height="h-full"
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
