import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, CheckCircle, DollarSign, Users, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';

export default function PaymentPage() {
  const { campaignId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Process payment mutation
  const paymentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/campaigns/${campaignId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Payment failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful! 🎉",
        description: "Your campaign is now live and available to creators.",
      });
      // Redirect to success page, which then redirects to active campaigns
      navigate(`/payment/success/${campaignId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      paymentMutation.mutate();
    } finally {
      setIsProcessing(false);
    }
  };

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
              <Button onClick={() => navigate('/ads')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Campaigns
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto pt-20">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/ads')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Campaign Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Campaign Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{campaignData.title}</h3>
                <p className="text-muted-foreground">{campaignData.description || campaignData.briefMd}</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brand:</span>
                  <span className="font-medium">{campaignData.brand}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tier Level:</span>
                  <Badge variant="secondary">Tier {campaignData.tierLevel}</Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Influencers:</span>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{campaignData.numberOfInfluencers || campaignData.maxInfluencers}</span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  {campaignData.status === 'active' ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      ✅ Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      Pending Payment
                    </Badge>
                  )}
                </div>
              </div>

              {campaignData.adImageUrl && (
                <div>
                  <img 
                    src={campaignData.adImageUrl} 
                    alt="Campaign creative"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-500" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Campaign Cost ({campaignData.numberOfInfluencers || campaignData.maxInfluencers} influencers)</span>
                  <span>${(Number(campaignData.totalBudget) * 0.9).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Platform Fee (10%)</span>
                  <span>${(Number(campaignData.totalBudget) * 0.1).toFixed(2)}</span>
                </div>
                
                <hr />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-green-600">${Number(campaignData.totalBudget).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Info message for publishers */}
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Ready to Launch</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    💡 Your campaign will be live immediately after payment and visible to all creators in your target tier.
                  </p>
                </div>

                {campaignData.status === 'active' ? (
                  <Button disabled className="w-full text-lg py-6" size="lg">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    Campaign Already Active
                  </Button>
                ) : (
                  <Button 
                    onClick={handlePayment}
                    disabled={isProcessing || paymentMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
                    size="lg"
                  >
                    {isProcessing || paymentMutation.isPending ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Pay ${Number(campaignData.totalBudget).toFixed(2)} & Launch Campaign
                      </>
                    )}
                  </Button>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  Secure payment powered by Stripe. Your campaign will activate immediately.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}