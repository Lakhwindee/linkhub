import { useEffect } from "react";
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
import type { Subscription, Invoice, Wallet, Payout } from "@shared/schema";

export default function Billing() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

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
  const { data: walletData, isLoading: walletLoading } = useQuery({
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
            {/* Creator Earnings (if applicable) */}
            {user.plan === 'creator' && (
              <Card className="border-chart-2" data-testid="card-creator-earnings">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-chart-2" />
                    <span>Creator Earnings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {walletLoading ? (
                    <div className="space-y-3">
                      <div className="animate-pulse h-8 bg-muted rounded w-20"></div>
                      <div className="animate-pulse h-4 bg-muted rounded w-32"></div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="text-3xl font-bold text-foreground" data-testid="text-wallet-balance">
                          £{walletData?.wallet ? (walletData.wallet.balanceMinor / 100).toFixed(2) : '0.00'}
                        </div>
                        <div className="text-sm text-muted-foreground">Available balance</div>
                      </div>
                      
                      <Button 
                        className="w-full bg-chart-2 hover:bg-chart-2/90"
                        disabled={!walletData?.wallet || walletData.wallet.balanceMinor < 1000} // Min £10
                        data-testid="button-request-payout"
                      >
                        Request Payout
                      </Button>
                      
                      <p className="text-xs text-muted-foreground">
                        Minimum payout: £10.00
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

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

        {/* Payout History for Creators */}
        {user.plan === 'creator' && (
          <Card data-testid="card-payout-history">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-chart-2" />
                <span>Payout History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {walletLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4">
                      <div className="h-4 bg-muted rounded w-24"></div>
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-4 bg-muted rounded w-16"></div>
                      <div className="h-4 bg-muted rounded w-20"></div>
                    </div>
                  ))}
                </div>
              ) : walletData?.payouts && walletData.payouts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {walletData.payouts.map((payout: Payout) => (
                      <TableRow key={payout.id} data-testid={`row-payout-${payout.id}`}>
                        <TableCell data-testid={`text-payout-date-${payout.id}`}>
                          {format(new Date(payout.createdAt!), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell data-testid={`text-payout-amount-${payout.id}`}>
                          £{(payout.amountMinor / 100).toFixed(2)}
                        </TableCell>
                        <TableCell data-testid={`text-payout-method-${payout.id}`}>
                          {payout.method}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={payout.status === 'completed' ? 'secondary' : 'outline'}
                            className={
                              payout.status === 'completed' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : payout.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }
                            data-testid={`badge-payout-status-${payout.id}`}
                          >
                            {payout.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {payout.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {payout.status === 'failed' && <AlertCircle className="w-3 h-3 mr-1" />}
                            {payout.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs" data-testid={`text-payout-reference-${payout.id}`}>
                          {payout.reference || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="div-no-payouts">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No payouts yet. Complete brand campaigns to start earning!</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
