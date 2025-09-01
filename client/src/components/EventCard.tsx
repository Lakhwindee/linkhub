import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, MapPin, Users, Clock, ExternalLink } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { Event } from "@shared/schema";

interface EventCardProps {
  event: Event;
  compact?: boolean;
}

export function EventCard({ event, compact = false }: EventCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rsvpStatus, setRsvpStatus] = useState<string>("not-going");

  const rsvpMutation = useMutation({
    mutationFn: async (status: string) => {
      return await apiRequest("POST", `/api/events/${event.id}/rsvp`, { status });
    },
    onSuccess: (data, status) => {
      setRsvpStatus(status);
      toast({
        title: "RSVP Updated",
        description: `You are now marked as ${status.replace('-', ' ')} for this event.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error) => {
      toast({
        title: "RSVP Failed",
        description: error.message || "Failed to update RSVP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRsvp = (status: string) => {
    rsvpMutation.mutate(status);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meetup':
        return 'bg-blue-500 text-white';
      case 'tour':
        return 'bg-green-500 text-white';
      case 'collab':
        return 'bg-purple-500 text-white';
      case 'party':
        return 'bg-pink-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return { label: 'Public', variant: 'secondary' as const };
      case 'followers':
        return { label: 'Followers', variant: 'outline' as const };
      case 'invite-only':
        return { label: 'Invite Only', variant: 'destructive' as const };
      default:
        return { label: 'Public', variant: 'secondary' as const };
    }
  };

  if (compact) {
    return (
      <div className="border-l-2 border-accent pl-4 space-y-2" data-testid={`event-compact-${event.id}`}>
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-card-foreground" data-testid={`text-event-title-${event.id}`}>
            {event.title}
          </h4>
          <Badge className={getEventTypeColor(event.type)} data-testid={`badge-event-type-${event.id}`}>
            {event.type}
          </Badge>
        </div>
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            <span data-testid={`text-event-date-${event.id}`}>
              {format(new Date(event.startsAt), 'MMM d, h:mm a')}
            </span>
          </div>
          {event.city && event.country && (
            <div className="flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              <span data-testid={`text-event-location-${event.id}`}>
                {event.city}, {event.country}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const visibilityBadge = getVisibilityBadge(event.visibility || 'public');

  return (
    <Card className="travel-card" data-testid={`card-event-${event.id}`}>
      <CardContent className="p-6">
        {/* Event Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback data-testid={`text-event-host-initials-${event.id}`}>
                {event.hostId?.charAt(0)?.toUpperCase() || 'H'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-card-foreground" data-testid={`text-event-host-${event.id}`}>
                  @{event.hostId}
                </span>
                <Badge className={getEventTypeColor(event.type)} data-testid={`badge-event-type-full-${event.id}`}>
                  {event.type}
                </Badge>
                <Badge variant={visibilityBadge.variant} className="text-xs">
                  {visibilityBadge.label}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground" data-testid={`text-event-created-${event.id}`}>
                Created {formatDistanceToNow(new Date(event.createdAt!))} ago
              </div>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-card-foreground" data-testid={`text-event-title-full-${event.id}`}>
            {event.title}
          </h3>

          {event.description && (
            <p className="text-card-foreground" data-testid={`text-event-description-${event.id}`}>
              {event.description}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-2 text-accent" />
                <div>
                  <div className="font-medium" data-testid={`text-event-start-date-${event.id}`}>
                    {format(new Date(event.startsAt), 'EEEE, MMMM d, yyyy')}
                  </div>
                  <div className="text-muted-foreground" data-testid={`text-event-start-time-${event.id}`}>
                    {format(new Date(event.startsAt), 'h:mm a')}
                    {event.endsAt && ` - ${format(new Date(event.endsAt), 'h:mm a')}`}
                  </div>
                </div>
              </div>

              {event.city && event.country && (
                <div className="flex items-center text-sm">
                  <MapPin className="w-4 h-4 mr-2 text-accent" />
                  <div>
                    <div className="font-medium" data-testid={`text-event-location-full-${event.id}`}>
                      {event.city}, {event.country}
                    </div>
                    {event.venue && (
                      <div className="text-muted-foreground" data-testid={`text-event-venue-${event.id}`}>
                        {event.venue}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {event.capacity && (
                <div className="flex items-center text-sm">
                  <Users className="w-4 h-4 mr-2 text-accent" />
                  <span data-testid={`text-event-capacity-${event.id}`}>
                    Capacity: {event.capacity} people
                  </span>
                </div>
              )}

              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-2 text-accent" />
                <span className="text-muted-foreground" data-testid={`text-event-time-until-${event.id}`}>
                  {formatDistanceToNow(new Date(event.startsAt))} from now
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RSVP Actions */}
        {user && (
          <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant={rsvpStatus === 'going' ? 'default' : 'outline'}
                onClick={() => handleRsvp('going')}
                disabled={rsvpMutation.isPending}
                data-testid={`button-rsvp-going-${event.id}`}
              >
                ✅ Going
              </Button>
              <Button
                size="sm"
                variant={rsvpStatus === 'maybe' ? 'default' : 'outline'}
                onClick={() => handleRsvp('maybe')}
                disabled={rsvpMutation.isPending}
                data-testid={`button-rsvp-maybe-${event.id}`}
              >
                🤔 Maybe
              </Button>
              <Button
                size="sm"
                variant={rsvpStatus === 'not-going' ? 'default' : 'outline'}
                onClick={() => handleRsvp('not-going')}
                disabled={rsvpMutation.isPending}
                data-testid={`button-rsvp-not-going-${event.id}`}
              >
                ❌ Can't Go
              </Button>
            </div>

            <Button variant="ghost" size="sm" data-testid={`button-share-event-${event.id}`}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
