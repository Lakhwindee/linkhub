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
import { Map } from "@/components/Map";
import { PostCard } from "@/components/PostCard";
import { EventCard } from "@/components/EventCard";
import type { User, Post, Event } from "@shared/schema";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

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

  // Fetch recent posts
  const { data: recentPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["/api/feed"],
    retry: false,
  });

  // Fetch upcoming events
  const { data: upcomingEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/events"],
    retry: false,
  });

  // Fetch connect requests
  const { data: connectRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/connect-requests"],
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
      label: "Connections",
      value: "24",
      color: "text-accent"
    },
    {
      icon: MessageCircle,
      label: "Messages",
      value: connectRequests.length.toString(),
      color: "text-blue-500"
    },
    {
      icon: Calendar,
      label: "Events",
      value: upcomingEvents.length.toString(),
      color: "text-purple-500"
    },
    {
      icon: MapPin,
      label: "Countries",
      value: "12",
      color: "text-green-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="heading-welcome">
              Welcome back, {user.displayName || user.username}! 👋
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-welcome-subtitle">
              Discover new travelers and share your journey
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" data-testid="badge-user-plan">
              {user.plan} Plan
            </Badge>
            {user.plan === 'free' && (
              <Button asChild data-testid="button-upgrade">
                <Link href="/subscribe">Upgrade</Link>
              </Button>
            )}
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
            {/* Discover Section */}
            <Card data-testid="card-discover">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-accent" />
                  <span>Discover Travelers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Map height="h-64" />
                <div className="mt-4">
                  <Button asChild className="w-full" data-testid="button-explore-map">
                    <Link href="/map">Explore Full Map</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

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
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-posts">
                    <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No posts yet. Be the first to share your journey!</p>
                    <Button className="mt-4" asChild data-testid="button-create-post">
                      <Link href="/feed">Create Post</Link>
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
                  <div className="text-center py-4 text-muted-foreground" data-testid="text-no-requests">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No pending requests</p>
                  </div>
                )}
              </CardContent>
            </Card>

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
                  <div className="text-center py-4 text-muted-foreground" data-testid="text-no-events">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No upcoming events</p>
                    <Button size="sm" className="mt-2" asChild data-testid="button-create-event">
                      <Link href="/events">Create Event</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Creator Dashboard */}
            {user.plan === 'creator' && (
              <Card data-testid="card-creator-dashboard">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-chart-2" />
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
                  <Button className="w-full" asChild data-testid="button-browse-ads">
                    <Link href="/ads">Browse Campaigns</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

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
                <Button variant="outline" className="w-full justify-start" asChild data-testid="button-find-travelers">
                  <Link href="/map">
                    <MapPin className="w-4 h-4 mr-2" />
                    Find Travelers
                  </Link>
                </Button>
                {user.plan === 'free' && (
                  <Button className="w-full justify-start" asChild data-testid="button-upgrade-quick">
                    <Link href="/subscribe">
                      <Star className="w-4 h-4 mr-2" />
                      Upgrade Plan
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
