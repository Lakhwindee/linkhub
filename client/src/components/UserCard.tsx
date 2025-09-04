import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FollowButton, FollowStats } from "@/components/FollowButton";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, MessageCircle, UserPlus, Instagram, Youtube, Globe, Languages, Heart, Star } from "lucide-react";
import { Link } from "wouter";
import type { User } from "@shared/schema";

interface UserCardProps {
  user: User;
  detailed?: boolean;
  showConnectButton?: boolean;
}

export function UserCard({ user, detailed = false, showConnectButton = true }: UserCardProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connectMessage, setConnectMessage] = useState("");
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);

  const connectMutation = useMutation({
    mutationFn: async (data: { toUserId: string; message?: string }) => {
      return await apiRequest("POST", `/api/connect/${data.toUserId}`, { message: data.message });
    },
    onSuccess: () => {
      toast({
        title: "Connect Request Sent",
        description: `Your connect request has been sent to ${user.displayName || user.username}.`,
      });
      setIsConnectDialogOpen(false);
      setConnectMessage("");
    },
    onError: (error) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to send connect request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    connectMutation.mutate({
      toUserId: user.id,
      message: connectMessage.trim() || undefined
    });
  };

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
        return 'bg-chart-2 text-primary';
      case 'traveler':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (!detailed) {
    return (
      <Card className="travel-card" data-testid={`card-user-${user.id}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={user.avatarUrl || user.profileImageUrl || ""} />
              <AvatarFallback data-testid={`text-user-initials-${user.id}`}>
                {(user.displayName || user.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium text-card-foreground" data-testid={`text-username-${user.id}`}>
                {user.displayName || user.username}
              </div>
              <div className="text-sm text-muted-foreground flex items-center" data-testid={`text-location-${user.id}`}>
                <MapPin className="w-3 h-3 mr-1" />
                {user.city}, {user.country}
              </div>
              <Badge 
                variant="secondary" 
                className={`text-xs mt-1 ${getPlanColor(user.plan || 'free')}`}
                data-testid={`badge-plan-${user.id}`}
              >
                {getPlanIcon(user.plan || 'free')}
                <span className="ml-1">{user.plan}</span>
              </Badge>
            </div>
            <div className="flex items-center gap-2">
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
    );
  }

  return (
    <Card data-testid={`card-user-detailed-${user.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user.avatarUrl || user.profileImageUrl || ""} />
            <AvatarFallback className="text-2xl" data-testid={`text-user-initials-detailed-${user.id}`}>
              {(user.displayName || user.username).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-card-foreground" data-testid={`text-username-detailed-${user.id}`}>
              {user.displayName || user.username}
            </h3>
            <p className="text-sm text-muted-foreground" data-testid={`text-user-handle-${user.id}`}>
              @{user.username}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge 
                variant="secondary" 
                className={`text-xs ${getPlanColor(user.plan || 'free')}`}
                data-testid={`badge-plan-detailed-${user.id}`}
              >
                {getPlanIcon(user.plan || 'free')}
                <span className="ml-1">{user.plan}</span>
              </Badge>
              <div className="flex items-center text-sm text-muted-foreground" data-testid={`text-location-detailed-${user.id}`}>
                <MapPin className="w-3 h-3 mr-1" />
                {user.city}, {user.country}
              </div>
            </div>
            <div className="mt-3">
              <FollowStats userId={user.id} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FollowButton 
              userId={user.id} 
              username={user.username} 
              size="sm"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bio */}
        {user.bio && (
          <div>
            <p className="text-sm text-card-foreground" data-testid={`text-bio-${user.id}`}>
              {user.bio}
            </p>
          </div>
        )}

        {/* Location Details */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-card-foreground">Location</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center" data-testid={`text-current-location-${user.id}`}>
              <MapPin className="w-3 h-3 mr-2" />
              Currently in: {user.city}, {user.country}
            </div>
            {user.homeCity && user.homeCountry && (
              <div className="flex items-center" data-testid={`text-home-location-${user.id}`}>
                <Globe className="w-3 h-3 mr-2" />
                From: {user.homeCity}, {user.homeCountry}
              </div>
            )}
          </div>
        </div>

        {/* Languages */}
        {user.languages && user.languages.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-card-foreground flex items-center">
              <Languages className="w-3 h-3 mr-2" />
              Languages
            </h4>
            <div className="flex flex-wrap gap-1">
              {user.languages.map((language, index) => (
                <Badge key={index} variant="outline" className="text-xs" data-testid={`badge-language-${user.id}-${index}`}>
                  {language}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {user.interests && user.interests.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-card-foreground">Interests</h4>
            <div className="flex flex-wrap gap-1">
              {user.interests.map((interest, index) => (
                <Badge key={index} variant="secondary" className="text-xs" data-testid={`badge-interest-${user.id}-${index}`}>
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Social Links */}
        <div className="flex space-x-3">
          {user.instagramUrl && (
            <Button variant="ghost" size="sm" asChild data-testid={`link-instagram-${user.id}`}>
              <a href={user.instagramUrl} target="_blank" rel="noopener noreferrer">
                <Instagram className="w-4 h-4 text-pink-500" />
              </a>
            </Button>
          )}
          {user.youtubeUrl && (
            <Button variant="ghost" size="sm" asChild data-testid={`link-youtube-${user.id}`}>
              <a href={user.youtubeUrl} target="_blank" rel="noopener noreferrer">
                <Youtube className="w-4 h-4 text-red-500" />
              </a>
            </Button>
          )}
          {user.tiktokUrl && (
            <Button variant="ghost" size="sm" asChild data-testid={`link-tiktok-${user.id}`}>
              <a href={user.tiktokUrl} target="_blank" rel="noopener noreferrer">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.589 6.686a4.793 4.793 0 01-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 01-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 013.183-4.51v-3.5a6.329 6.329 0 00-5.394 10.692 6.33 6.33 0 10.211-11.07C8.91 8.892 8.91 8.892 8.91 8.892v3.183a3.688 3.688 0 00-1.849.043 3.688 3.688 0 013.688 3.688A3.688 3.688 0 0014.437 19h.295a3.701 3.701 0 00-.295-1.47V5.67a7.778 7.778 0 005.152 1.016z"/>
                </svg>
              </a>
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        {showConnectButton && currentUser && currentUser.id !== user.id && (
          <div className="flex space-x-2 pt-2">
            <Button size="sm" variant="outline" asChild data-testid={`button-view-profile-${user.id}`}>
              <Link href={`/users/${user.username}`}>View Profile</Link>
            </Button>
            
            <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-accent hover:bg-accent/90" data-testid={`button-connect-${user.id}`}>
                  <UserPlus className="w-3 h-3 mr-2" />
                  Connect
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Connect Request</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={user.avatarUrl || user.profileImageUrl || ""} />
                      <AvatarFallback>
                        {(user.displayName || user.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{user.displayName || user.username}</div>
                      <div className="text-sm text-muted-foreground">{user.city}, {user.country}</div>
                    </div>
                  </div>
                  
                  <Textarea
                    placeholder="Add a personal message (optional, max 140 characters)..."
                    value={connectMessage}
                    onChange={(e) => setConnectMessage(e.target.value.slice(0, 140))}
                    rows={3}
                    data-testid="textarea-connect-message"
                  />
                  <p className="text-xs text-muted-foreground">
                    {connectMessage.length}/140 characters
                  </p>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsConnectDialogOpen(false)}
                      data-testid="button-cancel-connect"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleConnect}
                      disabled={connectMutation.isPending}
                      data-testid="button-send-connect"
                    >
                      {connectMutation.isPending ? (
                        <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                      ) : (
                        <MessageCircle className="w-4 h-4 mr-2" />
                      )}
                      Send Request
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
