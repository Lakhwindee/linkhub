import { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Eye, ArrowRight, Users, Target, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

export default function PaymentSuccess() {
  const { campaignId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch campaign details
  const { data: campaign, isLoading } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}`],
    enabled: !!campaignId,
  });

  // Default campaign structure for TypeScript
  const defaultCampaign = {
    title: '',
    description: '',
    brand: '',
    tierLevel: 1,
    numberOfInfluencers: 1,
    totalBudget: 0,
    adImageUrl: '',
    reservedInfluencers: 0,
    completedInfluencers: 0,
  };

  const campaignData = campaign || defaultCampaign;

  useEffect(() => {
    // Show success toast when component mounts
    toast({
      title: "🎉 Campaign Created Successfully!",
      description: "Your campaign is now live and visible to creators.",
    });
  }, [toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold mb-4">Campaign Not Found</h2>
              <Button onClick={() => navigate('/publisher/ads')}>
                Back to Campaigns
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto pt-20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-700 dark:text-green-400 mb-2">
            Payment Successful! 🎉
          </h1>
          <p className="text-lg text-muted-foreground">
            Your campaign is now live and available to creators
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Campaign Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-500" />
                Campaign Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{campaignData.title}</h3>
                <p className="text-muted-foreground">{campaignData.description || campaignData.briefMd}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <Users className="w-5 h-5 mx-auto mb-1 text-green-600" />
                  <div className="text-sm font-medium">{campaignData.numberOfInfluencers || campaignData.maxInfluencers}</div>
                  <div className="text-xs text-muted-foreground">Target Influencers</div>
                </div>
                
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <DollarSign className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                  <div className="text-sm font-medium">${Number(campaignData.totalBudget).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Total Budget</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  ✅ Live & Active
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reservations:</span>
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  {campaignData.reservedInfluencers || campaignData.currentReservations || 0}/{campaignData.numberOfInfluencers || campaignData.maxInfluencers}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-blue-500" />
                What's Next?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-medium">Campaign is Live</h4>
                    <p className="text-sm text-muted-foreground">Creators can now discover and reserve your campaign</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-medium">Track Reservations</h4>
                    <p className="text-sm text-muted-foreground">Monitor how many creators have reserved your campaign</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-medium">Review & Approve</h4>
                    <p className="text-sm text-muted-foreground">Approve creator submissions and track completion</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button 
                  onClick={() => navigate('/publisher/ads')} 
                  className="w-full"
                  size="lg"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View My Campaigns
                </Button>

                <Button 
                  onClick={() => navigate('/ads')} 
                  variant="outline"
                  className="w-full"
                >
                  Browse All Campaigns
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">🚀 Campaign is Live!</h3>
              <p className="text-sm text-muted-foreground">
                Your campaign is now visible to {campaignData.numberOfInfluencers || campaignData.maxInfluencers} target creators. 
                You'll receive notifications as creators reserve and complete your campaign.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}