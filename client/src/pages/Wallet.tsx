import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, ArrowUpCircle, ArrowDownCircle, DollarSign, AlertCircle, CheckCircle, Clock, CreditCard } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function WalletPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("50");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [transactionFilter, setTransactionFilter] = useState<string>("all");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const topUpStatus = params.get('topup');
    
    if (topUpStatus === 'success') {
      toast({
        title: "💰 Wallet Topped Up!",
        description: "Your payment was successful. Funds will be added to your wallet shortly.",
        duration: 6000,
      });
      window.history.replaceState({}, '', '/wallet');
    } else if (topUpStatus === 'cancel') {
      toast({
        title: "Top-up Cancelled",
        description: "Your wallet top-up was cancelled. No charges were made.",
        variant: "default",
        duration: 4000,
      });
      window.history.replaceState({}, '', '/wallet');
    }
  }, [toast]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please log in to access your wallet.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: walletBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ["/api/wallet/balance"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/wallet/transactions", { type: transactionFilter === 'all' ? undefined : transactionFilter }],
    retry: false,
    enabled: isAuthenticated,
  });

  const topUpMutation = useMutation({
    mutationFn: async (amountMinor: number) => {
      const response = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMinor }),
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to initiate top-up");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Top-up Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amountMinor: number) => {
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMinor }),
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to request withdrawal");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Withdrawal Requested",
        description: "Your withdrawal request has been submitted. Funds will be processed within 3-5 business days.",
        duration: 8000,
      });
      setShowWithdrawDialog(false);
      setWithdrawAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTopUp = () => {
    const amountMinor = Math.round(parseFloat(topUpAmount) * 100);
    
    if (isNaN(amountMinor) || amountMinor < 1000) {
      toast({
        title: "Invalid Amount",
        description: "Minimum top-up amount is $10",
        variant: "destructive",
      });
      return;
    }
    
    if (amountMinor > 100000000) {
      toast({
        title: "Invalid Amount",
        description: "Maximum top-up amount is $1,000,000",
        variant: "destructive",
      });
      return;
    }
    
    topUpMutation.mutate(amountMinor);
  };

  const handleWithdraw = () => {
    const amountMinor = Math.round(parseFloat(withdrawAmount) * 100);
    
    if (isNaN(amountMinor) || amountMinor < 5000) {
      toast({
        title: "Invalid Amount",
        description: "Minimum withdrawal amount is $50",
        variant: "destructive",
      });
      return;
    }
    
    if (!walletBalance || amountMinor > walletBalance.balanceMinor) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${formatCurrency(walletBalance?.balanceMinor || 0, walletBalance?.currency || 'USD')} available`,
        variant: "destructive",
      });
      return;
    }
    
    withdrawMutation.mutate(amountMinor);
  };

  const formatCurrency = (amountMinor: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amountMinor / 100);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowUpCircle className="h-5 w-5 text-green-500" />;
      case 'deduction':
        return <ArrowDownCircle className="h-5 w-5 text-red-500" />;
      case 'earning':
        return <DollarSign className="h-5 w-5 text-blue-500" />;
      case 'withdrawal':
        return <CreditCard className="h-5 w-5 text-purple-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'earning':
        return 'text-green-600';
      case 'deduction':
      case 'withdrawal':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading || balanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const balance = walletBalance?.balanceMinor || 0;
  const currency = walletBalance?.currency || 'USD';
  const canWithdraw = balance >= 5000;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Wallet className="h-8 w-8 text-accent" />
              My Wallet
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your funds for campaigns and earnings
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-gradient-to-br from-accent/10 to-background border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Current Balance</span>
                <Wallet className="h-5 w-5 text-accent" />
              </CardTitle>
              <CardDescription>Available funds in your wallet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-4xl font-bold text-accent">
                  {formatCurrency(balance, currency)}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={() => setShowTopUpDialog(true)}
                    className="w-full"
                  >
                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                    Top Up
                  </Button>
                  <Button 
                    onClick={() => setShowWithdrawDialog(true)}
                    variant="outline"
                    disabled={!canWithdraw}
                    className="w-full"
                  >
                    <ArrowDownCircle className="h-4 w-4 mr-2" />
                    Withdraw
                  </Button>
                </div>
                {!canWithdraw && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Minimum withdrawal amount is $50. Top up your wallet to withdraw funds.</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Wallet Stats</CardTitle>
              <CardDescription>Your wallet activity overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-md">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Total Deposited</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(walletBalance?.totalDepositedMinor || 0, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-md">
                  <div className="flex items-center gap-2">
                    <ArrowDownCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium">Total Spent</span>
                  </div>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(walletBalance?.totalSpentMinor || 0, currency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All your wallet transactions</CardDescription>
              </div>
              <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter transactions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="deduction">Deductions</SelectItem>
                  <SelectItem value="earning">Earnings</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-6 h-6 border-4 border-accent border-t-transparent rounded-full" />
              </div>
            ) : !transactions || transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No transactions yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx: any) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(tx.type)}
                          <span className="capitalize">{tx.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {tx.description || 'No description'}
                      </TableCell>
                      <TableCell className={`font-semibold ${getTransactionColor(tx.type)}`}>
                        {tx.type === 'deposit' || tx.type === 'earning' ? '+' : '-'}
                        {formatCurrency(tx.amountMinor, tx.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Top Up Wallet</DialogTitle>
            <DialogDescription>
              Add funds to your wallet via Stripe. Minimum $10.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="topup-amount">Amount (USD)</Label>
              <Input
                id="topup-amount"
                type="number"
                min="10"
                max="1000000"
                step="1"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="50.00"
              />
              <p className="text-xs text-muted-foreground">
                Min: $10 | Max: $1,000,000
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTopUpDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleTopUp} disabled={topUpMutation.isPending}>
              {topUpMutation.isPending ? "Processing..." : "Continue to Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Request a withdrawal to your payment method. Minimum $50.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount (USD)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                min="50"
                max={balance / 100}
                step="1"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="50.00"
              />
              <p className="text-xs text-muted-foreground">
                Available: {formatCurrency(balance, currency)} | Min: $50
              </p>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-md text-sm">
              <p className="font-medium mb-1">⏱️ Processing Time</p>
              <p className="text-muted-foreground">
                Withdrawals are processed within 3-5 business days.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleWithdraw} disabled={withdrawMutation.isPending}>
              {withdrawMutation.isPending ? "Processing..." : "Request Withdrawal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
