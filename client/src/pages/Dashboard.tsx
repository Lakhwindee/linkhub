import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Users, MessageCircle, Calendar, DollarSign, TrendingUp, Globe, Star } from "lucide-react";
import { Link } from "wouter";
import { PostCard } from "@/components/PostCard";
import { EventCard } from "@/components/EventCard";
import { FollowersFollowingSection } from "@/components/FollowersFollowingSection";
import type { User, Post, Event } from "@shared/schema";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Demo user with more realistic data
  const demoUser = {
    firstName: 'Demo',
    lastName: 'User',
    displayName: 'Demo User',
    username: 'demo',
    plan: 'creator',
    profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  };

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

  // Fetch recent posts from followed users only
  const { data: recentPosts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/feed", "following", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/feed?tab=following&limit=5`);
      return await response.json();
    },
    enabled: !!user?.id,
    retry: false,
  });

  // Fetch upcoming events
  const { data: upcomingEvents = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    retry: false,
  });

  // Fetch connect requests
  const { data: connectRequests = [], isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: ["/api/connect-requests"],
    retry: false,
  });

  // Fetch follower/following data for stats
  const { data: followers = [] } = useQuery<any[]>({
    queryKey: ["followers", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/followers/${user.id}`);
      return await response.json();
    },
    enabled: !!user?.id,
    retry: false,
  });

  const { data: following = [] } = useQuery<any[]>({
    queryKey: ["following", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/following/${user.id}`);
      return await response.json();
    },
    enabled: !!user?.id,
    retry: false,
  });

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

  const quickStats = [
    {
      icon: Users,
      label: "Followers",
      value: followers.length.toString(),
      color: "text-blue-600"
    },
    {
      icon: Users,
      label: "Following", 
      value: following.length.toString(),
      color: "text-purple-600"
    },
    {
      icon: MessageCircle,
      label: "Messages",
      value: "0",
      color: "text-gray-600"
    },
    {
      icon: Calendar,
      label: "Events",
      value: upcomingEvents.length.toString(),
      color: "text-green-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="heading-welcome">
              Welcome back, Demo User! 👋
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-welcome-subtitle">
              Discover new travelers and share your journey
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800" data-testid="badge-user-plan">
              Creator Plan
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index} data-testid={`card-stat-${index}`}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-muted`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground" data-testid={`text-stat-value-${index}`}>
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground" data-testid={`text-stat-label-${index}`}>
                      {stat.label}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instagram-like Social Feed */}
        <div className="max-w-2xl mx-auto space-y-6">
          <Card data-testid="card-social-feed">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-accent" />
                <span>Social Feed</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {postsLoading ? (
                <div className="space-y-6">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-24"></div>
                          <div className="h-3 bg-muted rounded w-16"></div>
                        </div>
                      </div>
                      <div className="h-64 bg-muted rounded-lg"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : recentPosts.length > 0 ? (
                <div className="space-y-6">
                  {recentPosts.map((post: Post) => (
                    <PostCard key={post.id} post={post} compact={false} />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Sample Posts - Instagram Style */}
                  <PostCard 
                    post={{
                      id: 'demo-post-1',
                      userId: 'test-user-1',
                      body: 'Amazing sunrise over London this morning! The city never fails to surprise me with its hidden beauty spots. 🌅',
                      city: 'London',
                      country: 'United Kingdom',
                      visibility: 'public',
                      createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
                      mediaUrls: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=500&h=500&fit=crop']
                    } as Post}
                    compact={false}
                  />
                  
                  <PostCard 
                    post={{
                      id: 'demo-post-2', 
                      userId: 'travel_explorer',
                      body: 'Beautiful sunset at Santorini! Greece never disappoints 🇬🇷✨ #TravelLife #Greece',
                      city: 'Santorini',
                      country: 'Greece',
                      visibility: 'public',
                      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                      mediaUrls: ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=500&h=500&fit=crop']
                    } as Post}
                    compact={false}
                  />

                  <PostCard 
                    post={{
                      id: 'demo-post-3',
                      userId: 'foodie_wanderer', 
                      body: 'Tokyo street food adventure! This ramen was absolutely incredible 🍜 Best meal of my trip so far!',
                      city: 'Tokyo',
                      country: 'Japan',
                      visibility: 'public',
                      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                      mediaUrls: ['https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&h=500&fit=crop']
                    } as Post}
                    compact={false}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}