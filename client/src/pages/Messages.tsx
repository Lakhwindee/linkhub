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
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import type { ConnectRequest, Message, Conversation } from "@shared/schema";

export default function Messages() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
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
              <TabsContent value="conversations" className="space-y-4">
                {conversationsLoading ? (
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
                ) : conversations.length > 0 ? (
                  <div className="space-y-4">
                    {conversations.map((conversation: Conversation) => {
                      const otherUserId = conversation.user1Id === user?.id ? conversation.user2Id : conversation.user1Id;
                      return (
                        <Card 
                          key={conversation.id} 
                          className={`cursor-pointer border-accent/20 hover:border-accent/50 ${selectedConversation === conversation.id ? 'border-accent bg-accent/10' : ''}`}
                          onClick={() => setSelectedConversation(conversation.id)}
                          data-testid={`card-conversation-${conversation.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback data-testid={`text-conversation-user-initials-${conversation.id}`}>
                                  {otherUserId?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="font-medium text-card-foreground" data-testid={`text-conversation-user-${conversation.id}`}>
                                  @{otherUserId}
                                </div>
                                <div className="text-xs text-muted-foreground" data-testid={`text-conversation-time-${conversation.id}`}>
                                  {conversation.lastMessageAt 
                                    ? formatDistanceToNow(new Date(conversation.lastMessageAt)) + ' ago'
                                    : 'No messages yet'
                                  }
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
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
              <Card className="h-[600px] flex flex-col" data-testid="card-chat-area">
                <CardHeader className="border-b border-border">
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5 text-accent" />
                    <span>Conversation</span>
                  </CardTitle>
                </CardHeader>
                
                {/* Messages */}
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="div-messages-container">
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
                        <div className="space-y-4">
                          {messages.map((message: Message) => (
                            <div 
                              key={message.id} 
                              className={`flex ${message.fromUserId === user?.id ? 'justify-end' : 'justify-start'}`}
                              data-testid={`div-message-${message.id}`}
                            >
                              <div className={`max-w-xs lg:max-w-md space-y-1 ${
                                message.fromUserId === user?.id 
                                  ? 'text-right' 
                                  : 'text-left'
                              }`}>
                                <div className={`inline-block p-3 rounded-2xl ${
                                  message.fromUserId === user?.id 
                                    ? 'bg-accent text-accent-foreground' 
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  {message.mediaUrl ? (
                                    message.mediaType === 'video' ? (
                                      <video controls className="max-w-full rounded">
                                        <source src={message.mediaUrl} />
                                      </video>
                                    ) : (
                                      <img 
                                        src={message.mediaUrl} 
                                        alt="Shared media"
                                        className="max-w-full rounded"
                                      />
                                    )
                                  ) : (
                                    <p data-testid={`text-message-body-${message.id}`}>{message.body}</p>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground" data-testid={`text-message-time-${message.id}`}>
                                  {formatDistanceToNow(new Date(message.createdAt!))} ago
                                </div>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-center" data-testid="div-no-messages">
                          <div>
                            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="font-semibold text-foreground mb-2">Start the conversation</h3>
                            <p className="text-muted-foreground text-sm">
                              Send your first message to break the ice!
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="border-t border-border p-4">
                      <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="Type your message..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                              }
                            }}
                            data-testid="input-message"
                          />
                        </div>
                        
                        <div className="flex space-x-1">
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={10 * 1024 * 1024} // 10MB
                            onGetUploadParameters={handleMediaUpload}
                            onComplete={handleMediaComplete}
                            buttonClassName="bg-muted hover:bg-muted/80 text-muted-foreground"
                          >
                            <Image className="w-4 h-4" />
                          </ObjectUploader>

                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={50 * 1024 * 1024} // 50MB
                            onGetUploadParameters={handleMediaUpload}
                            onComplete={handleMediaComplete}
                            buttonClassName="bg-muted hover:bg-muted/80 text-muted-foreground"
                          >
                            <Video className="w-4 h-4" />
                          </ObjectUploader>

                          <Button 
                            type="submit" 
                            size="icon"
                            disabled={!messageInput.trim() || sendMessageMutation.isPending}
                            data-testid="button-send-message"
                          >
                            {sendMessageMutation.isPending ? (
                              <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[600px] flex items-center justify-center" data-testid="card-no-thread-selected">
                <CardContent className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a connect request to start messaging, or accept new requests to begin conversations.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
