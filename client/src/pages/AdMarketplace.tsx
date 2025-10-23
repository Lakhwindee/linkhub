import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ObjectUploader } from "@/components/ObjectUploader";
import { DollarSign, Search, Filter, Calendar, MapPin, Tag, Clock, Upload, Eye, CheckCircle, Download, Youtube, Star, Play, Shield, AlertCircle, Copy, TrendingUp, CreditCard, History, Banknote } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import type { Ad, AdReservation } from "@shared/schema";
import { worldCountries } from "@/data/locationData";
import { EligibilityModal } from "@/components/EligibilityModal";
import { TIERS, getTierByLevel } from "@shared/tierConfig";

// YouTube Creator Component
function YouTubeCreatorSection({ user }: { user: any }) {
  // Fetch real user data from backend with YouTube info - aggressive cache invalidation
  const { data: realUserData, refetch: refetchUser } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/auth/user");
      return response.json();
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache at all
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !!user?.id, // Only fetch when user is authenticated
  });

  // Use real user data if available, fallback to auth user
  const userData = realUserData || user;
  
  // For demo user, check if they have been disconnected
  const isDemoUser = user?.id === 'demo-user-1';
  const [demoDisconnected, setDemoDisconnected] = useState(() => {
    // Initialize from localStorage for demo user
    return isDemoUser ? localStorage.getItem('demo_youtube_disconnected') === 'true' : false;
  });
  
  // Declare all state variables BEFORE useEffect to prevent hoisting issues
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVerifyingConnection, setIsVerifyingConnection] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [eligibilityData, setEligibilityData] = useState({ currentSubs: 0, requiredSubs: 30000 });
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingChannel, setPendingChannel] = useState<{channelId?: string; title?: string; subscribers?: number; region?: string; tier?: number} | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState(userData?.youtubeUrl || '');
  
  // For demo user, use demo logic. For real user, check if channel is connected (not necessarily verified)
  const isYouTubeConnected = isDemoUser ? !demoDisconnected : (!!userData?.youtubeChannelId || !!pendingChannel);
  const isYouTubeVerified = isDemoUser ? !demoDisconnected : userData?.youtubeVerified;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update YouTube URL when real user data loads - PREVENT RE-RENDER DURING VFX
  useEffect(() => {
    // Skip URL updates when congratulations is showing to prevent VFX interference
    if (showCongratulations) {
      console.log('Skipping URL update during congratulations VFX');
      return;
    }
    
    if (userData?.youtubeUrl) {
      setYoutubeUrl(userData.youtubeUrl);
    } else {
      // Clear field if no YouTube URL in user data (after disconnect or refresh)
      setYoutubeUrl("");
    }
  }, [userData?.youtubeUrl, showCongratulations]);

  // Clear pending channel data when userData gets updated to avoid stale fallbacks
  useEffect(() => {
    if (userData?.youtubeChannelId && pendingChannel?.channelId) {
      console.log('Clearing pending channel data - userData now has channel info');
      setPendingChannel(null);
    }
  }, [userData?.youtubeChannelId, pendingChannel?.channelId]);

  const syncYouTube = useMutation({
    mutationFn: async (url: string) => {
      console.log('syncYouTube API call with URL:', url); // Debug log
      const requestBody = { youtubeUrl: url };
      console.log('Request body being sent:', requestBody); // Debug log
      const response = await apiRequest("POST", "/api/youtube/sync", requestBody);
      return response.json();
    },
    onSuccess: (data) => {
      setVerificationCode(data.verificationCode);
      // Store channel data immediately for instant display
      setPendingChannel({
        channelId: data.channelId,
        title: data.title,
        subscribers: data.subscriberCount,
        region: data.country || data.region,
        tier: data.tier
      });
      // For demo user, clear disconnect state when reconnecting
      if (isDemoUser) {
        setDemoDisconnected(false);
        localStorage.removeItem('demo_youtube_disconnected');
      }
      // Immediately invalidate cache and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      refetchUser();
      // Show success toast
      toast({
        title: "YouTube Connected!",
        description: `Channel linked successfully with ${data.subscriberCount?.toLocaleString()} subscribers (Tier ${data.tier})`,
      });
    },
    onError: (error: any) => {
      console.log('Connection Failed:', error.message);
      
      // Check if error is about low subscriber count
      if (error.message && error.message.includes('only') && error.message.includes('subsc')) {
        // Extract subscriber count from error message
        const match = error.message.match(/only ([\d,]+) subsc/);
        const currentSubs = match ? parseInt(match[1].replace(/,/g, '')) : 0;
        
        setEligibilityData({ currentSubs, requiredSubs: 30000 });
        setShowEligibilityModal(true);
      }
      // No popup for other errors - show error in VFX instead
    },
  });

  const verifyChannel = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/youtube/verify");
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Channel Verified:', data.message);
      // No popup - success handled elsewhere
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      console.log('Verification Failed:', error.message);
      // No popup - error handled elsewhere
    },
  });

  const disconnectYouTube = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/youtube/disconnect");
      return response.json();
    },
    onSuccess: (data) => {
      // Clear the input field immediately
      setYoutubeUrl("");
      
      // For demo user, update local state and persist in localStorage
      if (isDemoUser) {
        setDemoDisconnected(true);
        localStorage.setItem('demo_youtube_disconnected', 'true');
      }
      // Removed disconnect toast - no popups allowed
      console.log('Channel disconnected successfully - no popup shown');
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      console.log('Disconnect Failed:', error.message);
      // No popup - error handled elsewhere
    },
  });

  const validateYouTubeUrl = (url: string) => {
    const youtubePatterns = [
      /^https?:\/\/(www\.)?youtube\.com\/@[\w\-_.]+/i,
      /^https?:\/\/(www\.)?youtube\.com\/c\/[\w\-_.]+/i,
      /^https?:\/\/(www\.)?youtube\.com\/channel\/[\w\-_.]+/i,
      /^https?:\/\/(www\.)?youtube\.com\/user\/[\w\-_.]+/i,
      // Allow without protocol
      /^(www\.)?youtube\.com\/@[\w\-_.]+/i,
      /^(www\.)?youtube\.com\/c\/[\w\-_.]+/i,
      /^(www\.)?youtube\.com\/channel\/[\w\-_.]+/i,
      /^(www\.)?youtube\.com\/user\/[\w\-_.]+/i,
    ];
    
    console.log('Validating URL:', url); // Debug log
    const isValid = youtubePatterns.some(pattern => pattern.test(url));
    console.log('URL validation result:', isValid); // Debug log
    return isValid;
  };

  const handleConnect = async () => {
    console.log('handleConnect called with URL:', youtubeUrl); // Debug log
    
    if (!youtubeUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter your YouTube channel URL",
        variant: "destructive",
      });
      return;
    }

    // Validate YouTube URL format
    if (!validateYouTubeUrl(youtubeUrl.trim())) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube channel URL",
        variant: "destructive",
      });
      return;
    }
    
    // Show loading and immediately call API
    setIsConnecting(true);
    
    try {
      console.log('Calling syncYouTube with URL:', youtubeUrl.trim()); // Debug log
      await syncYouTube.mutateAsync(youtubeUrl.trim());
    } catch (error) {
      console.error('Connect failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      await verifyChannel.mutateAsync();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisconnect = () => {
    if (confirm("Are you sure you want to disconnect your YouTube channel? This will remove access to all earning campaigns.")) {
      disconnectYouTube.mutate();
    }
  };

  const copyVerificationCode = () => {
    const code = userData?.youtubeVerificationCode || verificationCode;
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Verification code copied to clipboard",
    });
  };

  // Helper function to get tier info using shared tier configuration
  const getTierInfo = (tier: number) => {
    if (tier === 0) {
      return { name: 'Ineligible', range: '<30K subscribers', color: 'bg-red-500' };
    }
    
    const tierConfig = getTierByLevel(tier);
    if (tierConfig) {
      // Map tier levels to colors
      const tierColors = {
        1: 'bg-orange-600',   // Micro-Influencers
        2: 'bg-gray-400',     // Small Influencers  
        3: 'bg-yellow-500',   // Mid-Tier Influencers
        4: 'bg-blue-500',     // Growing Influencers
        5: 'bg-purple-500',   // Established Influencers
        6: 'bg-indigo-600',   // Major Influencers
        7: 'bg-pink-600',     // Top Influencers
        8: 'bg-red-600',      // Premium Influencers
        9: 'bg-green-600',    // Celebrity Influencers
        10: 'bg-black'        // Mega Influencers
      };
      return {
        name: tierConfig.description,
        range: tierConfig.range,
        color: tierColors[tier as keyof typeof tierColors] || 'bg-gray-500'
      };
    }
    return { name: 'Not Connected', range: '', color: 'bg-gray-500' };
  };

  const getRoleInfo = (role: string, plan: string) => {
    switch (role) {
      case 'free_creator':
        return {
          name: 'Free Creator',
          description: 'Can view campaigns with visual locks on premium features',
          permissions: [
            '✅ View "Earn" menu and campaigns',
            '❌ Premium Required: Reserve/Apply to campaigns',
            '❌ Premium Required: Analytics Dashboard',
            '❌ Premium Required: Payout Management',
            '❌ Premium Required: Earnings Tracking'
          ],
          upgradeMessage: 'Upgrade to Premium to unlock earning features',
          color: 'bg-amber-500'
        };
      case 'creator':
        return {
          name: `${plan === 'premium' ? 'Premium' : 'Standard'} Creator`,
          description: plan === 'premium' 
            ? 'Full access to all earning features and campaign management'
            : 'Limited creator access - upgrade to Premium for full features',
          permissions: plan === 'premium' 
            ? [
                '✅ View "Earn" menu and campaigns',
                '✅ Reserve and apply to campaigns',
                '✅ Full Analytics Dashboard',
                '✅ Payout Management',
                '✅ Earnings Tracking',
                '✅ YouTube Integration & Verification'
              ]
            : [
                '✅ View "Earn" menu and campaigns',
                '❌ Premium Required: Reserve/Apply to campaigns',
                '❌ Premium Required: Analytics Dashboard',
                '❌ Premium Required: Payout Management',
                '❌ Premium Required: Earnings Tracking'
              ],
          upgradeMessage: plan === 'premium' ? null : 'Upgrade to Premium for full creator features',
          color: plan === 'premium' ? 'bg-green-500' : 'bg-blue-500'
        };
      case 'publisher':
        return {
          name: 'Brand Publisher',
          description: 'Create and manage advertising campaigns for brands',
          permissions: [
            '✅ View "Campaigns" menu (not "Earn")',
            '✅ Create brand advertising campaigns',
            '✅ Manage campaign budgets and targeting',
            '✅ Track campaign performance',
            '✅ Publisher Dashboard access'
          ],
          upgradeMessage: null,
          color: 'bg-purple-500'
        };
      case 'user':
      default:
        return {
          name: 'Standard User',
          description: 'Basic platform access for browsing and social features',
          permissions: [
            '✅ Browse platform and discover content',
            '✅ Social features (follow, message, feed)',
            '❌ No "Earn" or "Campaigns" menu access',
            '❌ Switch to Creator or Publisher role for earning'
          ],
          upgradeMessage: 'Switch to Creator role to start earning from campaigns',
          color: 'bg-gray-500'
        };
    }
  };

  const tierInfo = getTierInfo(userData?.youtubeTier || pendingChannel?.tier || 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-500" />
          YouTube Connection
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your YouTube channel for verification
        </p>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* YouTube Connection Status Section */}
        {isYouTubeConnected ? (
          <>
            {isYouTubeVerified ? (
              <>
                {/* Verified Status */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-800">Channel Verified ✓</p>
                        <p className="text-sm text-green-600">Earning campaigns available</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-800">
                        {(userData.youtubeSubscribers || pendingChannel?.subscribers)?.toLocaleString() || '0'}
                      </p>
                      <p className="text-sm text-green-600">subscribers</p>
                    </div>
                  </div>
                  
                  {/* Channel Link */}
                  {(userData.youtubeUrl || youtubeUrl) && (
                    <div className="pt-2 border-t border-green-200">
                      <a 
                        href={userData.youtubeUrl || youtubeUrl}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-green-700 hover:text-green-800 hover:underline transition-colors"
                      >
                        <Youtube className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {userData.youtubeTitle || pendingChannel?.title || 'View YouTube Channel'}
                        </span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Enhanced YouTube Tier Display */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full ${tierInfo.color} flex items-center justify-center`}>
                        <Star className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-blue-800">{tierInfo.name}</p>
                        <p className="text-sm text-blue-600">{tierInfo.range} subscribers range</p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-blue-500 text-white text-sm px-3 py-1">
                      Tier {userData.youtubeTier || pendingChannel?.tier || 1}
                    </Badge>
                  </div>
                </div>



                {/* Disconnect Option */}
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDisconnect}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Disconnect YouTube Channel
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Connected but Not Verified */}
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-yellow-800">Channel Not Verified</p>
                        <p className="text-sm text-yellow-600">Verification required to earn money</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-800">
                        {(userData.youtubeSubscribers || pendingChannel?.subscribers)?.toLocaleString() || '0'}
                      </p>
                      <p className="text-sm text-yellow-600">subscribers</p>
                    </div>
                  </div>
                  
                  {/* Channel Link */}
                  {(userData.youtubeUrl || youtubeUrl) && (
                    <div className="pt-2 border-t border-yellow-200">
                      <a 
                        href={userData.youtubeUrl || youtubeUrl}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-yellow-700 hover:text-yellow-800 hover:underline transition-colors"
                      >
                        <Youtube className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {userData.youtubeTitle || pendingChannel?.title || 'View YouTube Channel'}
                        </span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Enhanced Tier Display for Non-Verified */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full ${tierInfo.color} flex items-center justify-center`}>
                        <Star className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-blue-800">{tierInfo.name}</p>
                        <p className="text-sm text-blue-600">{tierInfo.range} subscribers range</p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-blue-500 text-white text-sm px-3 py-1">
                      Tier {userData.youtubeTier || pendingChannel?.tier || 1}
                    </Badge>
                  </div>
                </div>

                {/* Full Screen Verification Overlay */}
                {isVerifying && (
                  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20 shadow-2xl animate-bounce">
                      <div className="animate-spin w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2 animate-pulse">
                        🔍 Verifying Ownership...
                      </h3>
                      <p className="text-yellow-200 animate-pulse">
                        Checking your channel description for verification code
                      </p>
                    </div>
                  </div>
                )}

                {/* Verification Steps */}
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-yellow-600" />
                      <h3 className="font-semibold text-yellow-800">Verify Channel Ownership</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-sm text-yellow-700">
                        To prove you own this channel, add this verification code to your channel description:
                      </p>
                      
                      <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                        <code className="flex-1 text-sm font-mono">
                          {user?.youtubeVerificationCode || verificationCode || 'Loading...'}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={copyVerificationCode}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-yellow-700">Steps:</p>
                        <ol className="text-sm text-yellow-600 space-y-1 list-decimal list-inside">
                          <li>Go to your YouTube Studio</li>
                          <li>Click "Customization" → "Basic info"</li>
                          <li>Add the verification code above to your channel description</li>
                          <li>Save changes and click "Verify Channel" below</li>
                          <li>You can remove the code after verification</li>
                        </ol>
                      </div>
                      
                      <Button 
                        onClick={handleVerify}
                        disabled={isVerifying}
                        className={`w-full bg-yellow-600 hover:bg-yellow-700 transition-all duration-500 ease-out transform ${isVerifying ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 hover:shadow-xl hover:bg-yellow-500'}`}
                      >
                        {isVerifying ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Verify Channel Ownership
                          </>
                        )}
                      </Button>
                      
                      {/* Back Button */}
                      <Button
                        variant="outline"
                        onClick={() => {
                          console.log('🔴 BACK BUTTON CLICKED! Resetting states...');
                          console.log('Current demoDisconnected state:', demoDisconnected);
                          
                          // Reset ALL states and go back to connection form
                          setYoutubeUrl('');
                          setVerificationCode('');
                          setIsVerifying(false);
                          setIsConnecting(false);
                          setIsVerifyingConnection(false);
                          setShowCongratulations(false);
                          
                          if (isDemoUser) {
                            console.log('Demo user - setting disconnected state to TRUE');
                            setDemoDisconnected(true);
                            localStorage.setItem('demo_youtube_disconnected', 'true');
                            console.log('New demoDisconnected will be:', true);
                          } else {
                            // For real users, call disconnect API
                            disconnectYouTube.mutate();
                          }
                          
                          // Force component refresh by refetching user data
                          refetchUser();
                          
                          console.log('✅ Back button action completed - should show connection form now');
                          
                          // Show visual feedback
                          toast({
                            title: "Going Back",
                            description: "Returning to YouTube connection form...",
                          });
                        }}
                        className="w-full border-2 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold text-lg py-3 animate-pulse"
                      >
                        Back
                      </Button>
                      
                      {(user?.youtubeVerificationAttempts || 0) > 0 && (
                        <p className="text-xs text-yellow-600">
                          Verification attempts: {user.youtubeVerificationAttempts}/5
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Last Updated */}
            {user.youtubeLastUpdated && (
              <div className="text-sm text-muted-foreground">
                Last updated: {new Date(user.youtubeLastUpdated).toLocaleDateString()}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Full Screen Loading Overlay */}
            {isConnecting && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center transition-all duration-300 ease-in-out">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20 shadow-2xl transform transition-all duration-500 ease-out">
                  <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">
                    🔗 Connecting Channel...
                  </h3>
                  <p className="text-blue-200">
                    Establishing connection to YouTube servers
                  </p>
                </div>
              </div>
            )}
            
            {/* Full Screen Verifying Connection Overlay */}
            {isVerifyingConnection && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center transition-all duration-300 ease-in-out">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20 shadow-2xl transform transition-all duration-500 ease-out">
                  <div className="animate-spin w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">
                    🔍 Verifying Channel...
                  </h3>
                  <p className="text-green-200">
                    Checking channel data and subscriber count
                  </p>
                </div>
              </div>
            )}
            
            {/* Congratulations Overlay - ABSOLUTE POSITION TEST */}
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: showCongratulations ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
                backdropFilter: showCongratulations ? 'blur(8px)' : 'none',
                WebkitBackdropFilter: showCongratulations ? 'blur(8px)' : 'none',
                zIndex: 999999,
                display: showCongratulations ? 'flex' : 'none',
                visibility: showCongratulations ? 'visible' : 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: showCongratulations ? 'all' : 'none',
                transition: 'all 0.3s ease-in-out'
              }}
            >
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                padding: '40px',
                borderRadius: '20px',
                textAlign: 'center',
                boxShadow: '0 25px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.3)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                maxWidth: '400px',
                transform: 'scale(1)',
                animation: 'fadeInScale 0.4s ease-out'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: 'green',
                  borderRadius: '50%',
                  margin: '0 auto 20px auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle style={{ width: '48px', height: '48px', color: 'white' }} />
                </div>
                <h2 style={{ fontSize: '48px', fontWeight: 'bold', color: 'black', margin: '0 0 16px 0' }}>
                  SUCCESS! 🎉
                </h2>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'green', margin: '0' }}>
                  YouTube Connected!
                </p>
              </div>
            </div>
            
            {/* Enhanced debug with forced visibility check */}
            {console.log('=== CONGRATULATIONS STATE ===', showCongratulations, '=== TIME ===', new Date().toLocaleTimeString())}
            {showCongratulations && console.log('🎉 CONGRATULATIONS SHOULD BE VISIBLE NOW! 🎉')}
            {!showCongratulations && console.log('❌ Congratulations hidden')}
            
            {/* Connection Form */}
            <div className="space-y-4">
              <div className="bg-accent/10 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Connect Your YouTube Channel</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Link your YouTube channel to access brand campaigns and earn money. 
                  You need at least 30,000 subscribers to participate.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {TIERS.map((tier) => (
                    <li key={tier.level}>• {tier.range} subscribers: ${tier.price} per campaign</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube-url">YouTube Channel URL</Label>
                <Input
                  id="youtube-url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && youtubeUrl.trim() && !isConnecting) {
                      handleConnect();
                    }
                  }}
                  placeholder="https://youtube.com/@yourchannel or https://youtube.com/c/yourchannel"
                  disabled={isConnecting}
                  className={`transition-all duration-500 ease-out transform ${youtubeUrl && !validateYouTubeUrl(youtubeUrl.trim()) ? "border-red-500 focus:border-red-500 animate-bounce" : ""} ${isConnecting ? "opacity-50 scale-95 animate-pulse" : "hover:scale-105 hover:shadow-lg"}`}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your channel URL in any format (@username, /c/channel, or /channel/ID)
                </p>
              </div>

              <Button 
                onClick={handleConnect}
                disabled={isConnecting || isVerifyingConnection || showCongratulations || !youtubeUrl.trim()}
                className={`w-full bg-red-500 hover:bg-red-600 transition-all duration-500 ease-out transform ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 hover:shadow-xl hover:bg-red-400'}`}
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Youtube className="w-4 h-4 mr-2" />
                    Connect YouTube Channel
                  </>
                )}
              </Button>
              
              {youtubeUrl.trim() && (
                <div className="animate-fade-in">
                  <p className="text-xs text-center text-blue-500 animate-pulse font-medium">
                    ⚡ Press Enter to connect quickly
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
      
      {/* Eligibility Modal for Low Subscriber Count */}
      <EligibilityModal 
        open={showEligibilityModal}
        onOpenChange={setShowEligibilityModal}
        currentSubscribers={eligibilityData.currentSubs}
        requiredSubscribers={eligibilityData.requiredSubs}
      />
    </Card>
  );
}

