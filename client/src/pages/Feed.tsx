import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ObjectUploader } from "@/components/ObjectUploader";
import { PostCard } from "@/components/PostCard";
import { AdCard } from "@/components/AdCard";
import { UserSearch } from "@/components/UserSearch";
import { Globe, Users, MapPin, Image, Video, Send, Filter, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPostSchema } from "@shared/schema";
import { z } from "zod";
import type { Post } from "@shared/schema";
import { Link } from "wouter";
import { worldCountries, statesByCountry, citiesByCountry } from "@/data/locationData";

type CreatePostData = z.infer<typeof insertPostSchema>;

export default function Feed() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("global");
  const [countryFilter, setCountryFilter] = useState("");

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

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CreatePostData>({
    resolver: zodResolver(insertPostSchema),
    defaultValues: {
      body: "",
      mediaType: "text",
      mediaUrls: [],
      visibility: "public",
      country: undefined,
      city: undefined,
    }
  });
  
  // Watch country to filter cities
  const selectedCountry = watch("country");
  
  // Get all cities for the selected country by aggregating from all states
  const availableCities = selectedCountry && statesByCountry[selectedCountry]
    ? statesByCountry[selectedCountry].flatMap(state => 
        citiesByCountry[`${selectedCountry}-${state}`] || []
      ).slice(0, 100) // Limit to 100 cities total
    : [];

  // Fetch posts
  const { data: posts = [], isLoading: postsLoading, error: postsError } = useQuery({
    queryKey: ["/api/feed", { tab: activeTab, country: countryFilter }],
    retry: false,
  });

  // Fetch ads for feed
  const { data: feedAds = [], isLoading: adsLoading } = useQuery({
    queryKey: ["/api/feed/ads", { country: countryFilter }],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/feed/ads?country=${countryFilter || ''}`);
      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache ads for 5 minutes
  });

  // Mix posts and ads for display
  const mixPostsWithAds = (posts: Post[], ads: any[]) => {
    if (!ads.length) return posts.map(post => ({ type: 'post', data: post }));
    
    const mixed: Array<{ type: 'post' | 'ad', data: any }> = [];
    const postItems = posts.map(post => ({ type: 'post' as const, data: post }));
    const adItems = ads.map(ad => ({ type: 'ad' as const, data: ad }));
    
    // Insert ads every 3-4 posts
    for (let i = 0; i < postItems.length; i++) {
      mixed.push(postItems[i]);
      
      // Insert an ad every 3 posts, but not after the last post
      if ((i + 1) % 3 === 0 && i < postItems.length - 1 && adItems.length > 0) {
        const adIndex = Math.floor((i + 1) / 3 - 1) % adItems.length;
        mixed.push(adItems[adIndex]);
      }
    }
    
    // If we have very few posts, add at least one ad at the beginning
    if (postItems.length <= 2 && adItems.length > 0) {
      mixed.unshift(adItems[0]);
    }
    
    return mixed;
  };

  // Handle unauthorized error
  useEffect(() => {
    if (postsError && isUnauthorizedError(postsError)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [postsError, toast]);

  const createPostMutation = useMutation({
    mutationFn: async (data: CreatePostData) => {
      return await apiRequest("POST", "/api/posts", data);
    },
    onSuccess: () => {
      toast({
        title: "Post Created",
        description: "Your post has been shared successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      reset();
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
        title: "Post Failed",
        description: error.message || "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

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
    if (result.successful && result.successful.length > 0) {
      const uploadedFiles = result.successful;
      try {
        const mediaUrls = [];
        for (const file of uploadedFiles) {
          const response = await apiRequest("PUT", "/api/media", {
            mediaUrl: file.uploadURL
          });
          const { objectPath } = await response.json();
          mediaUrls.push(objectPath);
        }
        
        setValue("mediaUrls", mediaUrls);
        setValue("mediaType", uploadedFiles[0].type?.startsWith("video/") ? "video" : "image");
        
        toast({
          title: "Media Uploaded",
          description: "Your media has been uploaded successfully.",
        });
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: "Failed to process uploaded media. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = (data: CreatePostData) => {
    createPostMutation.mutate(data);
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

  const watchedValues = watch();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2" data-testid="heading-feed">
              <Globe className="w-8 h-8 text-accent" />
              <span>Global Feed</span>
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-feed-subtitle">
              Share your journey and discover stories from travelers worldwide
            </p>
          </div>
        </div>

        {/* Create Post */}
        <Card data-testid="card-create-post">
          <CardHeader>
            <CardTitle>Create New Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Textarea
                {...register("body")}
                placeholder="Share your travel experience..."
                rows={4}
                className="resize-none"
                data-testid="textarea-post-body"
              />
              {errors.body && (
                <p className="text-sm text-destructive" data-testid="error-post-body">
                  {errors.body.message}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  value={watchedValues.visibility || "public"}
                  onValueChange={(value) => setValue("visibility", value as "public" | "followers" | "private")}
                >
                  <SelectTrigger data-testid="select-post-visibility">
                    <SelectValue placeholder="Visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">🌍 Public</SelectItem>
                    <SelectItem value="followers">👥 Followers Only</SelectItem>
                    <SelectItem value="private">🔒 Private</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={watchedValues.country || ""}
                  onValueChange={(value) => setValue("country", value)}
                >
                  <SelectTrigger data-testid="select-post-country">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Location</SelectItem>
                    {/* Real-world countries (250+ with flags) */}
                    {worldCountries.map((country) => (
                      <SelectItem key={country.name} value={country.name}>
                        {country.flag} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={watchedValues.city || ""}
                  onValueChange={(value) => setValue("city", value)}
                  disabled={!selectedCountry}
                >
                  <SelectTrigger data-testid="select-post-city">
                    <SelectValue placeholder={selectedCountry ? "Select City" : "Select Country First"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No City</SelectItem>
                    {availableCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <ObjectUploader
                    maxNumberOfFiles={4}
                    maxFileSize={10 * 1024 * 1024} // 10MB
                    onGetUploadParameters={handleMediaUpload}
                    onComplete={handleMediaComplete}
                    buttonClassName="bg-muted hover:bg-muted/80 text-muted-foreground"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Add Photos
                  </ObjectUploader>

                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={50 * 1024 * 1024} // 50MB
                    onGetUploadParameters={handleMediaUpload}
                    onComplete={handleMediaComplete}
                    buttonClassName="bg-muted hover:bg-muted/80 text-muted-foreground"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Add Video
                  </ObjectUploader>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    type="submit" 
                    disabled={createPostMutation.isPending || !watchedValues.body?.trim()}
                    data-testid="button-submit-post"
                  >
                    {createPostMutation.isPending ? (
                      <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Post
                  </Button>
                </div>
              </div>

              {watchedValues.mediaUrls && watchedValues.mediaUrls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploaded Media:</p>
                  <div className="text-sm text-muted-foreground">
                    {watchedValues.mediaUrls.length} file(s) uploaded
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Feed Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="global" data-testid="tab-global">
                <Globe className="w-4 h-4 mr-2" />
                Global
              </TabsTrigger>
              <TabsTrigger value="following" data-testid="tab-following">
                <Users className="w-4 h-4 mr-2" />
                Following
              </TabsTrigger>
              <TabsTrigger value="search" data-testid="tab-search">
                <Search className="w-4 h-4 mr-2" />
                Search Users
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-48" data-testid="select-country-filter">
                  <SelectValue placeholder="Filter by country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {/* Real-world countries (250+ with flags) */}
                  {worldCountries.map((country) => (
                    <SelectItem key={country.name} value={country.name}>
                      {country.flag} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="global" className="space-y-6">
            <div className="space-y-4">
              {postsLoading ? (
                <div className="space-y-6">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-muted rounded-full"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-32"></div>
                            <div className="h-3 bg-muted rounded w-24"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-full"></div>
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (posts as Post[]).length > 0 ? (
                <div className="space-y-6">
                  {mixPostsWithAds(posts as Post[], feedAds).map((item, index) => (
                    <div key={item.type === 'post' ? `post-${item.data.id}` : `ad-${item.data.id}-${index}`}>
                      {item.type === 'post' ? (
                        <PostCard post={item.data} />
                      ) : (
                        <AdCard ad={item.data} />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Card data-testid="card-no-posts">
                  <CardContent className="p-12 text-center">
                    <Globe className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
                    <p className="text-muted-foreground">
                      Be the first to share your travel experience with the community using the form above!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>


          <TabsContent value="following" className="space-y-6">
            <div className="space-y-4">
              {postsLoading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-muted rounded-full"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-32"></div>
                            <div className="h-3 bg-muted rounded w-24"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-full"></div>
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (posts as Post[]).length > 0 ? (
                <div className="space-y-6">
                  {mixPostsWithAds(posts as Post[], feedAds).map((item, index) => (
                    <div key={item.type === 'post' ? `following-post-${item.data.id}` : `following-ad-${item.data.id}-${index}`}>
                      {item.type === 'post' ? (
                        <PostCard post={item.data} />
                      ) : (
                        <AdCard ad={item.data} />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Card data-testid="card-following-posts">
                  <CardContent className="p-12 text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No posts from followed users</h3>
                    <p className="text-muted-foreground mb-6">
                      Follow other travelers to see their posts here.
                    </p>
                    <Button variant="outline" asChild data-testid="button-discover-travelers">
                      <Link href="/discover-travelers">Discover Travelers</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-accent" />
                  <span>Search Users</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UserSearch />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
