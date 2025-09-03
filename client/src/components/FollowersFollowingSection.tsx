import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserCheck, UserPlus } from "lucide-react";
import { FollowButton } from "./FollowButton";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { Link } from "wouter";

interface FollowersFollowingSectionProps {
  userId: string;
  showCounts?: boolean;
}

export function FollowersFollowingSection({ 
  userId, 
  showCounts = true 
}: FollowersFollowingSectionProps) {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("followers");

  // Fetch followers
  const { data: followers = [], isLoading: loadingFollowers } = useQuery<User[]>({
    queryKey: ["followers", userId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/followers/${userId}`);
      return await response.json();
    },
    staleTime: 60000, // Cache for 1 minute
  });

  // Fetch following
  const { data: following = [], isLoading: loadingFollowing } = useQuery<User[]>({
    queryKey: ["following", userId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/following/${userId}`);
      return await response.json();
    },
    staleTime: 60000, // Cache for 1 minute
  });

  const UserCard = ({ user }: { user: User }) => (
    <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="flex items-center space-x-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={user.profileImageUrl || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <Link href={`/profile/${user.username}`}>
            <span className="font-medium text-sm hover:underline cursor-pointer">
              {user.displayName || `${user.firstName} ${user.lastName}`.trim()}
            </span>
          </Link>
          <span className="text-xs text-muted-foreground">@{user.username}</span>
          {(user.city && user.country) && (
            <span className="text-xs text-muted-foreground">📍 {user.city}, {user.country}</span>
          )}
        </div>
      </div>
      {currentUser && currentUser.id !== user.id && (
        <FollowButton 
          userId={user.id} 
          username={user.username}
          size="sm"
          variant="outline"
          showIcon={false}
        />
      )}
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
            <div className="space-y-1">
              <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
              <div className="h-3 bg-muted rounded w-16 animate-pulse"></div>
            </div>
          </div>
          <div className="w-16 h-8 bg-muted rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  );

  const EmptyState = ({ type }: { type: 'followers' | 'following' }) => (
    <div className="text-center py-8 text-muted-foreground">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
        {type === 'followers' ? (
          <Users className="w-8 h-8" />
        ) : (
          <UserCheck className="w-8 h-8" />
        )}
      </div>
      <p className="text-sm mb-2">
        {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
      </p>
      <p className="text-xs">
        {type === 'followers' 
          ? 'Share your profile to get followers!' 
          : 'Discover and follow other travelers!'}
      </p>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-accent" />
          <span>Social Network</span>
        </CardTitle>
        {showCounts && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <span>
              <span className="font-semibold text-foreground">
                {followers.length}
              </span>{" "}
              followers
            </span>
            <span>
              <span className="font-semibold text-foreground">
                {following.length}
              </span>{" "}
              following
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Followers</span>
              {followers.length > 0 && (
                <span className="ml-1 bg-accent text-accent-foreground text-xs rounded-full px-2 py-0.5">
                  {followers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4" />
              <span>Following</span>
              {following.length > 0 && (
                <span className="ml-1 bg-accent text-accent-foreground text-xs rounded-full px-2 py-0.5">
                  {following.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="followers" className="mt-4">
            {loadingFollowers ? (
              <LoadingSkeleton />
            ) : followers.length > 0 ? (
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {followers.map((follower) => (
                  <UserCard key={follower.id} user={follower} />
                ))}
              </div>
            ) : (
              <EmptyState type="followers" />
            )}
          </TabsContent>
          
          <TabsContent value="following" className="mt-4">
            {loadingFollowing ? (
              <LoadingSkeleton />
            ) : following.length > 0 ? (
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {following.map((followedUser) => (
                  <UserCard key={followedUser.id} user={followedUser} />
                ))}
              </div>
            ) : (
              <EmptyState type="following" />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}