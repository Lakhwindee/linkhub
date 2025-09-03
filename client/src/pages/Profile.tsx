import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ObjectUploader } from "@/components/ObjectUploader";
import { FollowStats } from "@/components/FollowButton";
import { User, MapPin, Globe, Instagram, Youtube, Settings, Save, Upload, Eye, EyeOff, Plane, Calendar, Clock, Users, Edit, Trash2, Play, Star, Shield, AlertCircle, CheckCircle, Copy } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserProfileSchema } from "@shared/schema";
import { z } from "zod";

type ProfileFormData = z.infer<typeof insertUserProfileSchema>;


// My Trips Component
function MyTripsSection({ user }: { user: any }) {
  const { data: userTrips = [], isLoading } = useQuery({
    queryKey: [`/api/users/${user.id}/trips`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${user.id}/trips`, {
        headers: { "x-demo-user": "true" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch trips");
      return response.json();
    },
  });

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5" />
            My Created Trips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="w-5 h-5" />
          My Created Trips ({userTrips.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {userTrips.length === 0 ? (
          <div className="text-center py-12">
            <Plane className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No trips created yet</h3>
            <p className="text-muted-foreground mb-4">Start planning your first amazing journey!</p>
            <Button onClick={() => window.location.href = '/trips'}>
              <Plane className="w-4 h-4 mr-2" />
              Create Your First Trip
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {userTrips.map((trip: any) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Trip Card Component
function TripCard({ trip }: { trip: any }) {
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="border rounded-lg p-6 bg-card hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">{trip.title}</h3>
            <Badge variant={trip.status === 'confirmed' ? 'default' : 'secondary'}>
              {trip.status || 'Draft'}
            </Badge>
          </div>
          
          <p className="text-muted-foreground mb-3 line-clamp-2">
            {trip.description || 'No description provided'}
          </p>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{trip.fromCountry} → {trip.toCountry}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{trip.currentTravelers || 1}/{trip.maxTravelers} travelers</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{trip.travelStyle}</span>
            </div>
          </div>

          {/* Multi-Country Itinerary Preview */}
          {trip.itinerary && trip.itinerary.length > 0 && (
            <div className="mt-3 p-3 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Multi-Country Itinerary:</h4>
              <div className="flex flex-wrap gap-2">
                {trip.itinerary.map((dest: any, index: number) => (
                  <div key={index} className="flex items-center gap-1 text-xs bg-primary/10 px-2 py-1 rounded">
                    <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                      {index + 1}
                    </span>
                    <span>{dest.country}, {dest.city}</span>
                    <span className="text-muted-foreground">({dest.duration}d)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 md:w-auto w-full">
          <Button variant="outline" size="sm" className="w-full md:w-auto">
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
          <Button variant="outline" size="sm" className="w-full md:w-auto">
            <Edit className="w-4 h-4 mr-2" />
            Edit Trip
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

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

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(insertUserProfileSchema),
    defaultValues: user ? {
      username: user.username || "",
      displayName: user.displayName || "",
      bio: user.bio || "",
      country: user.country || "",
      city: user.city || "",
      homeCountry: user.homeCountry || "",
      homeCity: user.homeCity || "",
      languages: user.languages || [],
      interests: user.interests || [],
      instagramUrl: user.instagramUrl || "",
      youtubeUrl: user.youtubeUrl || "",
      tiktokUrl: user.tiktokUrl || "",
      showOnMap: user.showOnMap ?? true,
      locationRadius: user.locationRadius || 5,
      canDmMe: user.canDmMe || "all",
    } : {}
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return await apiRequest("PATCH", "/api/me", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
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
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAvatarUpload = async () => {
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

  const handleAvatarComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      try {
        await apiRequest("PUT", "/api/media", {
          mediaUrl: uploadedFile.uploadURL
        });
        toast({
          title: "Avatar Updated",
          description: "Your profile picture has been updated.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: "Failed to update avatar. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
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
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2" data-testid="heading-profile">
              <User className="w-8 h-8 text-accent" />
              <span>Profile Settings</span>
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-profile-subtitle">
              Manage your personal information and privacy settings
            </p>
            <div className="mt-3">
              <FollowStats userId={user.id} />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" data-testid="badge-plan">
              {user.plan} Plan
            </Badge>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} data-testid="button-edit-profile">
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit(onSubmit)}
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {updateProfileMutation.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className={`grid w-full ${user?.role === 'publisher' ? 'grid-cols-3' : 'grid-cols-6'}`}>
            <TabsTrigger value="basic" data-testid="tab-basic">Basic Info</TabsTrigger>
            <TabsTrigger value="location" data-testid="tab-location">Location</TabsTrigger>
            {user?.role !== 'publisher' && (
              <>
                <TabsTrigger value="social" data-testid="tab-social">Social Links</TabsTrigger>
              </>
            )}
            <TabsTrigger value="privacy" data-testid="tab-privacy">Privacy</TabsTrigger>
            {user?.role !== 'publisher' && (
              <TabsTrigger value="trips" data-testid="tab-trips">My Trips</TabsTrigger>
            )}
          </TabsList>

          {/* Basic Information */}
          <TabsContent value="basic">
            <Card data-testid="card-basic-info">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center space-x-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={user.avatarUrl || user.profileImageUrl || ""} />
                    <AvatarFallback className="text-2xl" data-testid="text-avatar-initials">
                      {(user.displayName || user.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">Profile Picture</h3>
                    <p className="text-sm text-muted-foreground">Upload a new profile picture</p>
                    {isEditing && (
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={5 * 1024 * 1024} // 5MB
                        onGetUploadParameters={handleAvatarUpload}
                        onComplete={handleAvatarComplete}
                        buttonClassName="bg-accent hover:bg-accent/90"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo
                      </ObjectUploader>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      {...register("username")}
                      disabled={!isEditing}
                      placeholder="Enter username"
                      data-testid="input-username"
                    />
                    {errors.username && (
                      <p className="text-sm text-destructive" data-testid="error-username">
                        {errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      {...register("displayName")}
                      disabled={!isEditing}
                      placeholder="Enter display name"
                      data-testid="input-display-name"
                    />
                    {errors.displayName && (
                      <p className="text-sm text-destructive" data-testid="error-display-name">
                        {errors.displayName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    {...register("bio")}
                    disabled={!isEditing}
                    placeholder="Tell others about yourself and your travel interests..."
                    rows={4}
                    data-testid="textarea-bio"
                  />
                  {errors.bio && (
                    <p className="text-sm text-destructive" data-testid="error-bio">
                      {errors.bio.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="languages">Languages</Label>
                    <Input
                      id="languages"
                      value={watchedValues.languages?.join(", ") || ""}
                      onChange={(e) => setValue("languages", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                      disabled={!isEditing}
                      placeholder="English, Spanish, French..."
                      data-testid="input-languages"
                    />
                    <p className="text-xs text-muted-foreground">Separate languages with commas</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interests">Interests</Label>
                    <Input
                      id="interests"
                      value={watchedValues.interests?.join(", ") || ""}
                      onChange={(e) => setValue("interests", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                      disabled={!isEditing}
                      placeholder="Photography, Hiking, Food..."
                      data-testid="input-interests"
                    />
                    <p className="text-xs text-muted-foreground">Separate interests with commas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location */}
          <TabsContent value="location">
            <Card data-testid="card-location">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Location Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="country">Current Country</Label>
                    <Input
                      id="country"
                      {...register("country")}
                      disabled={!isEditing}
                      placeholder="United Kingdom"
                      data-testid="input-country"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Current City</Label>
                    <Input
                      id="city"
                      {...register("city")}
                      disabled={!isEditing}
                      placeholder="London"
                      data-testid="input-city"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="homeCountry">Home Country</Label>
                    <Input
                      id="homeCountry"
                      {...register("homeCountry")}
                      disabled={!isEditing}
                      placeholder="Your home country"
                      data-testid="input-home-country"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="homeCity">Home City</Label>
                    <Input
                      id="homeCity"
                      {...register("homeCity")}
                      disabled={!isEditing}
                      placeholder="Your home city"
                      data-testid="input-home-city"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Links - Only for non-publisher roles */}
          {user?.role !== 'publisher' && (
            <TabsContent value="social">
              <Card data-testid="card-social">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="w-5 h-5" />
                    <span>Social Media Links</span>
                  </CardTitle>
                </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="instagramUrl" className="flex items-center space-x-2">
                    <Instagram className="w-4 h-4" />
                    <span>Instagram</span>
                  </Label>
                  <Input
                    id="instagramUrl"
                    {...register("instagramUrl")}
                    disabled={!isEditing}
                    placeholder="https://instagram.com/yourusername"
                    data-testid="input-instagram"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtubeUrl" className="flex items-center space-x-2">
                    <Youtube className="w-4 h-4" />
                    <span>YouTube</span>
                  </Label>
                  <Input
                    id="youtubeUrl"
                    {...register("youtubeUrl")}
                    disabled={!isEditing}
                    placeholder="https://youtube.com/c/yourchannel"
                    data-testid="input-youtube"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiktokUrl" className="flex items-center space-x-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.589 6.686a4.793 4.793 0 01-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 01-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 013.183-4.51v-3.5a6.329 6.329 0 00-5.394 10.692 6.33 6.33 0 10.211-11.07C8.91 8.892 8.91 8.892 8.91 8.892v3.183a3.688 3.688 0 00-1.849.043 3.688 3.688 0 013.688 3.688A3.688 3.688 0 0014.437 19h.295a3.701 3.701 0 00-.295-1.47V5.67a7.778 7.778 0 005.152 1.016z"/>
                    </svg>
                    <span>TikTok</span>
                  </Label>
                  <Input
                    id="tiktokUrl"
                    {...register("tiktokUrl")}
                    disabled={!isEditing}
                    placeholder="https://tiktok.com/@yourusername"
                    data-testid="input-tiktok"
                  />
                </div>
              </CardContent>
            </Card>
            </TabsContent>
          )}

          {/* Privacy Settings */}
          <TabsContent value="privacy">
            <Card data-testid="card-privacy">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Privacy Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {watchedValues.showOnMap ? (
                        <Eye className="w-4 h-4 text-green-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-red-500" />
                      )}
                      <Label htmlFor="showOnMap">Show on Map</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Allow other travelers to discover you on the map
                    </p>
                  </div>
                  <Switch
                    id="showOnMap"
                    checked={watchedValues.showOnMap}
                    onCheckedChange={(checked) => setValue("showOnMap", checked)}
                    disabled={!isEditing}
                    data-testid="switch-show-on-map"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationRadius">Location Precision (km radius)</Label>
                  <Select
                    value={watchedValues.locationRadius?.toString()}
                    onValueChange={(value) => setValue("locationRadius", parseInt(value))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger data-testid="select-location-radius">
                      <SelectValue placeholder="Select radius" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 km (Precise)</SelectItem>
                      <SelectItem value="5">5 km (Neighborhood)</SelectItem>
                      <SelectItem value="10">10 km (City area)</SelectItem>
                      <SelectItem value="25">25 km (Greater area)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Your exact location will be hidden within this radius
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="canDmMe">Who can message me</Label>
                  <Select
                    value={watchedValues.canDmMe}
                    onValueChange={(value) => setValue("canDmMe", value as "all" | "followers" | "none")}
                    disabled={!isEditing}
                  >
                    <SelectTrigger data-testid="select-dm-permissions">
                      <SelectValue placeholder="Select permission" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Anyone</SelectItem>
                      <SelectItem value="followers">Followers only</SelectItem>
                      <SelectItem value="none">No one</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Control who can send you direct messages
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* My Trips - Only for non-publisher roles */}
          {user?.role !== 'publisher' && (
            <TabsContent value="trips">
              <MyTripsSection user={user} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
