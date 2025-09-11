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
            Verify your channel to access creator features and campaigns
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
                  Connect your YouTube channel to verify your creator status and access 
                  advertising campaigns and monetization features.
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Verify channel ownership</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Access subscriber count</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Enable creator campaigns</span>
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