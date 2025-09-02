import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FirebaseChat } from "@/components/FirebaseChat";
import { MessageCircle, Users, UserPlus, UserCheck, UserX, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import type { ConnectRequest, Conversation } from "@shared/schema";

export default function Messages() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Fetch connect requests
  const { data: receivedRequests = [], isLoading: requestsLoading } = useQuery<ConnectRequest[]>({
    queryKey: ["/api/connect-requests"],
    enabled: isAuthenticated,
    retry: false,
    refetchInterval: 5000,
  });

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: isAuthenticated,
    retry: false,
    refetchInterval: 5000,
  });

  // Get test user data
  const getUserData = (userId: string) => {
    const testUsers = [
      {
        id: "test-user-1",
        username: "alex_traveler",
        displayName: "Alex Johnson",
        email: "alex@example.com",
        firstName: "Alex",
        lastName: "Johnson",
        plan: "traveler",
        city: "London",
        country: "United Kingdom",
        lat: 51.5074,
        lng: -0.1278,
        showOnMap: true,
        interests: ["photography", "food"],
        profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        currentCity: "London",
        currentCountry: "United Kingdom",
        createdAt: "2025-09-02T21:51:12.993Z",
        updatedAt: "2025-09-02T21:51:12.993Z"
      },
      {
        id: "test-user-2", 
        username: "maria_creator",
        displayName: "Maria Santos",
        email: "maria@example.com",
        firstName: "Maria",
        lastName: "Santos",
        plan: "creator",
        city: "Barcelona",
        country: "Spain",
        lat: 41.3851,
        lng: 2.1734,
        showOnMap: true,
        interests: ["culture", "nightlife"],
        profileImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        currentCity: "Barcelona",
        currentCountry: "Spain",
        createdAt: "2025-09-02T21:51:12.993Z",
        updatedAt: "2025-09-02T21:51:12.993Z"
      }
    ];

    return testUsers.find(u => u.id === userId) || {
      id: userId,
      displayName: "Unknown User",
      profileImageUrl: "",
      city: "Unknown",
      country: "Unknown",
      plan: "free"
    };
  };

  // Accept/Decline connect request mutation
  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: 'accepted' | 'declined' }) => {
      return apiRequest(`/api/connect/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/connect-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      
      toast({
        title: status === 'accepted' ? "Request Accepted" : "Request Declined",
        description: status === 'accepted' 
          ? "You can now message each other!" 
          : "Request has been declined.",
        variant: status === 'accepted' ? "default" : "destructive",
      });
    },
    onError: (error) => {
      console.error('Failed to update request:', error);
      toast({
        title: "Error",
        description: "Failed to update request. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAcceptRequest = (requestId: string) => {
    updateRequestMutation.mutate({ requestId, status: 'accepted' });
  };

  const handleDeclineRequest = (requestId: string) => {
    updateRequestMutation.mutate({ requestId, status: 'declined' });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Messages</h1>
        <p className="text-muted-foreground">Connect with travelers around the world</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-1">
          <Tabs defaultValue="conversations" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="conversations" className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>Chats</span>
                {conversations.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-2 text-xs">
                    {conversations.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Requests</span>
                {receivedRequests.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-2 text-xs">
                    {receivedRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="mt-4">
              {requestsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="p-4">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : receivedRequests.length > 0 ? (
                <div className="space-y-3">
                  {receivedRequests.map((request) => {
                    const userData = getUserData(request.fromUserId!);
                    return (
                      <Card key={request.id} className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={userData.profileImageUrl} alt={userData.displayName} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                              {userData.displayName?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{userData.displayName}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              📍 {userData.city}, {userData.country}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {request.createdAt ? formatDistanceToNow(new Date(request.createdAt), { addSuffix: true }) : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-3">
                          <Button
                            onClick={() => handleAcceptRequest(request.id)}
                            disabled={updateRequestMutation.isPending}
                            size="sm"
                            className="flex-1 bg-green-500 hover:bg-green-600"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleDeclineRequest(request.id)}
                            disabled={updateRequestMutation.isPending}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <UserPlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="font-semibold text-foreground mb-2">No new requests</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      You'll see connect requests from other travelers here.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/map">Find Travelers</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="conversations" className="mt-4">
              {conversationsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="p-4">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : conversations.length > 0 ? (
                <div className="space-y-1">
                  {conversations.map((conversation: Conversation) => {
                    const otherUserId = conversation.user1Id === user?.id ? conversation.user2Id : conversation.user1Id;
                    const userData = getUserData(otherUserId || '');
                    
                    return (
                      <Card
                        key={conversation.id}
                        className={`p-4 cursor-pointer transition-all duration-200 ${
                          selectedConversation === conversation.id 
                            ? 'bg-accent/20 border-l-4 border-accent shadow-sm' 
                            : 'hover:shadow-sm'
                        }`}
                        onClick={() => {
                          console.log('Selecting conversation:', conversation.id);
                          setSelectedConversation(conversation.id);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={userData.profileImageUrl} alt={userData.displayName} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                              {userData.displayName?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-foreground truncate">{userData.displayName}</p>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                userData.plan === 'creator' 
                                  ? 'bg-purple-100 text-purple-700'
                                  : userData.plan === 'traveler'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {userData.plan === 'creator' ? '⭐ Creator' : userData.plan === 'traveler' ? '✈️ Traveler' : '🆓 Free'}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              📍 {userData.city}, {userData.country}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="font-semibold text-foreground mb-2">No conversations yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Accept connect requests to start messaging with other travelers.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/map">Find Travelers</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            (() => {
              const selectedConv = conversations.find(c => c.id === selectedConversation);
              const otherUserId = selectedConv?.user1Id === user?.id ? selectedConv?.user2Id : selectedConv?.user1Id;
              const userData = getUserData(otherUserId || '');
              
              return (
                <FirebaseChat
                  conversationId={selectedConversation}
                  otherUser={{
                    id: otherUserId || '',
                    name: userData.displayName || 'Unknown User',
                    avatar: userData.profileImageUrl,
                    city: userData.city,
                    country: userData.country,
                    plan: userData.plan
                  }}
                />
              );
            })()
          ) : (
            <div className="h-[600px] flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border shadow-sm">
              <div className="text-center max-w-md mx-auto p-8">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <MessageCircle className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Welcome to HubLink Chat! 🚀</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  Select a conversation from the list to start messaging with fellow travelers.
                  <br />Accept connect requests to begin new conversations and build your travel network!
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Ready to connect</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}