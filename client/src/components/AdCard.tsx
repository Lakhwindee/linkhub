import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink, TrendingUp, Target, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AdCardProps {
  ad: {
    id: string;
    adType: 'boosted_post' | 'campaign';
    impressionId: string;
    impressionTimestamp: string;
    // For boosted posts
    postId?: string;
    postBody?: string;
    postMediaType?: string;
    postMediaUrls?: string[];
    postCountry?: string;
    postCity?: string;
    userDisplayName?: string;
    userUsername?: string;
    userProfileImageUrl?: string;
    costPerClick?: string;
    // For campaign ads  
    brand?: string;
    title?: string;
    briefMd?: string;
    countries?: string[];
    adImageUrl?: string;
    payoutAmount?: string;
    createdAt: string;
  };
}

export function AdCard({ ad }: AdCardProps) {
  const [clicked, setClicked] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [impressionTracked, setImpressionTracked] = useState(false);

  // Track impression when component becomes visible
  useEffect(() => {
    if (impressionTracked) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !impressionTracked) {
            trackImpression();
          }
        });
      },
      { threshold: 0.5 } // Trigger when 50% visible
    );

    const element = document.getElementById(`ad-${ad.id}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [impressionTracked, ad.id]);

  const trackImpression = async () => {
    if (impressionTracked) return;
    setImpressionTracked(true);

    try {
      await apiRequest("POST", "/api/feed/ads/impression", {
        adId: ad.id,
        adType: ad.adType,
        impressionId: ad.impressionId,
        viewDuration: 1, // Basic view duration tracking
      });
    } catch (error) {
      console.error('Failed to track ad impression:', error);
    }
  };

  const handleAdClick = async () => {
    if (clicked) return; // Prevent multiple clicks
    
    setClicked(true);
    
    try {
      await apiRequest("POST", `/api/feed/ads/${ad.id}/click`, {
        adType: ad.adType,
        impressionId: ad.impressionId, // Required for security validation
      });
    } catch (error) {
      console.error('Failed to track ad click:', error);
      // Reset clicked state on error for retry
      setClicked(false);
    }
  };

  const formatLocation = (country?: string, city?: string) => {
    if (city && country) return `${city}, ${country}`;
    if (country) return country;
    return null;
  };

  if (ad.adType === 'boosted_post') {
    return (
      <Card id={`ad-${ad.id}`} className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-800 relative">
        {/* Sponsored label */}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            <TrendingUp className="w-3 h-3 mr-1" />
            Promoted
          </Badge>
        </div>

        <CardContent className="p-6">
          {/* User info */}
          <div className="flex items-start space-x-3 mb-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src={ad.userProfileImageUrl || ''} />
              <AvatarFallback>
                {ad.userDisplayName?.charAt(0) || ad.userUsername?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-semibold text-foreground truncate">
                  {ad.userDisplayName || ad.userUsername || 'User'}
                </p>
                {ad.userUsername && (
                  <p className="text-xs text-muted-foreground truncate">
                    @{ad.userUsername}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                {formatLocation(ad.postCountry, ad.postCity) && (
                  <>
                    <span>{formatLocation(ad.postCountry, ad.postCity)}</span>
                    <span>•</span>
                  </>
                )}
                <span>{new Date(ad.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Post content */}
          {ad.postBody && (
            <div className="mb-4">
              <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                {isExpanded ? ad.postBody : ad.postBody.length > 200 ? `${ad.postBody.slice(0, 200)}...` : ad.postBody}
              </p>
              {ad.postBody.length > 200 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs text-accent hover:underline mt-1"
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}

          {/* Media */}
          {ad.postMediaUrls && ad.postMediaUrls.length > 0 && (
            <div className="mb-4">
              {ad.postMediaType === 'video' ? (
                <video 
                  controls 
                  className="w-full max-h-80 rounded-lg object-cover"
                  src={ad.postMediaUrls[0]}
                />
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {ad.postMediaUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Post media ${index + 1}`}
                      className="w-full max-h-80 rounded-lg object-cover cursor-pointer"
                      onClick={() => window.open(url, '_blank')}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CTA Button */}
          <Button 
            onClick={handleAdClick}
            disabled={clicked}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            {clicked ? 'Clicked!' : 'View Post'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Campaign ad display
  return (
    <Card id={`ad-${ad.id}`} className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/10 dark:border-blue-800 relative">
      {/* Sponsored label */}
      <div className="absolute top-3 right-3">
        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <Target className="w-3 h-3 mr-1" />
          Sponsored
        </Badge>
      </div>

      <CardContent className="p-6">
        {/* Campaign header */}
        <div className="flex items-start space-x-3 mb-4">
          {ad.adImageUrl && (
            <img 
              src={ad.adImageUrl} 
              alt={ad.brand}
              className="w-12 h-12 rounded-lg object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {ad.brand}
            </h3>
            <p className="text-xs text-muted-foreground flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Campaign</span>
            </p>
          </div>
        </div>

        {/* Campaign content */}
        <div className="mb-4">
          {ad.title && (
            <h4 className="text-base font-medium text-foreground mb-2">
              {ad.title}
            </h4>
          )}
          {ad.briefMd && (
            <p className="text-sm text-muted-foreground">
              {isExpanded ? ad.briefMd : ad.briefMd.length > 150 ? `${ad.briefMd.slice(0, 150)}...` : ad.briefMd}
            </p>
          )}
          {ad.briefMd && ad.briefMd.length > 150 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-accent hover:underline mt-1"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Target countries */}
        {ad.countries && ad.countries.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {ad.countries.slice(0, 3).map((country) => (
              <Badge key={country} variant="outline" className="text-xs">
                {country}
              </Badge>
            ))}
            {ad.countries.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{ad.countries.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* CTA Button */}
        <Button 
          onClick={handleAdClick}
          disabled={clicked}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          {clicked ? 'Clicked!' : 'Learn More'}
        </Button>
        
        {ad.payoutAmount && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            Creator payout: ${ad.payoutAmount}
          </p>
        )}
      </CardContent>
    </Card>
  );
}