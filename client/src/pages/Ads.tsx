import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Youtube, ExternalLink, CheckCircle, 
  AlertCircle, Loader2, User, Users
} from "lucide-react";

export default function Ads() {
  const { user, isAuthenticated } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [youtubeChannel, setYoutubeChannel] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Check YouTube connection status on load
  useEffect(() => {
    if (isAuthenticated) {
      checkYouTubeStatus();
    }
  }, [isAuthenticated]);

  const checkYouTubeStatus = async () => {
    try {
      const response = await fetch('/api/youtube/status');
      if (response.ok) {
        const data = await response.json();
        setYoutubeChannel(data.channel);
      }
    } catch (error) {
      console.error('Error checking YouTube status:', error);
    }
  };

  const connectYouTube = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      const response = await fetch('/api/youtube/auth-url');
      const data = await response.json();
      
      if (data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        setError('Failed to get authorization URL');
      }
    } catch (error) {
      setError('Failed to connect to YouTube');
      console.error('Error connecting YouTube:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectYouTube = async () => {
    try {
      const response = await fetch('/api/youtube/disconnect', {
        method: 'POST'
      });
      
      if (response.ok) {
        setYoutubeChannel(null);
      } else {
        setError('Failed to disconnect YouTube channel');
      }
    } catch (error) {
      setError('Failed to disconnect YouTube channel');
      console.error('Error disconnecting YouTube:', error);
    }
  };

  const getTierInfo = (tier: number) => {
    switch (tier) {
      // Comprehensive 10-Tier System replacing old 3-tier structure
      case 1: return { name: 'Bronze Creator', range: '1k-5k', color: 'bg-orange-600' };
      case 2: return { name: 'Silver Creator', range: '5k-10k', color: 'bg-gray-400' };
      case 3: return { name: 'Gold Creator', range: '10k-25k', color: 'bg-yellow-500' };
      case 4: return { name: 'Platinum Creator', range: '25k-50k', color: 'bg-blue-500' };
      case 5: return { name: 'Diamond Creator', range: '50k-100k', color: 'bg-purple-500' };
      case 6: return { name: 'Elite Creator', range: '100k-250k', color: 'bg-indigo-600' };
      case 7: return { name: 'Master Creator', range: '250k-500k', color: 'bg-pink-600' };
      case 8: return { name: 'Legend Creator', range: '500k-1M', color: 'bg-red-600' };
      case 9: return { name: 'Champion Creator', range: '1M-5M', color: 'bg-green-600' };
      case 10: return { name: 'Ultimate Creator', range: '5M+', color: 'bg-black' };
      default: return { name: 'Not Connected', range: '', color: 'bg-gray-500' };
    }
  };

  const getYoutubeTier = (subscriberCount: number) => {
    if (subscriberCount >= 5000000) return 10; // Ultimate Creator
    if (subscriberCount >= 1000000) return 9;  // Champion Creator  
    if (subscriberCount >= 500000) return 8;   // Legend Creator
    if (subscriberCount >= 250000) return 7;   // Master Creator
    if (subscriberCount >= 100000) return 6;   // Elite Creator
    if (subscriberCount >= 50000) return 5;    // Diamond Creator
    if (subscriberCount >= 25000) return 4;    // Platinum Creator
    if (subscriberCount >= 10000) return 3;    // Gold Creator
    if (subscriberCount >= 5000) return 2;     // Silver Creator
    if (subscriberCount >= 1000) return 1;     // Bronze Creator
    return 0; // Not qualified
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 py-20">
            <Youtube className="w-16 h-16 mx-auto text-red-600" />
            <h1 className="text-2xl font-bold">Sign in to connect YouTube</h1>
            <p className="text-muted-foreground">Connect your YouTube channel to get verified</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <Youtube className="w-8 h-8 text-red-600" />
            Connect Your YouTube Channel
          </h1>
          <p className="text-muted-foreground">
            Connect your YouTube channel for verification
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <div className="flex justify-center">
          {youtubeChannel ? (
            // Connected State
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  Channel Connected
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  {youtubeChannel.thumbnail ? (
                    <img 
                      src={youtubeChannel.thumbnail} 
                      alt="Channel Avatar"
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <User className="w-12 h-12 rounded-full bg-gray-200 p-2" />
                  )}
                  <div>
                    <h3 className="font-semibold">{youtubeChannel.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {youtubeChannel.channelId}
                    </p>
                  </div>
                </div>
                
                {youtubeChannel.subscriberCount && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {parseInt(youtubeChannel.subscriberCount).toLocaleString()} subscribers
                    </span>
                  </div>
                )}

                {youtubeChannel.subscriberCount && (
                  <div className="flex items-center gap-2">
                    {(() => {
                      const subscriberCount = parseInt(youtubeChannel.subscriberCount);
                      const tier = getYoutubeTier(subscriberCount);
                      const tierInfo = getTierInfo(tier);
                      
                      return (
                        <Badge className={`${tierInfo.color} text-white`}>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {tierInfo.name}
                        </Badge>
                      );
                    })()}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={checkYouTubeStatus}
                  >
                    Refresh
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={disconnectYouTube}
                  >
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Not Connected State
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="w-5 h-5 text-red-600" />
                  Connect YouTube Channel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Connect your YouTube channel to verify channel ownership.
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Verify channel ownership</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Access tier-based campaigns</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Unlock creator benefits</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Creator Tiers Available:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <Badge className="bg-orange-600 text-white text-[10px] px-1 py-0">Bronze (1k-5k)</Badge>
                    <Badge className="bg-gray-400 text-white text-[10px] px-1 py-0">Silver (5k-10k)</Badge>
                    <Badge className="bg-yellow-500 text-white text-[10px] px-1 py-0">Gold (10k-25k)</Badge>
                    <Badge className="bg-blue-500 text-white text-[10px] px-1 py-0">Platinum (25k-50k)</Badge>
                    <Badge className="bg-purple-500 text-white text-[10px] px-1 py-0">Diamond (50k-100k)</Badge>
                    <Badge className="bg-indigo-600 text-white text-[10px] px-1 py-0">Elite (100k-250k)</Badge>
                    <Badge className="bg-pink-600 text-white text-[10px] px-1 py-0">Master (250k-500k)</Badge>
                    <Badge className="bg-red-600 text-white text-[10px] px-1 py-0">Legend (500k-1M)</Badge>
                    <Badge className="bg-green-600 text-white text-[10px] px-1 py-0">Champion (1M-5M)</Badge>
                    <Badge className="bg-black text-white text-[10px] px-1 py-0">Ultimate (5M+)</Badge>
                  </div>
                </div>

                <Button 
                  onClick={connectYouTube} 
                  disabled={isConnecting}
                  className="w-full"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Connect YouTube Channel
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  You'll be redirected to Google to authorize access to your YouTube channel information.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}