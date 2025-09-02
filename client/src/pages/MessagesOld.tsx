import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ObjectUploader } from "@/components/ObjectUploader";
import { MessageCircle, Send, Image, Video, Users, UserPlus, UserCheck, UserX, Search, Plus } from "lucide-react";
import { FirebaseChat } from "../components/FirebaseChat";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import type { ConnectRequest, Message, Conversation } from "@shared/schema";

export default function Messages() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  
  // Track selectedConversation state changes
  useEffect(() => {
    console.log('Selected conversation changed to:', selectedConversation);
  }, [selectedConversation]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

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
    queryKey: ["/api/connect-requests", { type: 'received' }],
    retry: false,
  });

  const { data: sentRequests = [] } = useQuery<ConnectRequest[]>({
    queryKey: ["/api/connect-requests", { type: 'sent' }],
    retry: false,
  });

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    retry: false,
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedConversation],
    enabled: !!selectedConversation,
    retry: false,
  });
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !selectedConversation) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      wsRef.current?.send(JSON.stringify({
        type: 'join_conversation',
        conversationId: selectedConversation
      }));
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_message' && data.conversationId === selectedConversation) {
        queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversation] });
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      }
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      wsRef.current?.close();
    };
  }, [selectedConversation, isAuthenticated, queryClient]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleConnectRequest = useMutation({
    mutationFn: async (data: { requestId: string; status: string }) => {
      return await apiRequest("PATCH", `/api/connect/${data.requestId}`, { status: data.status });
    },
    onSuccess: (data, { status }) => {
      toast({
        title: status === 'accepted' ? "Request Accepted" : "Request Declined",
        description: status === 'accepted' 
          ? "You can now message each other!" 
          : "The connect request has been declined.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/connect-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: (error) => {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to update connect request.",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: string; body: string; mediaUrl?: string }) => {
      return await apiRequest("POST", `/api/messages/${data.conversationId}`, data);
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      
      // Send via WebSocket for real-time delivery
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'send_message',
          conversationId: selectedConversation,
          data: { body: messageInput }
        }));
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Message Failed",
        description: error.message || "Failed to send message.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      body: messageInput.trim()
    });
  };

  const handleMediaUpload = async () => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload");
      const { uploadURL } = await response.json();
      return { method: "PUT" as const, url: uploadURL };
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to get upload URL. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleMediaComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0 && selectedConversation) {
      const uploadedFile = result.successful[0];
      try {
        const response = await apiRequest("PUT", "/api/media", {
          mediaUrl: uploadedFile.uploadURL
        });
        const { objectPath } = await response.json();
        
        sendMessageMutation.mutate({
          conversationId: selectedConversation,
          body: "",
          mediaUrl: objectPath
        });
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: "Failed to send media message.",
          variant: "destructive",
        });
      }
    }
  };

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

  const filteredReceivedRequests = receivedRequests.filter((request: ConnectRequest) =>
    !searchQuery || 
    request.fromUserId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper function to get user data from test users
  const getUserData = (userId: string) => {
    const testUsers = [
      { id: 'test-user-1', username: 'alex_traveler', displayName: 'Alex Johnson', firstName: 'Alex', lastName: 'Johnson', plan: 'traveler', city: 'London', country: 'United Kingdom', profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
      { id: 'test-user-2', username: 'maria_creator', displayName: 'Maria Santos', firstName: 'Maria', lastName: 'Santos', plan: 'creator', city: 'Barcelona', country: 'Spain', profileImageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' },
      { id: 'test-user-3', username: 'yuki_explorer', displayName: 'Yuki Tanaka', firstName: 'Yuki', lastName: 'Tanaka', plan: 'traveler', city: 'Tokyo', country: 'Japan', profileImageUrl: 'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=150&h=150&fit=crop&crop=face' },
      { id: 'test-user-5', username: 'emma_foodie', displayName: 'Emma Thompson', firstName: 'Emma', lastName: 'Thompson', plan: 'creator', city: 'Paris', country: 'France', profileImageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' }
    ];
    
    return testUsers.find(u => u.id === userId) || {
      id: userId,
      username: userId,
      displayName: userId,
      firstName: userId,
      plan: 'free',
      city: 'Unknown',
      country: 'Unknown',
      profileImageUrl: ''
    };
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2" data-testid="heading-messages">
              <MessageCircle className="w-8 h-8 text-accent" />
              <span>Messages</span>
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-messages-subtitle">
              Connect with travelers and manage your conversations
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" data-testid="badge-requests-count">
              {receivedRequests.length} pending requests
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar - Requests and Conversations */}
          <div className="space-y-6">
            <Tabs defaultValue="requests" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="requests" data-testid="tab-requests">
                  Connect Requests
                </TabsTrigger>
                <TabsTrigger value="conversations" data-testid="tab-conversations">
                  Conversations
                </TabsTrigger>
              </TabsList>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-messages"
                />
              </div>

              {/* Connect Requests */}
              <TabsContent value="requests" className="space-y-4">
                {requestsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-muted rounded-full"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-muted rounded w-24"></div>
                              <div className="h-3 bg-muted rounded w-16"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredReceivedRequests.length > 0 ? (
                  <div className="space-y-4">
                    {filteredReceivedRequests.map((request: ConnectRequest) => (
                      <Card key={request.id} className="border-accent/50" data-testid={`card-request-${request.id}`}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback data-testid={`text-request-sender-initials-${request.id}`}>
                                  {request.fromUserId?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="font-medium text-card-foreground" data-testid={`text-request-sender-${request.id}`}>
                                  @{request.fromUserId}
                                </div>
                                <div className="text-xs text-muted-foreground" data-testid={`text-request-time-${request.id}`}>
                                  {formatDistanceToNow(new Date(request.createdAt!))} ago
                                </div>
                              </div>
                            </div>
                            
                            {request.message && (
                              <p className="text-sm text-card-foreground bg-muted/50 p-2 rounded" data-testid={`text-request-message-${request.id}`}>
                                "{request.message}"
                              </p>
                            )}

                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                className="flex-1 bg-accent hover:bg-accent/90"
                                onClick={() => handleConnectRequest.mutate({ requestId: request.id, status: 'accepted' })}
                                disabled={handleConnectRequest.isPending}
                                data-testid={`button-accept-request-${request.id}`}
                              >
                                <UserCheck className="w-3 h-3 mr-2" />
                                Accept
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleConnectRequest.mutate({ requestId: request.id, status: 'rejected' })}
                                disabled={handleConnectRequest.isPending}
                                data-testid={`button-reject-request-${request.id}`}
                              >
                                <UserX className="w-3 h-3 mr-2" />
                                Decline
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card data-testid="card-no-requests">
                    <CardContent className="p-8 text-center">
                      <UserPlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="font-semibold text-foreground mb-2">No connect requests</h3>
                      <p className="text-muted-foreground text-sm">
                        When travelers want to connect with you, their requests will appear here.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Conversations */}
              <TabsContent value="conversations" className="space-y-2">
                {conversationsLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse p-4 rounded-xl bg-muted/50">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-muted rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-32"></div>
                            <div className="h-3 bg-muted rounded w-24"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : conversations.length > 0 ? (
                  <div className="space-y-1">
                    {(conversations || []).map((conversation: Conversation) => {
                      const otherUserId = conversation.user1Id === user?.id ? conversation.user2Id : conversation.user1Id;
                      
                      // Get user data from test users
                      const userData = getUserData(otherUserId || '');
                      
                      return (
                        <div 
                          key={conversation.id} 
                          className={`cursor-pointer p-4 rounded-xl transition-all duration-200 hover:bg-accent/10 ${
                            selectedConversation === conversation.id 
                              ? 'bg-accent/20 border-l-4 border-accent shadow-sm' 
                              : 'hover:shadow-sm'
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Selecting conversation:', conversation.id);
                            setSelectedConversation(conversation.id);
                          }}
                          data-testid={`card-conversation-${conversation.id}`}
                        >
                          <div className="flex items-center space-x-3">
                            {/* Profile Image with Online Status */}
                            <div className="relative">
                              <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                                <AvatarImage src={userData.profileImageUrl} alt={userData.displayName} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                  {userData.displayName?.charAt(0)?.toUpperCase() || otherUserId?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              {/* Online Status */}
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {/* User Name & Location */}
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-foreground truncate">
                                  {userData.displayName || userData.firstName || `@${otherUserId}`}
                                </h4>
                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                  {conversation.lastMessageAt 
                                    ? formatDistanceToNow(new Date(conversation.lastMessageAt))
                                    : 'now'
                                  }
                                </span>
                              </div>
                              
                              {/* Location & Last Message Preview */}
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <span className="truncate">
                                  📍 {userData.city}, {userData.country}
                                </span>
                              </div>
                              
                              {/* Last Message Preview */}
                              <p className="text-sm text-muted-foreground mt-1 truncate">
                                {conversation.lastMessageAt 
                                  ? "💬 Start your conversation..."
                                  : "👋 Say hello to begin chatting!"
                                }
                              </p>
                            </div>
                            
                            {/* Plan Badge */}
                            <div className="flex flex-col items-end space-y-1">
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Card data-testid="card-no-conversations">
                    <CardContent className="p-8 text-center">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="font-semibold text-foreground mb-2">No conversations yet</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Accept connect requests to start messaging with other travelers.
                      </p>
                      <Button variant="outline" size="sm" asChild data-testid="button-find-travelers">
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
                
                {/* Messages */}
                <div className="flex-1 overflow-hidden">
                  <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto px-4 py-4 bg-gradient-to-b from-slate-50/50 to-slate-100/50 dark:from-slate-800/20 dark:to-slate-900/20" data-testid="div-messages-container">
                      <div className="space-y-3">
                      {messagesLoading ? (
                        <div className="space-y-4">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`animate-pulse flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                              <div className="space-y-2 max-w-xs">
                                <div className="h-4 bg-muted rounded w-32"></div>
                                <div className="h-3 bg-muted rounded w-16"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : messages.length > 0 ? (
                        <div className="space-y-3">
                          {messages.map((message: Message) => (
                            <div 
                              key={message.id} 
                              className={`flex items-end space-x-2 ${message.fromUserId === user?.id ? 'justify-end' : 'justify-start'}`}
                              data-testid={`div-message-${message.id}`}
                            >
                              {/* Show avatar for received messages */}
                              {message.fromUserId !== user?.id && (
                                <Avatar className="w-6 h-6 mb-1">
                                  <AvatarImage src={getUserData(message.fromUserId!).profileImageUrl} />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                    {getUserData(message.fromUserId!).displayName?.charAt(0)?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              
                              <div className={`max-w-xs lg:max-w-md space-y-1 ${
                                message.fromUserId === user?.id 
                                  ? 'text-right items-end' 
                                  : 'text-left items-start'
                              }`}>
                                {/* Message Bubble */}
                                <div className={`inline-block px-4 py-2 relative ${
                                  message.fromUserId === user?.id 
                                    ? 'bg-blue-500 text-white rounded-2xl rounded-br-md shadow-md' 
                                    : 'bg-white dark:bg-slate-700 text-foreground rounded-2xl rounded-bl-md shadow-md border'
                                }`}>
                                  {/* Message tail/pointer */}
                                  <div className={`absolute bottom-0 w-0 h-0 ${
                                    message.fromUserId === user?.id
                                      ? 'right-0 border-l-[12px] border-l-blue-500 border-t-[8px] border-t-transparent translate-x-2'
                                      : 'left-0 border-r-[12px] border-r-white dark:border-r-slate-700 border-t-[8px] border-t-transparent -translate-x-2'
                                  }`}></div>
                                  
                                  {message.mediaUrl ? (
                                    <div className="mb-1">
                                      {message.mediaType === 'video' ? (
                                        <video controls className="max-w-full rounded-lg">
                                          <source src={message.mediaUrl} />
                                        </video>
                                      ) : (
                                        <img 
                                          src={message.mediaUrl} 
                                          alt="Shared media"
                                          className="max-w-full rounded-lg"
                                        />
                                      )}
                                    </div>
                                  ) : null}
                                  
                                  <p className="text-sm leading-relaxed" data-testid={`text-message-body-${message.id}`}>
                                    {message.body}
                                  </p>
                                  
                                  <div className={`text-xs mt-1 opacity-70 ${
                                    message.fromUserId === user?.id ? 'text-blue-100' : 'text-muted-foreground'
                                  }`} data-testid={`text-message-time-${message.id}`}>
                                    {formatDistanceToNow(new Date(message.createdAt!))} ago
                                    {message.fromUserId === user?.id && (
                                      <span className="ml-1">✓✓</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Empty space for sent messages to balance layout */}
                              {message.fromUserId === user?.id && <div className="w-6"></div>}
                            </div>
                          ))}
                          <div ref={messagesEndRef} className="h-4" />
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-center py-16" data-testid="div-no-messages">
                          <div className="max-w-sm mx-auto">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <MessageCircle className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-3">Start the conversation</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              Send your first message to break the ice! 🚀 
                              <br />Share your travel plans, ask questions, or just say hello.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                      </div>
                    </div>

                    {/* Message Input - WhatsApp Style */}
                    <div className="border-t bg-background px-4 py-3">
                      <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                        <div className="flex-1">
                          <div className="relative">
                            <Input
                              placeholder="Type a message..."
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage(e);
                                }
                              }}
                              className="rounded-3xl pl-4 pr-20 py-3 bg-accent/10 border-accent/20 focus:border-accent/50 resize-none text-sm"
                              data-testid="input-message"
                            />
                            
                            {/* Media Upload Buttons */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-1">
                              <ObjectUploader
                                maxNumberOfFiles={1}
                                maxFileSize={10 * 1024 * 1024}
                                onGetUploadParameters={handleMediaUpload}
                                onComplete={handleMediaComplete}
                                buttonClassName="p-1.5 rounded-full hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
                              >
                                <Image className="w-4 h-4" />
                              </ObjectUploader>

                              <ObjectUploader
                                maxNumberOfFiles={1}
                                maxFileSize={50 * 1024 * 1024}
                                onGetUploadParameters={handleMediaUpload}
                                onComplete={handleMediaComplete}
                                buttonClassName="p-1.5 rounded-full hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
                              >
                                <Video className="w-4 h-4" />
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          type="submit" 
                          size="icon"
                          disabled={!messageInput.trim() || sendMessageMutation.isPending}
                          className="rounded-full w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-all duration-200 hover:scale-105"
                          data-testid="button-send-message"
                        >
                          {sendMessageMutation.isPending ? (
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
            ) : (
              <div className="h-[600px] flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border shadow-sm" data-testid="card-no-thread-selected">
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
    </div>
  );
}