export default function AdMarketplace() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isFree, isStandard, isPremium, canApplyCampaigns, canAccessAnalytics, canAccessPayouts } = usePlanAccess();
  
  // YouTube verification check - creators must have verified YouTube channels to reserve ads
  const isYouTubeVerifiedForReservations = user?.role === 'creator' ? 
    (user as any)?.youtubeVerified || false : 
    false;
  const canReserveAds = canApplyCampaigns && isYouTubeVerifiedForReservations;
  
  // Show visual locks for non-premium users (including FREE_CREATOR)
  const shouldShowLocks = !isPremium;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("youtube-dashboard");
  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);
  const [showCountdownOverlay, setShowCountdownOverlay] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(1);
  const [liveCountdown, setLiveCountdown] = useState("");
  const [reservedCampaignId, setReservedCampaignId] = useState<string | null>(null);
  const [contentLink, setContentLink] = useState("");
  const [campaignCountdowns, setCampaignCountdowns] = useState<Record<string, string>>({});
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<AdReservation | null>(null);

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

  // Fetch ads - allow for premium and standard users
  const { data: ads = [], isLoading: adsLoading, error: adsError } = useQuery({
    queryKey: ["/api/ads"],
    enabled: user?.plan === 'premium' || user?.plan === 'standard',
    retry: false,
  });

  // Fetch user's reservations
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ["/api/reservations"],
    enabled: user?.plan === 'premium' || user?.plan === 'standard',
    retry: false,
  });

  // Access check - block free users completely (after all hooks)
  useEffect(() => {
    if (!isLoading && user && isFree) {
      toast({
        title: "Upgrade Required",
        description: "You need a paid plan to access the Ad Marketplace. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = '/subscribe';
      }, 1500);
    }
  }, [user, isFree, isLoading, toast]);

  // Conditional render for free users - after all hooks
  if (!isLoading && user && isFree) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Redirecting to upgrade page...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle unauthorized error
  useEffect(() => {
    if (adsError && isUnauthorizedError(adsError)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [adsError, toast]);

  // Live countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (showCountdownOverlay && reservedCampaignId) {
      const startTime = Date.now();
      const endTime = startTime + (5 * 24 * 60 * 60 * 1000); // 5 days from now
      
      interval = setInterval(() => {
        const now = Date.now();
        const timeLeft = endTime - now;
        
        if (timeLeft <= 0) {
          setLiveCountdown("Time's up!");
          return;
        }
        
        const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
        const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
        
        setLiveCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showCountdownOverlay, reservedCampaignId]);

  // Live countdown for campaigns in "My Campaigns" tab
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let hasExpiredCampaigns = false;
    
    if ((reservations as AdReservation[]).length > 0) {
      interval = setInterval(() => {
        const newCountdowns: Record<string, string> = {};
        
        (reservations as AdReservation[]).forEach((reservation: AdReservation) => {
          const now = Date.now();
          const expiry = new Date(reservation.expiresAt!).getTime();
          const timeLeft = expiry - now;
          
          if (timeLeft <= 0) {
            newCountdowns[reservation.id] = "Expired";
            hasExpiredCampaigns = true;
          } else {
            const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
            const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
            
            newCountdowns[reservation.id] = `${days}d ${hours}h ${minutes}m ${seconds}s`;
          }
        });
        
        setCampaignCountdowns(newCountdowns);
        
        // If any campaigns expired, refresh the data to remove them
        if (hasExpiredCampaigns) {
          queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
          queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
          hasExpiredCampaigns = false; // Reset flag
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [reservations, queryClient]);

  const reserveAdMutation = useMutation({
    mutationFn: async (adId: string) => {
      return await apiRequest("POST", `/api/ads/${adId}/reserve`);
    },
    onSuccess: (data, adId) => {
      // Show countdown overlay immediately
      setReservedCampaignId(adId);
      setShowCountdownOverlay(true);
      setOverlayOpacity(1);
      
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      
      // Close dialog with smooth transition after 1 second
      setTimeout(() => {
        setIsReserveDialogOpen(false);
      }, 1000);
      
      // Make countdown transparent after 5 seconds total
      setTimeout(() => {
        setOverlayOpacity(0);
        // Hide overlay and switch tab after fade
        setTimeout(() => {
          setShowCountdownOverlay(false);
          setReservedCampaignId(null);
          setCurrentTab("my-campaigns");
        }, 500); // 500ms for fade transition
      }, 5000);
    },
    onError: (error) => {
      toast({
        title: "Reservation Failed",
        description: error.message || "Failed to reserve campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  const submitAdMutation = useMutation({
    mutationFn: async (data: { adId: string; rawFileUrl: string; contentLink: string }) => {
      return await apiRequest("POST", `/api/ads/${data.adId}/submit`, {
        rawFileUrl: data.rawFileUrl,
        contentLink: data.contentLink
      });
    },
    onSuccess: () => {
      toast({
        title: "Submission Sent",
        description: "Your content has been submitted for review.",
      });
      setIsSubmitDialogOpen(false);
      setContentLink(""); // Clear the link input
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit content. Please try again.",
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
    if (result.successful && result.successful.length > 0 && selectedAd) {
      const uploadedFile = result.successful[0];
      try {
        const response = await apiRequest("PUT", "/api/media", {
          mediaUrl: uploadedFile.uploadURL
        });
        const { objectPath } = await response.json();
        
        submitAdMutation.mutate({
          adId: selectedAd.id,
          rawFileUrl: objectPath,
          contentLink: contentLink
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

  // Only creators, free_creators, and admins can access AdMarketplace
  const allowedRoles = ['creator', 'free_creator', 'admin', 'superadmin', 'moderator'];
  if (!allowedRoles.includes(user.role || '')) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="p-12 text-center">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-yellow-600 dark:text-yellow-400" />
              <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200 mb-4">
                Creator Access Required
              </h2>
              <p className="text-yellow-700 dark:text-yellow-300 mb-6">
                Switch to a Creator role to access the Ad Marketplace and start earning from brand collaborations.
              </p>
              <Button asChild className="bg-yellow-600 hover:bg-yellow-700 text-white" data-testid="button-upgrade-to-creator">
                <Link href="/role-test">Switch Role</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const filteredAds = (ads as Ad[]).filter((ad: Ad) => {
    const matchesSearch = !searchQuery || 
      ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.brand.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCountry = !countryFilter || 
      ad.countries?.includes(countryFilter);

    // Tier-based filtering for creators
    const userTier = user?.youtubeTier || 0;
    const matchesTier = !ad.tierLevel || userTier === ad.tierLevel || userTier === 0; // Allow viewing all tiers if not connected to YouTube
    
    return matchesSearch && matchesCountry && matchesTier;
  });

  return (
    <>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2" data-testid="heading-ad-marketplace">
                <DollarSign className="w-8 h-8 text-chart-2" />
                <span>Ad Marketplace</span>
              </h1>
              <p className="text-muted-foreground mt-1" data-testid="text-marketplace-subtitle">
                Discover brand campaigns and start earning from your content
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" data-testid="badge-creator-status">
                {user?.plan === 'premium' ? 'Premium Member' : 'Free Member'}
              </Badge>
              <Badge variant="outline" data-testid="badge-active-reservations">
                {(reservations as AdReservation[]).length} Active Reservations
              </Badge>
            </div>
          </div>

          {/* Search and Filters */}
          <Card data-testid="card-search-filters">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search campaigns by brand or title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-campaigns"
                  />
                </div>
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-country-filter">
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
            </CardContent>
          </Card>

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
            <TabsList className="w-full max-w-4xl flex md:grid md:grid-cols-5 overflow-x-auto md:overflow-x-visible gap-1 scrollbar-hide">
              <TabsTrigger value="youtube-dashboard" data-testid="tab-youtube" className="text-xs md:text-sm whitespace-nowrap min-w-fit">
                YouTube Creator
              </TabsTrigger>
              <TabsTrigger value="campaigns" data-testid="tab-available" className="text-xs md:text-sm whitespace-nowrap min-w-fit">
                Available Campaigns
              </TabsTrigger>
              <TabsTrigger value="my-campaigns" data-testid="tab-my-campaigns" className="text-xs md:text-sm whitespace-nowrap min-w-fit">
                My Campaigns
              </TabsTrigger>
              <TabsTrigger value="earnings" data-testid="tab-earnings" className="text-xs md:text-sm whitespace-nowrap min-w-fit">
                Earnings
              </TabsTrigger>
              <TabsTrigger value="payout-history" data-testid="tab-payout-history" className="text-xs md:text-sm whitespace-nowrap min-w-fit">
                Payment History
              </TabsTrigger>
            </TabsList>

            {/* YouTube Creator Dashboard */}
            <TabsContent value="youtube-dashboard" className={!canAccessAnalytics ? "relative group" : ""}>
              {!canAccessAnalytics && (
                <div className="absolute inset-0 bg-red-500/10 z-20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 pointer-events-none">
                  <div className="bg-red-500 text-white p-6 rounded-full shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
              )}
              <YouTubeCreatorSection user={user} />
            </TabsContent>

            {/* Available Campaigns */}
            <TabsContent value="campaigns" className="space-y-6">
              {/* User Tier Information */}
              {(user as any)?.youtubeVerified && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-900">Your Creator Tier</h3>
                      <p className="text-sm text-blue-700">
                        You can access campaigns from Tier 1 to Tier {(user as any)?.youtubeTier || 1}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-blue-600 text-white text-lg px-4 py-2">
                        Tier {(user as any)?.youtubeTier || 1}
                      </Badge>
                      <p className="text-xs text-blue-600 mt-1">
                        {((user as any)?.youtubeSubscribers || 0).toLocaleString()} subscribers
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {adsLoading ? (
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
              ) : (filteredAds as Ad[]).length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(filteredAds as Ad[]).map((ad: Ad) => (
                    <Card 
                      key={ad.id} 
                      className={`travel-card ${isStandard ? 'group cursor-pointer hover:shadow-lg transition-all duration-300' : ''}`}
                      data-testid={`card-ad-${ad.id}`}
                    >
                      {/* Hover X Indicator for Non-Premium Users (including FREE_CREATOR) */}
                      {shouldShowLocks && (
                        <div className="absolute inset-0 bg-red-500/10 z-20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 pointer-events-none">
                          <div className="bg-red-500 text-white p-4 rounded-full shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-card-foreground" data-testid={`text-ad-title-${ad.id}`}>
                              {ad.title}
                            </h3>
                            <p className="text-sm text-muted-foreground" data-testid={`text-ad-brand-${ad.id}`}>
                              by {ad.brand}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <Badge className="bg-chart-2 text-primary" data-testid={`badge-ad-payout-${ad.id}`}>
                              £{ad.payoutAmount}
                            </Badge>
                            <Badge 
                              variant="secondary" 
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1" 
                              data-testid={`badge-ad-tier-${ad.id}`}
                            >
                              Tier {(ad as any).tierLevel || 1}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Requirements</h4>
                          <div className="text-sm text-muted-foreground" data-testid={`text-ad-brief-${ad.id}`}>
                            {ad.briefMd.slice(0, 150)}...
                          </div>
                        </div>

                        {ad.countries && ad.countries.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              Locations
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {ad.countries.slice(0, 3).map((country, index) => (
                                <Badge key={index} variant="outline" className="text-xs" data-testid={`badge-ad-country-${ad.id}-${index}`}>
                                  {country}
                                </Badge>
                              ))}
                              {ad.countries.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{ad.countries.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {ad.hashtags && ad.hashtags.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm flex items-center">
                              <Tag className="w-3 h-3 mr-1" />
                              Hashtags
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {ad.hashtags.slice(0, 3).map((hashtag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs" data-testid={`badge-ad-hashtag-${ad.id}-${index}`}>
                                  #{hashtag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span data-testid={`text-ad-deadline-${ad.id}`}>
                              Due {format(new Date(ad.deadlineAt), 'MMM d')}
                            </span>
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <span data-testid={`text-ad-quota-${ad.id}`}>
                              {ad.currentReservations}/{ad.quota} reserved
                            </span>
                          </div>
                        </div>

                        <Dialog open={isReserveDialogOpen} onOpenChange={setIsReserveDialogOpen}>
                          <DialogTrigger asChild>
                            <div className="relative group">
                              <Button 
                                size="sm" 
                                className={`w-full ${!canReserveAds ? 'bg-gray-400 cursor-not-allowed' : 'bg-accent hover:bg-accent/90'}`}
                                disabled={!canReserveAds || reserveAdMutation.isPending || (ad.currentReservations || 0) >= (ad.quota || 1)}
                                data-testid={`button-reserve-ad-${ad.id}`}
                              >
                                {reserveAdMutation.isPending ? (
                                  <div className="animate-spin w-3 h-3 border-2 border-accent-foreground border-t-transparent rounded-full" />
                                ) : !canApplyCampaigns ? (
                                  "Premium Required to Reserve"
                                ) : !isYouTubeVerifiedForReservations ? (
                                  "Channel Not Verified"
                                ) : (
                                  "Reserve Campaign"
                                )}
                              </Button>
                              
                              {/* Hover tooltip for unverified channels */}
                              {canApplyCampaigns && !isYouTubeVerifiedForReservations && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-yellow-600 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                  <div className="text-center">
                                    <div className="font-semibold">Channel Not Verified</div>
                                    <div className="text-xs">Verify your YouTube channel to reserve campaigns</div>
                                  </div>
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-yellow-600"></div>
                                </div>
                              )}
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-xl">{ad.title}</DialogTitle>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">by {ad.brand}</span>
                                <div className="flex items-center gap-3">
                                  <Badge className="bg-chart-2 text-primary text-lg px-3 py-1">£{ad.payoutAmount}</Badge>
                                  <Badge 
                                    variant="secondary" 
                                    className="bg-blue-100 text-blue-800 text-sm px-3 py-1"
                                  >
                                    Tier {(ad as any).tierLevel || 1}
                                  </Badge>
                                </div>
                              </div>
                            </DialogHeader>
                            
                            <div className="space-y-6">
                              {/* Campaign Brief */}
                              <div>
                                <h4 className="font-semibold mb-3 text-lg">Campaign Brief</h4>
                                <div className="prose prose-sm text-foreground" dangerouslySetInnerHTML={{ __html: ad.briefMd }} />
                              </div>

                              {/* Promotion Instructions */}
                              <div className="bg-muted/50 p-4 rounded-lg border">
                                <h4 className="font-semibold mb-3 text-lg flex items-center">
                                  <span className="w-2 h-2 bg-accent rounded-full mr-2"></span>
                                  How to Promote This Campaign
                                </h4>
                                <div className="space-y-3 text-sm">
                                  <p className="text-foreground leading-relaxed">
                                    <strong>Step 1:</strong> Download the brand assets and promotional materials below
                                  </p>
                                  <p className="text-foreground leading-relaxed">
                                    <strong>Step 2:</strong> Create your content (photo/video) featuring the brand naturally
                                  </p>
                                  <p className="text-foreground leading-relaxed">
                                    <strong>Step 3:</strong> Include the promotional file/image in your content or mention the brand verbally
                                  </p>
                                  <p className="text-foreground leading-relaxed">
                                    <strong>Step 4:</strong> Create a clip starting 5 seconds before this promotion begins and ending 5 seconds after it finishes - upload this specific segment
                                  </p>
                                  <p className="text-foreground leading-relaxed">
                                    <strong>Step 5:</strong> Upload your final promotion clip and your content link for approval to receive payment
                                  </p>
                                </div>
                              </div>

                              {/* Download Promotional File */}
                              <div className="bg-accent/10 p-4 rounded-lg">
                                <h4 className="font-semibold mb-3 flex items-center">
                                  <Download className="w-4 h-4 mr-2" />
                                  Download Promotional File
                                </h4>
                                <Button variant="outline" size="lg" className="w-full justify-center">
                                  <Download className="w-4 h-4 mr-2" />
                                  Download File
                                </Button>
                              </div>


                              {/* Campaign Stats */}
                              <div className="flex items-center justify-between pt-4 border-t">
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  Deadline: {format(new Date(ad.deadlineAt), 'MMM d, yyyy')}
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <span>{ad.currentReservations}/{ad.quota} spots reserved</span>
                                </div>
                              </div>

                              {/* Reserve Button */}
                              <div className="pt-4">
                                <Button 
                                  size="lg" 
                                  className={`w-full text-lg py-6 ${canReserveAds ? 'bg-accent hover:bg-accent/90' : 'bg-gray-400 cursor-not-allowed'}`}
                                  onClick={() => {
                                    if (canReserveAds) {
                                      reserveAdMutation.mutate(ad.id);
                                    }
                                  }}
                                  disabled={!canReserveAds || reserveAdMutation.isPending || (ad.currentReservations || 0) >= (ad.quota || 1)}
                                >
                                  {reserveAdMutation.isPending ? (
                                    <div className="animate-spin w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full" />
                                  ) : (
                                    `Reserve This Campaign for £${ad.payoutAmount}`
                                  )}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card data-testid="card-no-campaigns">
                  <CardContent className="p-12 text-center">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No campaigns available</h3>
                    <p className="text-muted-foreground">
                      No brand campaigns match your filters. Try adjusting your search criteria.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* My Campaigns */}
            <TabsContent value="my-campaigns" className="space-y-6">
              {reservationsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6 space-y-4">
                        <div className="h-6 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (reservations as AdReservation[]).length > 0 ? (
                <div className="space-y-4">
                  {(reservations as AdReservation[]).map((reservation: AdReservation) => (
                    <Card 
                      key={reservation.id} 
                      className={`border-accent ${isStandard ? 'group relative' : ''}`} 
                      data-testid={`card-reservation-${reservation.id}`}
                    >
                      {isStandard && (
                        <div className="absolute inset-0 bg-red-500/10 z-20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 pointer-events-none">
                          <div className="bg-red-500 text-white p-4 rounded-full shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-bold text-card-foreground" data-testid={`text-reservation-title-${reservation.id}`}>
                                Campaign Reserved
                              </h3>
                              <Badge 
                                variant={reservation.status === 'active' ? 'default' : 'secondary'}
                                data-testid={`badge-reservation-status-${reservation.id}`}
                              >
                                {reservation.status}
                              </Badge>
                              <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => setSelectedReservation(reservation)}
                                  >
                                    <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center space-x-2">
                                      <Eye className="h-5 w-5" />
                                      <span>Campaign Details</span>
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                                      <div className="flex items-start space-x-3">
                                        <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                                        <div>
                                          <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                                            Important Deadline Notice
                                          </h4>
                                          <p className="text-sm text-orange-700 dark:text-orange-300">
                                            If you don't submit your content within the countdown time, your ad reservation will be removed and the campaign will return to the available listings for other creators.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="text-center">
                                      <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                                        Time Remaining: {campaignCountdowns[reservation.id] || "Loading..."}
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center text-sm font-medium text-foreground bg-red-50 dark:bg-red-950 px-3 py-1 rounded-full border border-red-200 dark:border-red-800">
                                <Clock className="w-4 h-4 mr-2 text-red-600" />
                                <span className="text-red-700 dark:text-red-300">
                                  {campaignCountdowns[reservation.id] || "Loading..."}
                                </span>
                              </div>
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                ⏰ 5 Days Campaign
                              </Badge>
                            </div>
                          </div>

                          {reservation.status === 'active' && (
                            <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  className="bg-chart-2 hover:bg-chart-2/90"
                                  onClick={() => setSelectedAd({ id: reservation.adId! } as Ad)}
                                  data-testid={`button-submit-content-${reservation.id}`}
                                >
                                  Submit Content
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Submit Campaign Content</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <p className="text-muted-foreground">
                                    Upload your final video or image content and provide the link to your post for admin review.
                                  </p>
                                  
                                  {/* Content Link Input */}
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                      Content Link (Instagram, TikTok, YouTube, etc.)
                                    </label>
                                    <Input
                                      type="url"
                                      placeholder="https://www.instagram.com/p/..."
                                      value={contentLink}
                                      onChange={(e) => setContentLink(e.target.value)}
                                      className="w-full"
                                    />
                                  </div>
                                  
                                  <ObjectUploader
                                    maxNumberOfFiles={1}
                                    maxFileSize={100 * 1024 * 1024} // 100MB
                                    onGetUploadParameters={handleMediaUpload}
                                    onComplete={handleMediaComplete}
                                    buttonClassName="w-full bg-accent hover:bg-accent/90"
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Content File
                                  </ObjectUploader>

                                  <p className="text-xs text-muted-foreground">
                                    Supported formats: MP4, MOV, JPG, PNG. Max size: 100MB
                                  </p>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card data-testid="card-no-reservations">
                  <CardContent className="p-12 text-center">
                    <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No active campaigns</h3>
                    <p className="text-muted-foreground mb-6">
                      You haven't reserved any campaigns yet. Browse available campaigns to get started.
                    </p>
                    <Button variant="outline" data-testid="button-browse-campaigns">
                      Browse Campaigns
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Earnings Tab */}
            <TabsContent value="earnings" className={`space-y-6 ${!canAccessAnalytics ? 'relative group' : ''}`}>
              {!canAccessAnalytics && (
                <div className="absolute inset-0 bg-red-500/10 z-20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 pointer-events-none">
                  <div className="bg-red-500 text-white p-6 rounded-full shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
              )}
              <div className="grid gap-6">
                {/* Earnings Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">This Month</p>
                          <p className="text-2xl font-bold text-green-600">$1,245</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Available</p>
                          <p className="text-2xl font-bold text-blue-600">$890</p>
                        </div>
                        <Banknote className="w-8 h-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Pending</p>
                          <p className="text-2xl font-bold text-orange-600">$355</p>
                        </div>
                        <Clock className="w-8 h-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Earned</p>
                          <p className="text-2xl font-bold text-purple-600">$8,750</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Withdraw Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Request Payout
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Available for withdrawal:</strong> $890.00
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Minimum withdrawal amount: $500
                      </p>
                    </div>
                    
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="payout-amount">Amount (£)</Label>
                        <Input
                          id="payout-amount"
                          type="number"
                          placeholder="100.00"
                          min="100"
                          max="890"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="payout-method">Payout Method</Label>
                        <Select defaultValue="bank">
                          <SelectTrigger>
                            <SelectValue placeholder="Select payout method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stripe">Stripe Express</SelectItem>
                            <SelectItem value="bank">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="account-details">Account Details</Label>
                        <Input
                          id="account-details"
                          placeholder="Account number or email"
                        />
                      </div>

                      <Button className="w-full md:w-auto">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Request Payout
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Payment History Tab */}
            <TabsContent value="payout-history" className={`space-y-6 ${!canAccessPayouts ? 'relative group' : ''}`}>
              {!canAccessPayouts && (
                <div className="absolute inset-0 bg-red-500/10 z-20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 pointer-events-none">
                  <div className="bg-red-500 text-white p-6 rounded-full shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
              )}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Payment History Table */}
                    <div className="border rounded-lg">
                      <div className="grid grid-cols-5 gap-4 p-4 bg-muted font-medium text-sm">
                        <div>Date</div>
                        <div>Amount</div>
                        <div>Method</div>
                        <div>Status</div>
                        <div>Reference</div>
                      </div>
                      
                      {/* Sample payment entries */}
                      <div className="grid grid-cols-5 gap-4 p-4 border-t hover:bg-muted/50">
                        <div className="text-sm">
                          <div>Dec 15, 2024</div>
                          <div className="text-muted-foreground">14:30</div>
                        </div>
                        <div className="font-semibold text-green-600">$450.00</div>
                        <div className="text-sm">
                          <div>Bank Transfer</div>
                          <div className="text-muted-foreground">****1234</div>
                        </div>
                        <div>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">TXN_8745</div>
                      </div>

                      <div className="grid grid-cols-5 gap-4 p-4 border-t hover:bg-muted/50">
                        <div className="text-sm">
                          <div>Nov 28, 2024</div>
                          <div className="text-muted-foreground">09:15</div>
                        </div>
                        <div className="font-semibold text-green-600">$320.00</div>
                        <div className="text-sm">
                          <div>Stripe</div>
                          <div className="text-muted-foreground">creator@email.com</div>
                        </div>
                        <div>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">TXN_8621</div>
                      </div>

                      <div className="grid grid-cols-5 gap-4 p-4 border-t hover:bg-muted/50">
                        <div className="text-sm">
                          <div>Nov 12, 2024</div>
                          <div className="text-muted-foreground">16:45</div>
                        </div>
                        <div className="font-semibold text-orange-600">$275.00</div>
                        <div className="text-sm">
                          <div>Bank Transfer</div>
                          <div className="text-muted-foreground">****1234</div>
                        </div>
                        <div>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            Processing
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">TXN_8456</div>
                      </div>

                      <div className="grid grid-cols-5 gap-4 p-4 border-t hover:bg-muted/50">
                        <div className="text-sm">
                          <div>Oct 30, 2024</div>
                          <div className="text-muted-foreground">11:20</div>
                        </div>
                        <div className="font-semibold text-green-600">$180.00</div>
                        <div className="text-sm">
                          <div>Stripe Express</div>
                          <div className="text-muted-foreground">acct_****xyz</div>
                        </div>
                        <div>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">TXN_8234</div>
                      </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">$1,225</div>
                          <div className="text-sm text-muted-foreground">Total Paid Out</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">4</div>
                          <div className="text-sm text-muted-foreground">Completed Payouts</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600">1</div>
                          <div className="text-sm text-muted-foreground">Pending Payouts</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Countdown Overlay with Smooth Transitions */}
      {showCountdownOverlay && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50" 
          style={{ opacity: overlayOpacity, transition: 'all 500ms ease-in-out' }}
          data-testid="countdown-overlay"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 max-w-lg mx-4 text-center shadow-2xl border-4 border-green-500 transform transition-all duration-500 ease-in-out">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Clock className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-3">
              🎯 Campaign Reserved!
            </h3>
            <p className="text-xl text-green-500 dark:text-green-300 mb-6 font-semibold">
              ⏰ Live Countdown
            </p>
            <div className="bg-green-50 dark:bg-green-950/50 p-4 rounded-lg border-2 border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center space-x-3 text-green-700 dark:text-green-300">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                <span className="font-bold text-lg font-mono tracking-wider">
                  {liveCountdown || "4d 23h 59m 59s"}
                </span>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}