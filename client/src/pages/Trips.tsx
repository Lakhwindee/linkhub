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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, MapPin, Users, Clock, DollarSign, Plus, Search, Filter, Plane, Heart, MessageCircle,
  ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Bed, Car, Camera, Utensils,
  FileText, Backpack, Cloud, Phone, Shield, Star, Eye, EyeOff, X
} from "lucide-react";
import type { Trip, TripParticipant } from "@shared/schema";

interface TripWithDetails extends Omit<Trip, 'itinerary'> {
  itinerary?: any[];
  accommodations?: any;
  transportation?: any;
  budgetBreakdown?: any;
  activities?: any;
  documents?: string[];
  packingList?: string[];
  weatherInfo?: any;
  emergencyContacts?: any;
}

export default function Trips() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripWithDetails | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'detailed'>('grid');
  const [searchFilters, setSearchFilters] = useState({
    country: "",
    city: "",
    travelStyle: "",
    budget: "",
    tags: ""
  });
  const [itineraryDestinations, setItineraryDestinations] = useState([
    { country: '', city: '', startDate: '', endDate: '', duration: 1 }
  ]);

  const queryClient = useQueryClient();

  // Fetch all trips
  const { data: trips = [], isLoading } = useQuery<TripWithDetails[]>({
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

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // "08:00" from "08:00:00"
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'transport': return <Car className="w-4 h-4" />;
      case 'accommodation': return <Bed className="w-4 h-4" />;
      case 'activity': return <Camera className="w-4 h-4" />;
      case 'meal': return <Utensils className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
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

  const TripCard = ({ trip }: { trip: TripWithDetails }) => (
    <Card className="hover:shadow-lg transition-all duration-200 group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {trip.title}
          </CardTitle>
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
            <span>{trip.currentTravelers || 1}/{trip.maxTravelers || 10}</span>
          </div>
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-muted-foreground" />
            <span>{getTravelStyleIcon(trip.travelStyle || 'comfort')} {trip.travelStyle}</span>
          </div>
        </div>

        {trip.budgetBreakdown && (
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm font-medium mb-1">Budget Overview</div>
            <div className="text-2xl font-bold text-primary">
              {trip.budgetBreakdown.currency} {trip.budgetBreakdown.total.toLocaleString()}
              {trip.budgetBreakdown.perPerson && <span className="text-sm font-normal"> per person</span>}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => joinTripMutation.mutate({ tripId: trip.id })}
            disabled={joinTripMutation.isPending || (trip.currentTravelers || 1) >= (trip.maxTravelers || 10)}
          >
            {(trip.currentTravelers || 1) >= (trip.maxTravelers || 10) ? 'Full' : 'Join Trip'}
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setSelectedTrip(trip)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const DetailedTripView = ({ trip }: { trip: TripWithDetails }) => (
    <Dialog open={!!selectedTrip} onOpenChange={() => setSelectedTrip(null)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl">{trip.title}</DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {trip.fromCity} → {trip.toCity}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {trip.currentTravelers}/{trip.maxTravelers} travelers
            </div>
          </div>
        </DialogHeader>
        
        <div className="overflow-y-auto">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
              <TabsTrigger value="accommodation">Stays</TabsTrigger>
              <TabsTrigger value="transport">Transport</TabsTrigger>
              <TabsTrigger value="essentials">Essentials</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="prose max-w-none">
                <p>{trip.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Trip Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">
                        {Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Travel Style:</span>
                      <span className="font-medium">{getTravelStyleIcon(trip.travelStyle || '')} {trip.travelStyle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Budget Level:</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={trip.status === 'confirmed' ? 'default' : 'secondary'}>
                        {trip.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {trip.activities && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Planned Activities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {Object.entries(trip.activities).map(([category, activities]) => (
                        <div key={category} className="mb-3">
                          <div className="font-medium capitalize mb-2">{category}</div>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            {(activities as string[]).map((activity, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3 h-3 mt-1 text-green-500" />
                                {activity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="itinerary" className="space-y-4">
              {trip.itinerary && trip.itinerary.length > 0 ? (
                <div className="space-y-4">
                  {trip.itinerary.map((day, dayIndex) => (
                    <Card key={dayIndex}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Day {day.day} - {formatDate(day.date)}
                        </CardTitle>
                        <div className="text-sm text-muted-foreground">{day.city}</div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {day.activities?.map((activity: any, actIndex: number) => (
                            <div key={actIndex} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2 min-w-16">
                                {getActivityIcon(activity.type)}
                                <span className="text-sm font-mono">{formatTime(activity.time)}</span>
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{activity.title}</div>
                                <Badge variant="outline" className="text-xs mt-1 capitalize">
                                  {activity.type}
                                </Badge>
                              </div>
                            </div>
                          ))}
                          
                          {day.accommodation && (
                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                              <div className="flex items-center gap-2 font-medium">
                                <Bed className="w-4 h-4" />
                                Accommodation: {day.accommodation.name}
                              </div>
                              {day.accommodation.checkIn && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  Check-in: {day.accommodation.checkIn} | Check-out: {day.accommodation.checkOut}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {day.notes && (
                            <div className="text-sm text-muted-foreground italic border-l-2 border-primary pl-3">
                              {day.notes}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Detailed itinerary will be available once finalized</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="budget" className="space-y-4">
              {trip.budgetBreakdown ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Budget Breakdown</CardTitle>
                      <div className="text-3xl font-bold text-primary">
                        {trip.budgetBreakdown.currency} {trip.budgetBreakdown.total.toLocaleString()}
                        {trip.budgetBreakdown.perPerson && <span className="text-lg font-normal"> per person</span>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(trip.budgetBreakdown).map(([category, amount]) => {
                          if (['total', 'currency', 'perPerson'].includes(category)) return null;
                          return (
                            <div key={category} className="flex justify-between items-center">
                              <span className="capitalize">{category}:</span>
                              <span className="font-medium">
                                {trip.budgetBreakdown.currency} {(amount as number).toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Budget breakdown will be shared with confirmed participants</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="accommodation" className="space-y-4">
              {trip.accommodations ? (
                <div className="space-y-4">
                  {Object.entries(trip.accommodations).map(([city, details]: [string, any]) => (
                    <Card key={city}>
                      <CardHeader>
                        <CardTitle className="text-lg">{city}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Hotel:</span>
                            <span className="font-medium">{details.hotel}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Check-in:</span>
                            <span>{formatDate(details.checkIn)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Check-out:</span>
                            <span>{formatDate(details.checkOut)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Nights:</span>
                            <span>{details.nights}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Room Type:</span>
                            <span>{details.roomType}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-medium">
                            <span>Total Cost:</span>
                            <span>£{details.totalCost}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bed className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Accommodation details will be shared soon</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="transport" className="space-y-4">
              {trip.transportation ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Outbound Flight</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Route:</span>
                          <span className="font-medium">{trip.transportation.outbound?.from} → {trip.transportation.outbound?.to}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Date & Time:</span>
                          <span>{formatDate(trip.transportation.outbound?.date)} at {trip.transportation.outbound?.time}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Airline:</span>
                          <span>{trip.transportation.outbound?.airline} {trip.transportation.outbound?.flightNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cost:</span>
                          <span>£{trip.transportation.outbound?.cost}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Return Flight</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Route:</span>
                          <span className="font-medium">{trip.transportation.return?.from} → {trip.transportation.return?.to}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Date & Time:</span>
                          <span>{formatDate(trip.transportation.return?.date)} at {trip.transportation.return?.time}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Airline:</span>
                          <span>{trip.transportation.return?.airline} {trip.transportation.return?.flightNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cost:</span>
                          <span>£{trip.transportation.return?.cost}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Car className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Transportation details will be confirmed soon</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="essentials" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trip.documents && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Required Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {trip.documents.map((doc, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {trip.packingList && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Backpack className="w-5 h-5" />
                        Packing List
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {trip.packingList.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {trip.weatherInfo && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Cloud className="w-5 h-5" />
                        Weather Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(trip.weatherInfo).map(([city, weather]: [string, any]) => (
                          <div key={city}>
                            <div className="font-medium">{city}</div>
                            <div className="text-sm text-muted-foreground">
                              {weather.temp} • {weather.conditions}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {trip.emergencyContacts && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Phone className="w-5 h-5" />
                        Emergency Contacts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {trip.emergencyContacts.tourLeader && (
                          <div>
                            <div className="font-medium">Tour Leader</div>
                            <div className="text-sm text-muted-foreground">
                              {trip.emergencyContacts.tourLeader.name}: {trip.emergencyContacts.tourLeader.phone}
                            </div>
                          </div>
                        )}
                        {trip.emergencyContacts.localEmergency && (
                          <div>
                            <div className="font-medium">Local Emergency</div>
                            <div className="text-sm text-muted-foreground">
                              {Object.entries(trip.emergencyContacts.localEmergency).map(([location, number]) => (
                                <div key={location}>{location}: {number as string}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Professional Trip Planning</h1>
          <p className="text-muted-foreground">Discover detailed trip itineraries and join expertly planned adventures</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'detailed' : 'grid')}>
            {viewMode === 'grid' ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
            {viewMode === 'grid' ? 'Detailed View' : 'Grid View'}
          </Button>
          
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
                const formData = new FormData(e.currentTarget);
                const tripData = {
                  title: formData.get("title"),
                  description: formData.get("description"),
                  fromCountry: itineraryDestinations[0]?.country || "",
                  fromCity: itineraryDestinations[0]?.city || "",
                  toCountry: itineraryDestinations[itineraryDestinations.length - 1]?.country || "",
                  toCity: itineraryDestinations[itineraryDestinations.length - 1]?.city || "",
                  startDate: itineraryDestinations[0]?.startDate || formData.get("startDate"),
                  endDate: itineraryDestinations[itineraryDestinations.length - 1]?.endDate || formData.get("endDate"),
                  maxTravelers: Number(formData.get("maxTravelers")),
                  travelStyle: formData.get("travelStyle"),
                  tags: formData.get("tags")?.toString().split(",").map(tag => tag.trim()).filter(Boolean) || [],
                  meetupLocation: formData.get("meetupLocation"),
                  requirements: formData.get("requirements"),
                  isPublic: true,
                  requiresApproval: formData.get("requiresApproval") === "on",
                  itinerary: itineraryDestinations.filter(dest => dest.country && dest.city),
                };
                createTripMutation.mutate(tripData);
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

                {/* Multi-Destination Itinerary Builder */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">Trip Itinerary (Country to Country)</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setItineraryDestinations([...itineraryDestinations, { country: '', city: '', startDate: '', endDate: '', duration: 1 }])}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Destination
                    </Button>
                  </div>
                  
                  <div className="space-y-4 max-h-64 overflow-y-auto border rounded-lg p-4">
                    {itineraryDestinations.map((destination, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-muted/50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium">Destination {index + 1}</span>
                          {itineraryDestinations.length > 1 && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setItineraryDestinations(itineraryDestinations.filter((_, i) => i !== index))}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="space-y-2">
                            <Label>Country *</Label>
                            <Input 
                              placeholder="e.g., United Kingdom"
                              value={destination.country}
                              onChange={(e) => {
                                const updated = [...itineraryDestinations];
                                updated[index].country = e.target.value;
                                setItineraryDestinations(updated);
                              }}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>City *</Label>
                            <Input 
                              placeholder="e.g., London"
                              value={destination.city}
                              onChange={(e) => {
                                const updated = [...itineraryDestinations];
                                updated[index].city = e.target.value;
                                setItineraryDestinations(updated);
                              }}
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label>Start Date *</Label>
                            <Input 
                              type="date"
                              value={destination.startDate}
                              onChange={(e) => {
                                const updated = [...itineraryDestinations];
                                updated[index].startDate = e.target.value;
                                setItineraryDestinations(updated);
                              }}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>End Date *</Label>
                            <Input 
                              type="date"
                              value={destination.endDate}
                              onChange={(e) => {
                                const updated = [...itineraryDestinations];
                                updated[index].endDate = e.target.value;
                                setItineraryDestinations(updated);
                              }}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Duration (days)</Label>
                            <Input 
                              type="number"
                              min="1"
                              value={destination.duration}
                              onChange={(e) => {
                                const updated = [...itineraryDestinations];
                                updated[index].duration = Number(e.target.value);
                                setItineraryDestinations(updated);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
      </div>

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Find Your Perfect Trip
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
            <Select value={searchFilters.budget} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, budget: value === "all" ? "" : value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Budgets</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Select value={searchFilters.travelStyle} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, travelStyle: value === "all" ? "" : value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Styles</SelectItem>
                <SelectItem value="backpacker">Backpacker</SelectItem>
                <SelectItem value="comfort">Comfort</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
                <SelectItem value="adventure">Adventure</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Tags (e.g. photography)"
              value={searchFilters.tags}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, tags: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>

      {/* Trip Details Modal */}
      {selectedTrip && <DetailedTripView trip={selectedTrip} />}

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