import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface FollowButtonProps {
  userId: string;
  username?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  showIcon?: boolean;
}

export function FollowButton({ 
  userId, 
  username, 
  size = "default", 
  variant = "default",
  showIcon = true 
}: FollowButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check follow status
  const { data: followStatus, isLoading: isCheckingStatus } = useQuery({
    queryKey: ["follow-status", userId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/follow/status/${userId}`);
      return await response.json();
    },
    staleTime: 30000, // Cache for 30 seconds
    enabled: !!(user && user.id !== userId), // Only run query if conditions are met
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/follow/${userId}`);
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["follow-status", userId] });
      queryClient.invalidateQueries({ queryKey: ["followers", userId] });
      queryClient.invalidateQueries({ queryKey: ["following", user.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      
      toast({
        title: "Success",
        description: `Now following ${username || 'user'}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to follow user",
        variant: "destructive",
      });
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/follow/${userId}`);
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["follow-status", userId] });
      queryClient.invalidateQueries({ queryKey: ["followers", userId] });
      queryClient.invalidateQueries({ queryKey: ["following", user.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      
      toast({
        title: "Success",
        description: `Unfollowed ${username || 'user'}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow user",
        variant: "destructive",
      });
    },
  });

  // Don't show button if user is not logged in or trying to follow themselves
  if (!user || user.id === userId) {
    return null;
  }

  const isLoading = isCheckingStatus || followMutation.isPending || unfollowMutation.isPending;
  const isFollowing = followStatus?.isFollowing;

  const handleClick = () => {
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      size={size}
      variant={isFollowing ? "outline" : variant}
      className={`flex items-center gap-2 ${
        isFollowing 
          ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" 
          : ""
      }`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {showIcon && (
            isFollowing ? (
              <UserMinus className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )
          )}
          <span>
            {isFollowing ? "Unfollow" : "Follow"}
          </span>
        </>
      )}
    </Button>
  );
}

// Component for displaying follower/following counts
export function FollowStats({ userId }: { userId: string }) {
  const { data: followers } = useQuery({
    queryKey: ["followers", userId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/followers/${userId}`);
      return await response.json();
    },
    staleTime: 60000, // Cache for 1 minute
  });

  const { data: following } = useQuery({
    queryKey: ["following", userId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/following/${userId}`);
      return await response.json();
    },
    staleTime: 60000, // Cache for 1 minute
  });

  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <span>
        <span className="font-semibold text-foreground">
          {followers?.length || 0}
        </span>{" "}
        followers
      </span>
      <span>
        <span className="font-semibold text-foreground">
          {following?.length || 0}
        </span>{" "}
        following
      </span>
    </div>
  );
}