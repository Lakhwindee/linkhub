import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckIcon, DollarSign, Star, Heart, Users, MapPin, MessageCircle, Calendar, Crown, Zap, Tag, PartyPopper, Gift, Mail } from "lucide-react";
import { Link } from "wouter";

// Load Stripe (only if key is available)
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const CheckoutForm = ({ plan }: { plan: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/billing?success=true`,
        cancel_url: `${window.location.origin}/billing?cancelled=true`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" className="w-full bg-accent hover:bg-accent/90" data-testid="button-complete-payment">
        Complete Subscription
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successDetails, setSuccessDetails] = useState<any>(null);

  // Allow unauthenticated users to view the subscription page
  // Authentication will be required when they try to subscribe

  const plans = [
    {
      id: "premium",
      name: "Premium",
      description: "Full access to all features and earn money",
      price: "$45",
      period: "per month",
      popular: true,
      icon: Star,
      color: "bg-chart-2",
      features: [
        "Full map access with travelers worldwide",
        "Send connect requests to any user",
        "Direct messaging with connections",
        "Create and join travel events",
        "✨ Access to Campaign Marketplace",
        "✨ Apply to brand advertising campaigns",
        "✨ Earnings dashboard and analytics",
        "✨ Campaign performance tracking",
        "✨ Priority campaign notifications",
        "✨ Creator verification features",
        "✨ Advanced earning tools",
        "✨ Priority customer support"
      ]
    }
  ];

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) {
      toast({
        title: "Enter promo code",
        description: "Please enter a promo code to validate",
        variant: "default",
      });
      return;
    }

    setIsValidatingPromo(true);
    try {
      const response = await apiRequest("POST", "/api/promo-code/validate", { 
        code: promoCode.trim().toUpperCase() 
      });
      const data = await response.json();
      
      if (data.valid) {
        setAppliedPromo(data.promoDetails);
        toast({
          title: "Promo code applied!",
          description: data.promoDetails.discountType === 'trial' 
            ? `${data.promoDetails.trialPeriodDays}-day free trial activated!`
            : `${data.promoDetails.discountValue}% discount applied!`,
          variant: "default",
        });
      } else {
        toast({
          title: "Invalid code",
          description: data.message || "This promo code is not valid",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Validation failed",
        description: (error as Error).message || "Failed to validate promo code",
        variant: "destructive",
      });
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    // Show message if not authenticated
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      toast({
        title: "Sign in required",
        description: "Please sign in or create an account to subscribe to Premium",
        variant: "default",
      });
      return;
    }

    setSelectedPlan(planId);
    setIsProcessing(true);

    try {
      const payload: any = { plan: planId };
      if (appliedPromo) {
        payload.promoCode = promoCode.trim().toUpperCase();
      }
      
      const response = await apiRequest("POST", "/api/billing/checkout", payload);
      const data = await response.json();
      
      if (data.success && data.autoDebitEnabled === false) {
        // Direct trial activation without payment - show success dialog
        setSuccessDetails({
          planName: planId.charAt(0).toUpperCase() + planId.slice(1),
          trialDays: appliedPromo?.trialPeriodDays || 30,
          promoCode: promoCode.trim().toUpperCase(),
          message: data.message
        });
        setShowSuccessDialog(true);
      } else if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      }
    } catch (error) {
      if (isUnauthorizedError(error as Error)) {
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
        title: "Checkout Failed",
        description: (error as Error).message || "Failed to start checkout process.",
        variant: "destructive",
      });
      setSelectedPlan(null);
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

  // If user already has a paid plan
  if (user && user.plan && user.plan !== 'free') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Crown className="w-8 h-8 text-chart-2" />
              <h1 className="text-3xl font-bold text-foreground" data-testid="heading-current-plan">
                You're a {user.plan} member!
              </h1>
            </div>
            <p className="text-xl text-muted-foreground" data-testid="text-current-plan-description">
              You already have an active subscription. Manage your billing in your account settings.
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            <Button asChild data-testid="button-manage-billing">
              <Link href="/billing">Manage Billing</Link>
            </Button>
            <Button variant="outline" asChild data-testid="button-back-home">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show payment form if client secret is available
  if (clientSecret) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-foreground" data-testid="heading-complete-subscription">
              Complete Your Subscription
            </h1>
            <p className="text-muted-foreground">
              You're subscribing to the <span className="font-semibold text-accent">{selectedPlan}</span> plan
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm plan={selectedPlan!} />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <DollarSign className="w-8 h-8 text-chart-2" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground" data-testid="heading-subscribe">
              Upgrade Your Travel Experience
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-subscribe-description">
            Choose the perfect plan to unlock premium features and start earning from your travel content
          </p>
          {user && (
            <div className="flex items-center justify-center space-x-2">
              <Badge variant="secondary" data-testid="badge-current-plan">
                Currently: {user.plan} Plan
              </Badge>
            </div>
          )}
        </div>

        {/* Subscription Plans */}
        <div className="flex justify-center items-center">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative border-2 transition-all duration-300 w-full max-w-md ${
                plan.popular 
                  ? 'border-accent shadow-lg scale-105' 
                  : 'border-border hover:border-accent/50'
              }`}
              data-testid={`card-plan-${plan.id}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-accent text-accent-foreground px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center mb-4">
                  <div className={`w-16 h-16 ${plan.color} rounded-full flex items-center justify-center`}>
                    <plan.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl" data-testid={`heading-plan-${plan.id}`}>
                  {plan.name}
                </CardTitle>
                <p className="text-muted-foreground" data-testid={`text-plan-description-${plan.id}`}>
                  {plan.description}
                </p>
                <div className="space-y-1">
                  <div className="text-4xl font-bold text-foreground" data-testid={`text-plan-price-${plan.id}`}>
                    {plan.price}
                  </div>
                  <div className="text-sm text-muted-foreground" data-testid={`text-plan-period-${plan.id}`}>
                    {plan.period}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Promo Code Input */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <label className="text-sm font-medium text-foreground">Have a promo code?</label>
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter code (e.g. TRIAL30)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      disabled={!!appliedPromo}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleValidatePromo}
                      disabled={isValidatingPromo || !!appliedPromo || !promoCode.trim()}
                      variant="outline"
                      className="min-w-20"
                    >
                      {isValidatingPromo ? (
                        <div className="animate-spin w-4 h-4 border-2 border-accent border-t-transparent rounded-full" />
                      ) : appliedPromo ? (
                        "Applied"
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                  {appliedPromo && (
                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-2">
                        <CheckIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                          {appliedPromo.discountType === 'trial' 
                            ? `${appliedPromo.trialPeriodDays}-Day Free Trial Applied!`
                            : `${appliedPromo.discountValue}% Discount Applied!`
                          }
                        </span>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1 ml-6">
                        {appliedPromo.description || 'Promo code activated successfully'}
                      </p>
                    </div>
                  )}
                </div>

                {!isAuthenticated && showLoginPrompt ? (
                  <div className="space-y-3">
                    <p className="text-sm text-center text-muted-foreground">
                      Sign in with Google to subscribe to Premium
                    </p>
                    <Button
                      onClick={() => window.location.href = "/api/login"}
                      variant="default"
                      className="w-full bg-accent hover:bg-accent/90"
                    >
                      Sign In with Google
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className={`w-full h-12 ${
                      plan.popular 
                        ? 'bg-accent hover:bg-accent/90' 
                        : 'bg-primary hover:bg-primary/90'
                    }`}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isProcessing}
                    data-testid={`button-select-plan-${plan.id}`}
                  >
                    {isProcessing && selectedPlan === plan.id ? (
                      <div className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                    ) : (
                      <Zap className="w-5 h-5 mr-2" />
                    )}
                    {appliedPromo && appliedPromo.discountType === 'trial' 
                      ? `Start ${appliedPromo.trialPeriodDays}-Day Free Trial`
                      : 'Get Premium'
                    }
                  </Button>
                )}

                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">What's included:</h4>
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3" data-testid={`div-plan-feature-${plan.id}-${index}`}>
                        <CheckIcon className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan-specific highlights */}
                {plan.id === 'premium' && (
                  <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="font-semibold text-yellow-800 dark:text-yellow-200 text-sm">
                        Complete Travel & Earning Experience
                      </span>
                    </div>
                    <p className="text-yellow-700 dark:text-yellow-300 text-xs">
                      Full access to all features plus earn money from brand campaigns.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Plan Comparison */}
        <Card className="max-w-5xl mx-auto" data-testid="card-plan-comparison">
          <CardHeader>
            <CardTitle className="text-center">Plan Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 font-semibold">Features</th>
                    <th className="text-center py-3 font-semibold">Free</th>
                    <th className="text-center py-3 font-semibold">Premium</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-border">
                    <td className="py-3">Global feed access</td>
                    <td className="text-center py-3"><CheckIcon className="w-4 h-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-3"><CheckIcon className="w-4 h-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3">Full map access</td>
                    <td className="text-center py-3"><CheckIcon className="w-4 h-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-3"><CheckIcon className="w-4 h-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3">Connect requests & DM</td>
                    <td className="text-center py-3"><CheckIcon className="w-4 h-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-3"><CheckIcon className="w-4 h-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3">Create & join events</td>
                    <td className="text-center py-3"><CheckIcon className="w-4 h-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-3"><CheckIcon className="w-4 h-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3">Ad Marketplace</td>
                    <td className="text-center py-3"><CheckIcon className="w-4 h-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-3"><CheckIcon className="w-4 h-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3">Earnings & payouts</td>
                    <td className="text-center py-3 text-red-500">✗</td>
                    <td className="text-center py-3"><CheckIcon className="w-4 h-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3">Priority support</td>
                    <td className="text-center py-3"><CheckIcon className="w-4 h-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-3"><CheckIcon className="w-4 h-4 text-green-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="max-w-4xl mx-auto" data-testid="card-faq">
          <CardHeader>
            <CardTitle className="text-center">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Can I change plans later?</h4>
                  <p className="text-sm text-muted-foreground">
                    Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">How do creator payouts work?</h4>
                  <p className="text-sm text-muted-foreground">
                    Complete brand campaigns, get admin approval, and request payouts to your bank account via Stripe.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Is there a free trial?</h4>
                  <p className="text-sm text-muted-foreground">
                    Yes! All paid plans come with a 7-day free trial. Cancel anytime during the trial period.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Which currencies are supported?</h4>
                  <p className="text-sm text-muted-foreground">
                    We support USD, GBP (UK) and INR (India) with automatic currency detection based on your location.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Button variant="outline" asChild data-testid="button-back-to-home">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-bounce">
              <PartyPopper className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🎉 Congratulations!
            </DialogTitle>
            <DialogDescription className="text-base">
              You're now a Premium member!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-900 dark:text-purple-100">Trial Activated</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your <strong className="text-purple-600">{successDetails?.trialDays}-day free trial</strong> of {successDetails?.planName} plan has started!
              </p>
            </div>

            {successDetails?.promoCode && (
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-900 dark:text-green-100">Promo Code Applied</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Code: <strong className="text-green-600">{successDetails.promoCode}</strong>
                </p>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900 dark:text-blue-100">Confirmation Email Sent</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Check your inbox for trial details and premium features guide.
              </p>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">✨ What's Next:</p>
              <ul className="space-y-1 ml-4">
                <li>• Explore all premium features</li>
                <li>• Start applying to brand campaigns</li>
                <li>• Connect with travelers worldwide</li>
                <li>• Manage your trial in billing dashboard</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => {
                setShowSuccessDialog(false);
                window.location.href = "/feed";
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              Explore Premium Features
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setShowSuccessDialog(false);
                window.location.href = "/billing";
              }}
              className="w-full"
            >
              View Billing Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
