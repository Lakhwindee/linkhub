import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, AlertCircle, DollarSign } from "lucide-react";
import PayPalButton from "./PayPalButton";

interface PayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPayoutRequested: () => void;
  availableBalance?: number;
}

export function PayoutDialog({ 
  open, 
  onOpenChange, 
  onPayoutRequested, 
  availableBalance = 892.30 
}: PayoutDialogProps) {
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("paypal");

  const handleRequestPayout = () => {
    const amount = parseFloat(payoutAmount);
    if (amount > availableBalance) {
      alert("Amount exceeds available balance");
      return;
    }
    if (amount < 500) {
      alert("Minimum payout amount is $500");
      return;
    }
    
    // TODO: Process payout request to backend
    console.log("Processing payout:", { amount, method: payoutMethod });
    onPayoutRequested();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-green-500" />
            <span>Request Payout</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Available Balance */}
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <span className="text-2xl font-bold text-green-600">${availableBalance.toFixed(2)}</span>
                </div>
                <p className="text-sm text-muted-foreground">Available for payout</p>
              </div>
            </CardContent>
          </Card>

          {/* Payout Amount */}
          <div className="space-y-2">
            <Label htmlFor="payout-amount">Payout Amount ($)</Label>
            <Input
              id="payout-amount"
              type="number"
              placeholder="0.00"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              min="10"
              max={availableBalance}
              step="0.01"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Minimum: $500.00</span>
              <span>Maximum: ${availableBalance.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payout Method</Label>
            <Select value={payoutMethod} onValueChange={setPayoutMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payout method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paypal">PayPal (1-2 business days)</SelectItem>
                <SelectItem value="bank">Bank Transfer (3-5 business days)</SelectItem>
                <SelectItem value="stripe">Stripe Express (1-2 business days)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Processing Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium">Processing Information:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• PayPal payouts are processed within 1-2 business days</li>
                  <li>• Bank transfers may take 3-5 business days</li>
                  <li>• No fees are charged for standard payouts</li>
                  <li>• You'll receive an email confirmation once processed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleRequestPayout} 
              className="flex-1 bg-green-500 hover:bg-green-600"
              disabled={!payoutAmount || parseFloat(payoutAmount) < 10 || parseFloat(payoutAmount) > availableBalance}
            >
              <Download className="w-4 h-4 mr-2" />
              Request Payout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}