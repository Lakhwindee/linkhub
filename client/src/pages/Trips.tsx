import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Clock, DollarSign, Plus, Search, Filter, Plane, Heart, MessageCircle } from "lucide-react";
import type { Trip, TripParticipant } from "@shared/schema";

export default function Trips() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [searchFilters, setSearchFilters] = useState({
    country: "",
    city: "",
    travelStyle: "",
    budget: "",
    tags: ""
  });

  const queryClient = useQueryClient();

  // Fetch all trips
  const { data: trips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips", searchFilters],
    retry: false,
  });

  // Create trip mutation
  const createTripMutation = useMutation({
    mutationFn: async (tripData: any) => {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(tripData),
      });
      if (!response.ok) throw new Error("Failed to create trip");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      setIsCreateModalOpen(false);
    },
  });

  // Join trip mutation
  const joinTripMutation = useMutation({
    mutationFn: async ({ tripId, message }: { tripId: string; message?: string }) => {
      const response = await fetch(`/api/trips/${tripId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error("Failed to join trip");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
    },
  });

  const handleCreateTrip = (formData: FormData) => {
    const tripData = {
      title: formData.get("title"),
      description: formData.get("description"),
      fromCountry: formData.get("fromCountry"),
      fromCity: formData.get("fromCity"),
      toCountry: formData.get("toCountry"),
      toCity: formData.get("toCity"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      maxTravelers: Number(formData.get("maxTravelers")),
      budget: formData.get("budget"),
      travelStyle: formData.get("travelStyle"),
      tags: formData.get("tags")?.toString().split(",").map(tag => tag.trim()).filter(Boolean) || [],
      meetupLocation: formData.get("meetupLocation"),
      requirements: formData.get("requirements"),
      isPublic: true,
      requiresApproval: formData.get("requiresApproval") === "on",
    };

    createTripMutation.mutate(tripData);
  };

  const handleJoinTrip = (tripId: string, message?: string) => {
    joinTripMutation.mutate({ tripId, message });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getBudgetIcon = (budget: string) => {
    switch (budget) {
      case 'low': return '💰';
      case 'medium': return '💰💰';
      case 'high': return '💰💰💰';
      default: return '💰';
    }
  };

  const getTravelStyleIcon = (style: string) => {
    switch (style) {
      case 'backpacker': return '🎒';
      case 'comfort': return '🏨';
      case 'luxury': return '✨';
      case 'adventure': return '🏔️';
      default: return '✈️';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading trips...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Trip Planning</h1>
          <p className="text-muted-foreground">Discover amazing trips and plan your next adventure</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Trip
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Trip</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleCreateTrip(new FormData(e.currentTarget));
            }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Trip Title *</Label>
                  <Input id="title" name="title" placeholder="Europe Photography Tour" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTravelers">Max Travelers</Label>
                  <Input id="maxTravelers" name="maxTravelers" type="number" defaultValue="6" min="2" max="20" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Tell others about your amazing trip plans..." rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromCountry">From Country *</Label>
                  <Input id="fromCountry" name="fromCountry" placeholder="United Kingdom" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromCity">From City *</Label>
                  <Input id="fromCity" name="fromCity" placeholder="London" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="toCountry">To Country *</Label>
                  <Input id="toCountry" name="toCountry" placeholder="Spain" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toCity">To City *</Label>
                  <Input id="toCity" name="toCity" placeholder="Barcelona" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input id="startDate" name="startDate" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input id="endDate" name="endDate" type="date" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget Level</Label>
                  <Select name="budget">
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">💰 Low Budget</SelectItem>
                      <SelectItem value="medium">💰💰 Medium Budget</SelectItem>
                      <SelectItem value="high">💰💰💰 High Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="travelStyle">Travel Style</Label>
                  <Select name="travelStyle">
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backpacker">🎒 Backpacker</SelectItem>
                      <SelectItem value="comfort">🏨 Comfort</SelectItem>
                      <SelectItem value="luxury">✨ Luxury</SelectItem>
                      <SelectItem value="adventure">🏔️ Adventure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input id="tags" name="tags" placeholder="photography, culture, food, nightlife" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meetupLocation">Meetup Location</Label>
                <Input id="meetupLocation" name="meetupLocation" placeholder="London Heathrow Terminal 2" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements/Notes</Label>
                <Textarea id="requirements" name="requirements" placeholder="Any special requirements or notes for travelers..." rows={2} />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTripMutation.isPending}>
                  {createTripMutation.isPending ? "Creating..." : "Create Trip"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Trips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Country"
              value={searchFilters.country}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, country: e.target.value }))}
            />
            <Input
              placeholder="City"
              value={searchFilters.city}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, city: e.target.value }))}
            />
            <Select value={searchFilters.budget} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, budget: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Budgets</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Select value={searchFilters.travelStyle} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, travelStyle: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Styles</SelectItem>
                <SelectItem value="backpacker">Backpacker</SelectItem>
                <SelectItem value="comfort">Comfort</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
                <SelectItem value="adventure">Adventure</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Tags"
              value={searchFilters.tags}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, tags: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => (
          <Card key={trip.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg line-clamp-2">{trip.title}</CardTitle>
                <Badge variant={trip.status === 'confirmed' ? 'default' : 'secondary'}>
                  {trip.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {trip.fromCity} → {trip.toCity}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">{trip.description}</p>
              
              <div className="flex flex-wrap gap-2">
                {trip.tags?.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {trip.tags && trip.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{trip.tags.length - 3}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{formatDate(trip.startDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{trip.currentTravelers}/{trip.maxTravelers}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span>{getBudgetIcon(trip.budget || 'medium')} {trip.budget}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-muted-foreground" />
                  <span>{getTravelStyleIcon(trip.travelStyle || 'comfort')} {trip.travelStyle}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleJoinTrip(trip.id)}
                  disabled={joinTripMutation.isPending || trip.currentTravelers >= trip.maxTravelers}
                >
                  {trip.currentTravelers >= trip.maxTravelers ? 'Full' : 'Join Trip'}
                </Button>
                <Button size="sm" variant="outline">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {trips.length === 0 && (
        <div className="text-center py-12">
          <Plane className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No trips found</h3>
          <p className="text-muted-foreground mb-4">Be the first to create an amazing trip!</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Trip
          </Button>
        </div>
      )}
    </div>
  );
}