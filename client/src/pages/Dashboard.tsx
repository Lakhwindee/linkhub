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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Recent Posts */}
            <Card data-testid="card-recent-posts">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-accent" />
                  <span>Recent Posts</span>
                </CardTitle>
                <Button variant="outline" size="sm" asChild data-testid="button-view-all-posts">
                  <Link href="/feed">View All</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {postsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : recentPosts.length > 0 ? (
                  <div className="space-y-4">
                    {recentPosts.slice(0, 3).map((post: Post) => (
                      <PostCard key={post.id} post={post} compact={true} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Sample Post */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <img 
                          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face" 
                          alt="test-user-1" 
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <div className="font-medium text-sm">@test-user-1</div>
                          <div className="text-xs text-muted-foreground">about 1 year ago</div>
                        </div>
                      </div>
                      <p className="text-sm mb-3">
                        Amazing sunrise over London this morning! The city never fails to surprise me with its hidden beauty spots. 🌅
                      </p>
                      <div className="text-xs text-muted-foreground">
                        📍 London, United Kingdom
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm" className="w-full" data-testid="button-view-all-posts">
                      View All
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Connect Requests */}
            <Card data-testid="card-connect-requests">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-accent" />
                  <span>Connect Requests</span>
                  {connectRequests.length > 0 && (
                    <Badge variant="destructive" data-testid="badge-requests-count">
                      {connectRequests.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : connectRequests.length > 0 ? (
                  <div className="space-y-3">
                    {connectRequests.slice(0, 3).map((request: any) => (
                      <div key={request.id} className="flex items-center space-x-3" data-testid={`div-request-${request.id}`}>
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            {request.fromUser?.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {request.fromUser?.displayName || request.fromUser?.username}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {request.message || "Wants to connect"}
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full" asChild data-testid="button-view-all-requests">
                      <Link href="/messages">View All</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-requests">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm">No pending requests</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Followers and Following Section */}
            <FollowersFollowingSection userId={user.id} />

            {/* Upcoming Events */}
            <Card data-testid="card-upcoming-events">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  <span>Upcoming Events</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : upcomingEvents.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingEvents.slice(0, 3).map((event: Event) => (
                      <EventCard key={event.id} event={event} compact={true} />
                    ))}
                    <Button variant="outline" size="sm" className="w-full" asChild data-testid="button-view-all-events">
                      <Link href="/events">View All Events</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Sample Events */}
                    <div className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">London Photography Walk</h4>
                        <Badge className="bg-blue-100 text-blue-800 text-xs">meetup</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">📅 Oct 25, 1:30 AM 📍 London, United Kingdom</p>
                    </div>
                    
                    <div className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">Barcelona Food Tour</h4>
                        <Badge className="bg-green-100 text-green-800 text-xs">food</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">📅 Oct 30, 7:00 AM 📍 Barcelona, Spain</p>
                    </div>
                    
                    <div className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">Tokyo Temple Hopping</h4>
                        <Badge className="bg-green-100 text-green-800 text-xs">food</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">📅 Oct 30, 1:50 AM 📍 Tokyo, Japan</p>
                    </div>
                    
                    <Button variant="outline" size="sm" className="w-full" data-testid="button-view-all-events">
                      View All Events
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Creator Dashboard */}
            <Card data-testid="card-creator-dashboard">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                  <span>Creator Dashboard</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground" data-testid="text-earnings">£0</div>
                    <div className="text-xs text-muted-foreground">Total Earnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground" data-testid="text-campaigns">0</div>
                    <div className="text-xs text-muted-foreground">Active Campaigns</div>
                  </div>
                </div>
                <Button className="w-full bg-gray-900 hover:bg-gray-800" asChild data-testid="button-browse-ads">
                  <Link href="/ads">Browse Campaigns</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card data-testid="card-quick-actions">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild data-testid="button-create-post-quick">
                  <Link href="/feed">
                    <Globe className="w-4 h-4 mr-2" />
                    Create Post
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild data-testid="button-create-event-quick">
                  <Link href="/events">
                    <Calendar className="w-4 h-4 mr-2" />
                    Create Event
                  </Link>
                </Button>
                <Button className="w-full justify-start" asChild data-testid="button-upgrade-quick">
                  <Link href="/subscribe">
                    <Star className="w-4 h-4 mr-2" />
                    Upgrade Plan
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}