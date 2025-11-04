import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Download, DollarSign, Calendar, CheckCircle, AlertCircle, Crown, Star, Heart, Clock, Gift } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import type { Subscription, Invoice } from "@shared/schema";
import { PaymentMethodDialog } from "@/components/PaymentMethodDialog";
import { PayoutDialog } from "@/components/PayoutDialog";

export default function Billing() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);

  // Handle subscription success/cancel from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const cancelled = params.get('cancelled');
    
    if (success === 'true') {
      toast({
        title: "🎉 Subscription Activated!",
        description: "Welcome to Premium! A confirmation email has been sent to your inbox.",
        duration: 8000,
      });
      // Clear URL params
      window.history.replaceState({}, '', '/billing');
    } else if (cancelled === 'true') {
      toast({
        title: "Subscription Cancelled",
        description: "You can subscribe anytime from the Subscribe page.",
        variant: "default",
        duration: 5000,
      });
      // Clear URL params
      window.history.replaceState({}, '', '/billing');
    }
  }, [toast]);

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

  // Fetch billing data
  const { data: billingData, isLoading: billingLoading } = useQuery({
    queryKey: ["/api/billing"],
    retry: false,
  });

  // Fetch wallet data for creators
  const { data: walletData } = useQuery({
    queryKey: ["/api/wallet"],
    enabled: user?.plan === 'creator',
    retry: false,
  });


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

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'creator':
        return <Star className="w-5 h-5 text-chart-2" />;
      case 'traveler':
        return <Heart className="w-5 h-5 text-blue-500" />;
      default:
        return <Crown className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'creator':
        return 'border-chart-2 bg-yellow-50 dark:bg-yellow-950';
      case 'traveler':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      default:
        return 'border-muted';
    }
  };

  // Show different content for publishers
  if (user.role === 'publisher') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Publisher Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2">
                <DollarSign className="w-8 h-8 text-green-500" />
                <span>Publisher Earnings & Payments</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your earnings, payouts, and payment methods
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                Publisher Account
              </Badge>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Earnings Overview */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    <span>Earnings Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No earnings yet</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      Start creating content or listing stays to earn revenue.
                    </p>
                    <Button variant="outline">
                      <Calendar className="w-4 h-4 mr-2" />
                      View Earning Opportunities
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="font-semibold text-foreground mb-2">No transaction history yet</h3>
                    <p className="text-muted-foreground text-sm">
                      Your transaction history will appear here once you start earning.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Payment Methods</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">
                        ST
                      </div>
                      <div>
                        <p className="font-medium">Stripe</p>
                        <p className="text-sm text-muted-foreground">publisher@example.com</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">
                      Primary
                    </Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowPaymentMethodDialog(true)}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Add Payment Method
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payout Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Minimum Payout</label>
                    <p className="text-2xl font-bold">$500</p>
                    <p className="text-xs text-muted-foreground">Automatic payout when reached</p>
                  </div>
                  <Button variant="outline" className="w-full">
                    Change Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <PaymentMethodDialog 
            open={showPaymentMethodDialog}
            onOpenChange={setShowPaymentMethodDialog}
            onPaymentMethodAdded={() => {
              toast({
                title: "Payment Method Added",
                description: "Your payment method has been successfully added.",
              });
            }}
          />

          <PayoutDialog
            open={showPayoutDialog}
            onOpenChange={setShowPayoutDialog}
            availableBalance={0}
            onPayoutRequested={() => {
              toast({
                title: "Payout Requested",
                description: "Your payout request has been submitted and will be processed within 1-2 business days.",
              });
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2" data-testid="heading-billing">
              <CreditCard className="w-8 h-8 text-accent" />
              <span>Billing & Subscriptions</span>
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-billing-subtitle">
              Manage your subscription, billing, and earnings
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" data-testid="badge-current-plan">
              {user.plan} Plan
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Current Plan */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trial Status Card - Show if trial is active */}
            {user.trialActive && user.trialEndDate && (
              <Card className="border-2 border-orange-400 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950" data-testid="card-trial-status">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-orange-800 dark:text-orange-200">
                    <Gift className="w-5 h-5" />
                    <span>🎉 Trial Active</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Trial Ends</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(user.trialEndDate), 'PPP')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                        {Math.ceil((new Date(user.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                      </Badge>
                    </div>

                    <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Auto-Debit Status</p>
                          <p className="text-xs text-muted-foreground">
                            {user.autoDebitEnabled 
                              ? 'Will auto-renew after trial ends' 
                              : 'No auto-renewal - trial will simply expire'}
                          </p>
                        </div>
                        <Badge variant={user.autoDebitEnabled ? "default" : "secondary"}>
                          {user.autoDebitEnabled ? 'Auto-Debit ON' : 'Auto-Debit OFF'}
                        </Badge>
                      </div>
                    </div>

                    {!user.autoDebitEnabled && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              No payment required
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                              Your trial will automatically end on {format(new Date(user.trialEndDate), 'PP')}. 
                              To continue using premium features, subscribe before the trial ends.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {user.autoDebitEnabled && (
                      <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-start space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-900 dark:text-green-100">
                              Seamless transition
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                              Your subscription will automatically start after the trial period. 
                              You can cancel anytime before {format(new Date(user.trialEndDate), 'PP')}.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className={`border-2 ${getPlanColor(user.plan || 'free')}`} data-testid="card-current-subscription">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getPlanIcon(user.plan || 'free')}
                  <span>Current Plan: {user.plan}</span>
                  {user.trialActive && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                      Trial
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    {user.plan === 'free' 
                      ? "You're currently on the free plan. Upgrade to unlock premium features!"
                      : user.trialActive
                      ? "You're enjoying a trial of the premium plan. Explore all the features!"
                      : "You're subscribed to the premium plan. Enjoy all features!"}
                  </p>
                  {user.plan === 'free' && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <Button asChild className="bg-blue-500 hover:bg-blue-600" data-testid="button-upgrade-standard">
                        <Link href="/subscribe">
                          <Heart className="w-4 h-4 mr-2" />
                          Upgrade to Premium
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card data-testid="card-billing-history">
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
              </CardHeader>
              <CardContent>
                {billingLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center space-x-4">
                        <div className="h-4 bg-muted rounded w-24"></div>
                        <div className="h-4 bg-muted rounded w-32"></div>
                        <div className="h-4 bg-muted rounded w-16"></div>
                        <div className="h-4 bg-muted rounded w-20"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Invoice</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No billing history yet. Your invoices will appear here after subscription.
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Payment Method */}
            <Card data-testid="card-payment-method">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Payment Method</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground text-sm">
                    {user.plan === 'free' 
                      ? 'No payment method required for free plan'
                      : 'Add a payment method to manage your subscription'}
                  </p>
                  {user.plan !== 'free' && (
                    <Button variant="outline" size="sm" className="w-full mt-4" data-testid="button-add-payment">
                      Add Payment Method
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Creator Tax Summary - Only for Creator Plan */}
            {user.plan === 'creator' && walletData?.wallet && (
              <Card className="border-purple-200 dark:border-purple-800" data-testid="card-creator-tax">
                <CardHeader className="bg-purple-50 dark:bg-purple-950">
                  <CardTitle className="flex items-center space-x-2 text-purple-800 dark:text-purple-200">
                    <DollarSign className="w-5 h-5" />
                    <span>Tax Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Earned (Gross)</span>
                      <span className="text-sm font-semibold">
                        £{((walletData.wallet.totalEarnedMinor || 0) / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-red-600">
                      <span className="text-sm">Tax Withheld</span>
                      <span className="text-sm font-semibold">
                        -£{((walletData.wallet.totalTaxWithheldMinor || 0) / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Net Received</span>
                        <span className="text-lg font-bold text-green-600">
                          £{((walletData.wallet.balanceMinor || 0) / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="text-xs text-muted-foreground mb-2">
                      Your Country: {user.country || 'GB'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tax is automatically calculated based on your country's tax regulations.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Calendar className="w-4 h-4 mr-2" />
                    View Tax Records
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card data-testid="card-billing-actions">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {user.plan === 'free' ? (
                  <>
                    <Button variant="outline" className="w-full justify-start" asChild data-testid="button-upgrade-plans">
                      <Link href="/subscribe">
                        <Star className="w-4 h-4 mr-2" />
                        View Plans
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-download-invoices">
                      <Download className="w-4 h-4 mr-2" />
                      Download Invoices
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-billing-portal">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Billing Portal
                    </Button>
                    {user.plan === 'creator' && (
                      <Button variant="outline" className="w-full justify-start" data-testid="button-tax-documents">
                        <Download className="w-4 h-4 mr-2" />
                        Tax Documents
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Support */}
            <Card data-testid="card-billing-support">
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Have questions about your billing or subscription? We're here to help.
                </p>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full" data-testid="button-contact-support">
                    Contact Support
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full" data-testid="button-billing-faq">
                    Billing FAQ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
