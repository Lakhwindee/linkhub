import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/PostCard";
import { FollowButton } from "@/components/FollowButton";
import { MapPin, Calendar, Users, Heart, MessageCircle, Camera, Grid, ArrowLeft, Instagram, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import type { Post, User } from "@shared/schema";

interface UserProfileProps {
  params: {
    userId: string;
  };
}

export default function UserProfile({ params }: UserProfileProps) {
  const [location, navigate] = useLocation();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postCount, setPostCount] = useState(0);

  const userId = params.userId;

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserPosts();
      fetchFollowStatus();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      // Mock user data for now - replace with actual API call
      const mockUser: User = {
        id: userId,
        email: `${userId}@hublink.com`,
        firstName: "Travel",
        lastName: "Explorer",
        username: userId,
        displayName: userId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        profileImageUrl: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1494790108755-2616b612b786' : '1472099645785-5658abf4ff4e'}?w=150&h=150&fit=crop&crop=face`,
        bio: "Travel enthusiast 🌍 | Photography lover 📸 | Sharing my adventures around the world ✈️",
        country: "India",
        city: "Mumbai",
        lat: null,
        lng: null,
        showOnMap: true,
        locationRadius: 5,
        languages: ["English", "Hindi"],
        interests: ["photography", "travel", "culture"],
        youtubeUrl: Math.random() > 0.5 ? "https://youtube.com/@travelexplorer" : null,
        instagramUrl: Math.random() > 0.5 ? "https://instagram.com/travelexplorer" : null,
        role: "user",
        plan: "traveler",
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        canDmMe: "all"
      } as User;
      
      setProfileUser(mockUser);
      setFollowerCount(Math.floor(Math.random() * 1000) + 50);
      setFollowingCount(Math.floor(Math.random() * 500) + 20);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      setIsLoading(true);
      // Mock posts data - replace with actual API call
      const mockPosts: Post[] = Array.from({ length: Math.floor(Math.random() * 12) + 6 }, (_, i) => ({
        id: `post-${userId}-${i}`,
        userId: userId,
        body: [
          "Just discovered this amazing hidden gem! 🌟 The views here are absolutely breathtaking and totally worth the hike.",
          "Trying local street food is always an adventure! This dish was incredible 🍜",
          "Sunset at the beach never gets old. Feeling grateful for moments like these 🌅",
          "Getting lost in the local markets - so much culture and energy here! 🏪",
          "Met some amazing travelers today. Love how travel brings people together 🤝",
          "This architecture is mind-blowing! The details and craftsmanship are incredible 🏛️",
          "Early morning coffee with this view. Life is good ☕️",
          "Adventure time! Sometimes the best experiences come from saying yes to spontaneous plans 🎒"
        ][Math.floor(Math.random() * 8)],
        mediaUrls: Math.random() > 0.3 ? [`https://images.unsplash.com/photo-${[
          '1506905925346-21bea4d5618d',
          '1488646953014-e52207ff888f',
          '1507003211169-0a1dd7ef0a96',
          '1517248135467-4c7edcad34c4',
          '1490750967868-88aa4486c946',
          '1504893524553-b855bce32c67'
        ][Math.floor(Math.random() * 6)]}?w=500&h=500&fit=crop`] : [],
        mediaType: Math.random() > 0.7 ? "video" : "image",
        visibility: "public",
        country: ["India", "Thailand", "Japan", "Italy", "France"][Math.floor(Math.random() * 5)],
        city: ["Mumbai", "Bangkok", "Tokyo", "Rome", "Paris"][Math.floor(Math.random() * 5)],
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      }));
      
      setUserPosts(mockPosts);
      setPostCount(mockPosts.length);
    } catch (error) {
      console.error("Error fetching user posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowStatus = async () => {
    try {
      // Mock follow status - replace with actual API call
      setIsFollowing(Math.random() > 0.5);
    } catch (error) {
      console.error("Error fetching follow status:", error);
    }
  };

  if (isLoading || !profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        
        {/* Header with Back Button */}
        <div className="flex items-center space-x-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <h1 className="text-xl font-semibold">@{profileUser.username}</h1>
        </div>

        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              
              {/* Profile Image */}
              <div className="flex flex-col items-center md:items-start">
                <Avatar className="w-32 h-32 mb-4">
                  <AvatarImage src={profileUser.profileImageUrl || undefined} />
                  <AvatarFallback className="text-2xl">
                    {profileUser.firstName?.[0]}{profileUser.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                
                {/* Stats for mobile */}
                <div className="flex space-x-8 md:hidden">
                  <div className="text-center">
                    <div className="text-xl font-bold">{postCount}</div>
                    <div className="text-sm text-muted-foreground">posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{followerCount}</div>
                    <div className="text-sm text-muted-foreground">followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{followingCount}</div>
                    <div className="text-sm text-muted-foreground">following</div>
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl font-bold">{profileUser.displayName}</h1>
                    <p className="text-muted-foreground">@{profileUser.username}</p>
                  </div>
                  
                  {/* Stats for desktop */}
                  <div className="hidden md:flex space-x-8">
                    <div className="text-center">
                      <div className="text-xl font-bold">{postCount}</div>
                      <div className="text-sm text-muted-foreground">posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold">{followerCount}</div>
                      <div className="text-sm text-muted-foreground">followers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold">{followingCount}</div>
                      <div className="text-sm text-muted-foreground">following</div>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {profileUser.bio && (
                  <p className="text-foreground mb-4 leading-relaxed">{profileUser.bio}</p>
                )}

                {/* Location and Join Date */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  {profileUser.city && profileUser.country && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profileUser.city}, {profileUser.country}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDistanceToNow(new Date(profileUser.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {profileUser.instagramUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={profileUser.instagramUrl} target="_blank" rel="noopener noreferrer">
                        <Instagram className="w-4 h-4 mr-2" />
                        Instagram
                      </a>
                    </Button>
                  )}
                  {profileUser.youtubeUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={profileUser.youtubeUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        YouTube
                      </a>
                    </Button>
                  )}
                </div>

                {/* Interests/Languages */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {profileUser.languages?.map((language) => (
                    <Badge key={language} variant="secondary">{language}</Badge>
                  ))}
                  {profileUser.interests?.map((interest) => (
                    <Badge key={interest} variant="outline">{interest}</Badge>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {!isOwnProfile && (
                    <>
                      <FollowButton 
                        userId={userId}
                        isFollowing={isFollowing}
                        onFollowChange={setIsFollowing}
                      />
                      <Button variant="outline">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </>
                  )}
                  {isOwnProfile && (
                    <Button variant="outline" asChild>
                      <Link href="/profile">Edit Profile</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts" className="flex items-center space-x-2">
              <Grid className="w-4 h-4" />
              <span>Posts</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center space-x-2">
              <Camera className="w-4 h-4" />
              <span>Photos</span>
            </TabsTrigger>
            <TabsTrigger value="liked" className="flex items-center space-x-2">
              <Heart className="w-4 h-4" />
              <span>Liked</span>
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-6">
            {userPosts.length > 0 ? (
              <div className="space-y-6">
                {userPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile ? "Share your first travel experience!" : `${profileUser.displayName} hasn't posted anything yet.`}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {userPosts
                .filter(post => post.mediaUrls && post.mediaUrls.length > 0)
                .map((post) => (
                  <div key={post.id} className="aspect-square relative group cursor-pointer">
                    <img 
                      src={post.mediaUrls![0]}
                      alt="Post media"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-4 text-white">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">{Math.floor(Math.random() * 50) + 5}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">{Math.floor(Math.random() * 20) + 2}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            {userPosts.filter(post => post.mediaUrls && post.mediaUrls.length > 0).length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No photos yet</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile ? "Start sharing your travel photos!" : `${profileUser.displayName} hasn't shared any photos yet.`}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Liked Tab */}
          <TabsContent value="liked" className="space-y-6">
            <Card>
              <CardContent className="p-12 text-center">
                <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Liked posts</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile ? "Posts you like will appear here" : "This user's liked posts are private"}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}