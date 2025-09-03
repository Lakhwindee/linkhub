import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Heart } from "lucide-react";
import { FollowButton } from "@/components/FollowButton";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function UserSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search users
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ["users-search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      const response = await apiRequest("GET", `/api/users/search?q=${encodeURIComponent(debouncedQuery)}`);
      return await response.json();
    },
    enabled: debouncedQuery.length >= 1,
  });

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'creator':
        return <Star className="w-3 h-3" />;
      case 'traveler':
        return <Heart className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'creator':
        return 'bg-yellow-100 text-yellow-800';
      case 'traveler':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users by username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8"
        />
      </div>

      {/* Show search instructions */}
      {!searchQuery && (
        <div className="text-center py-4 text-muted-foreground">
          <div className="text-xs">
            Search for users by their username.
            <br />
            <span className="font-medium">Your username: demo_user</span>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && searchQuery && (
        <div className="text-center py-4">
          <div className="w-4 h-4 mx-auto border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {searchResults.map((user: User) => (
            <Card key={user.id} className="p-2">
              <CardContent className="p-0">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.profileImageUrl || ""} />
                    <AvatarFallback className="text-xs">
                      {(user.displayName || user.username || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {user.displayName || user.username}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      @{user.username}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {user.city && user.country && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span className="truncate">{user.city}, {user.country}</span>
                        </div>
                      )}
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getPlanColor(user.plan || 'free')}`}
                      >
                        {getPlanIcon(user.plan || 'free')}
                        <span className="ml-1">{user.plan}</span>
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <FollowButton 
                      userId={user.id} 
                      username={user.username} 
                      size="sm" 
                      showIcon={false}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No results */}
      {searchQuery && debouncedQuery && searchResults.length === 0 && !isLoading && (
        <div className="text-center py-4 text-muted-foreground">
          <div className="text-xs">
            No users found for "{searchQuery}"
          </div>
        </div>
      )}
    </div>
  );
}