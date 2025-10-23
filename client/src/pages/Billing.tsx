import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Download, DollarSign, Calendar, CheckCircle, AlertCircle, Crown, Star, Heart } from "lucide-react";
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
            <Card className={`border-2 ${getPlanColor(user.plan || 'free')}`} data-testid="card-current-subscription">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getPlanIcon(user.plan || 'free')}
                  <span>Current Plan: {user.plan}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.plan === 'free' ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      You're currently on the free plan. Upgrade to unlock premium features!
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Button asChild className="bg-blue-500 hover:bg-blue-600" data-testid="button-upgrade-traveler">
                        <Link href="/subscribe">
                          <Heart className="w-4 h-4 mr-2" />
                          Upgrade to Traveler
                        </Link>
                      </Button>
                      <Button asChild className="bg-chart-2 hover:bg-chart-2/90" data-testid="button-upgrade-creator">
                        <Link href="/subscribe">
                          <Star className="w-4 h-4 mr-2" />
                          Upgrade to Creator
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold text-foreground" data-testid="text-plan-price">
                          £{user.plan === 'traveler' ? '25' : '45'}
                        </div>
                        <div className="text-sm text-muted-foreground">per month</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Status</div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" data-testid="badge-subscription-status">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Next billing date</div>
                      <div className="font-medium" data-testid="text-next-billing">
                        {format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MMMM d, yyyy')}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" data-testid="button-manage-subscription">
                        Manage Subscription
                      </Button>
                      <Button variant="outline" data-testid="button-cancel-subscription">
                        Cancel Plan
                      </Button>
                    </div>
                  </div>
                )}
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
                        {user.plan !== 'free' ? (
                          <TableRow data-testid="row-sample-invoice">
                            <TableCell>{format(new Date(), 'MMM d, yyyy')}</TableCell>
                            <TableCell>{user.plan} Plan Subscription</TableCell>
                            <TableCell>£{user.plan === 'traveler' ? '25.00' : '45.00'}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Paid
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" data-testid="button-download-invoice">
                                <Download className="w-3 h-3 mr-2" />
                                PDF
                              </Button>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No billing history yet. Upgrade to a paid plan to see invoices here.
                            </TableCell>
                          </TableRow>
                        )}
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
                {user.plan === 'free' ? (
                  <div className="text-center py-4">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground text-sm">
                      No payment method required for free plan
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <div className="font-medium" data-testid="text-payment-method">•••• •••• •••• 4242</div>
                        <div className="text-sm text-muted-foreground">Expires 12/28</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" data-testid="button-update-payment">
                      Update Payment Method
                    </Button>
                  </div>
                )}
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
