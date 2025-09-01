import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EventCard } from "@/components/EventCard";
import { Calendar, Plus, MapPin, Users, Clock, Filter, Search, CalendarDays, PartyPopper } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import type { Event } from "@shared/schema";

type CreateEventData = z.infer<typeof insertEventSchema>;

export default function Events() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
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

  // Check plan access for event creation
  const canCreateEvents = user?.plan !== 'free';

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CreateEventData>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "meetup",
      visibility: "public",
      startsAt: new Date(),
    }
  });

  // Fetch events
  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ["/api/events"],
    retry: false,
  });

  // Handle unauthorized error
  useEffect(() => {
    if (eventsError && isUnauthorizedError(eventsError)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [eventsError, toast]);

  const createEventMutation = useMutation({
    mutationFn: async (data: CreateEventData) => {
      return await apiRequest("POST", "/api/events", data);
    },
    onSuccess: () => {
      toast({
        title: "Event Created",
        description: "Your event has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      reset();
      setIsCreateEventOpen(false);
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
        title: "Event Creation Failed",
        description: error.message || "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateEventData) => {
    createEventMutation.mutate(data);
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

  const filteredEvents = events.filter((event: Event) => {
    const matchesSearch = !searchQuery || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !typeFilter || event.type === typeFilter;
    const matchesCountry = !countryFilter || event.country === countryFilter;

    return matchesSearch && matchesType && matchesCountry;
  });

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meetup':
        return Users;
      case 'tour':
        return MapPin;
      case 'collab':
        return Calendar;
      case 'party':
        return PartyPopper;
      default:
        return CalendarDays;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2" data-testid="heading-events">
              <Calendar className="w-8 h-8 text-accent" />
              <span>Travel Events</span>
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-events-subtitle">
              Discover meetups, tours, and collaborations with fellow travelers
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {!canCreateEvents && (
              <Badge variant="outline" className="text-xs" data-testid="badge-upgrade-needed">
                Upgrade to create events
              </Badge>
            )}
            {canCreateEvents ? (
              <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-accent hover:bg-accent/90" data-testid="button-create-event">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Event Title</Label>
                      <Input
                        id="title"
                        {...register("title")}
                        placeholder="Travel Photography Meetup"
                        data-testid="input-event-title"
                      />
                      {errors.title && (
                        <p className="text-sm text-destructive" data-testid="error-event-title">
                          {errors.title.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        {...register("description")}
                        placeholder="Join us for an amazing photography session around the city..."
                        rows={3}
                        data-testid="textarea-event-description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Event Type</Label>
                        <Select
                          value={watchedValues.type}
                          onValueChange={(value) => setValue("type", value as any)}
                        >
                          <SelectTrigger data-testid="select-event-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="meetup">Meetup</SelectItem>
                            <SelectItem value="tour">Tour</SelectItem>
                            <SelectItem value="collab">Collaboration</SelectItem>
                            <SelectItem value="party">Party</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          {...register("capacity", { valueAsNumber: true })}
                          placeholder="20"
                          data-testid="input-event-capacity"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          {...register("country")}
                          placeholder="United Kingdom"
                          data-testid="input-event-country"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          {...register("city")}
                          placeholder="London"
                          data-testid="input-event-city"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="venue">Venue</Label>
                      <Input
                        id="venue"
                        {...register("venue")}
                        placeholder="Hyde Park, Speaker's Corner"
                        data-testid="input-event-venue"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startsAt">Start Date & Time</Label>
                        <Input
                          id="startsAt"
                          type="datetime-local"
                          {...register("startsAt", { valueAsDate: true })}
                          data-testid="input-event-start"
                        />
                        {errors.startsAt && (
                          <p className="text-sm text-destructive" data-testid="error-event-start">
                            {errors.startsAt.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endsAt">End Date & Time</Label>
                        <Input
                          id="endsAt"
                          type="datetime-local"
                          {...register("endsAt", { valueAsDate: true })}
                          data-testid="input-event-end"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="visibility">Visibility</Label>
                      <Select
                        value={watchedValues.visibility}
                        onValueChange={(value) => setValue("visibility", value as any)}
                      >
                        <SelectTrigger data-testid="select-event-visibility">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">🌍 Public - Anyone can see and join</SelectItem>
                          <SelectItem value="followers">👥 Followers Only</SelectItem>
                          <SelectItem value="invite-only">🔒 Invite Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateEventOpen(false)}
                        data-testid="button-cancel-event"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createEventMutation.isPending}
                        className="bg-accent hover:bg-accent/90"
                        data-testid="button-submit-event"
                      >
                        {createEventMutation.isPending ? (
                          <div className="animate-spin w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full mr-2" />
                        ) : (
                          <Calendar className="w-4 h-4 mr-2" />
                        )}
                        Create Event
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            ) : (
              <Button asChild data-testid="button-upgrade-for-events">
                <a href="/subscribe">Upgrade to Create Events</a>
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <Card data-testid="card-event-filters">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search events by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-events"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-event-type-filter">
                  <SelectValue placeholder="Event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="meetup">Meetup</SelectItem>
                  <SelectItem value="tour">Tour</SelectItem>
                  <SelectItem value="collab">Collaboration</SelectItem>
                  <SelectItem value="party">Party</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-event-country-filter">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="IN">India</SelectItem>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="JP">Japan</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              <Clock className="w-4 h-4 mr-2" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="my-events" data-testid="tab-my-events">
              <Users className="w-4 h-4 mr-2" />
              My Events
            </TabsTrigger>
            <TabsTrigger value="attending" data-testid="tab-attending">
              <CalendarDays className="w-4 h-4 mr-2" />
              Attending
            </TabsTrigger>
          </TabsList>

          {/* Upcoming Events */}
          <TabsContent value="upcoming" className="space-y-6">
            {eventsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6 space-y-4">
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded w-full"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="space-y-6">
                {filteredEvents.map((event: Event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <Card data-testid="card-no-upcoming-events">
                <CardContent className="p-12 text-center">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No upcoming events</h3>
                  <p className="text-muted-foreground mb-6">
                    {canCreateEvents 
                      ? "Be the first to create an event in your area!"
                      : "Upgrade to Traveler plan to create and join events."
                    }
                  </p>
                  {canCreateEvents ? (
                    <Button 
                      onClick={() => setIsCreateEventOpen(true)}
                      className="bg-accent hover:bg-accent/90"
                      data-testid="button-create-first-event"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Event
                    </Button>
                  ) : (
                    <Button asChild data-testid="button-upgrade-for-events-empty">
                      <a href="/subscribe">Upgrade Plan</a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* My Events */}
          <TabsContent value="my-events" className="space-y-6">
            <Card data-testid="card-my-events">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No hosted events</h3>
                <p className="text-muted-foreground mb-6">
                  {canCreateEvents 
                    ? "You haven't created any events yet. Start organizing your first travel event!"
                    : "Upgrade to Traveler plan to create and host events."
                  }
                </p>
                {canCreateEvents ? (
                  <Button 
                    onClick={() => setIsCreateEventOpen(true)}
                    className="bg-accent hover:bg-accent/90"
                    data-testid="button-create-event-hosted"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                ) : (
                  <Button asChild data-testid="button-upgrade-for-hosting">
                    <a href="/subscribe">Upgrade Plan</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attending Events */}
          <TabsContent value="attending" className="space-y-6">
            <Card data-testid="card-attending-events">
              <CardContent className="p-12 text-center">
                <CalendarDays className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No events yet</h3>
                <p className="text-muted-foreground mb-6">
                  Events you RSVP to will appear here. Discover events and start connecting with fellow travelers!
                </p>
                <Button variant="outline" data-testid="button-discover-events">
                  Discover Events
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Event Types Legend */}
        <Card className="max-w-4xl mx-auto" data-testid="card-event-types">
          <CardHeader>
            <CardTitle className="text-lg">Event Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              {[
                { type: 'meetup', label: 'Meetup', description: 'Casual gatherings' },
                { type: 'tour', label: 'Tour', description: 'Guided experiences' },
                { type: 'collab', label: 'Collaboration', description: 'Content creation' },
                { type: 'party', label: 'Party', description: 'Social events' },
                { type: 'other', label: 'Other', description: 'Miscellaneous' }
              ].map((eventType) => {
                const IconComponent = getEventTypeIcon(eventType.type);
                return (
                  <div key={eventType.type} className="text-center space-y-2" data-testid={`div-event-type-${eventType.type}`}>
                    <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
                      <IconComponent className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{eventType.label}</div>
                      <div className="text-xs text-muted-foreground">{eventType.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
