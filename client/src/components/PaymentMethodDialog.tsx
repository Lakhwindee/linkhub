import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Plus } from "lucide-react";
import PayPalButton from "./PayPalButton";

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentMethodAdded: () => void;
}

export function PaymentMethodDialog({ open, onOpenChange, onPaymentMethodAdded }: PaymentMethodDialogProps) {
  const [paymentType, setPaymentType] = useState("paypal");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    routingNumber: "",
    accountHolderName: ""
  });

  const handleSavePaymentMethod = () => {
    // TODO: Save payment method to backend
    console.log("Saving payment method:", { paymentType, paypalEmail, bankDetails });
    onPaymentMethodAdded();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Add Payment Method</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label>Payment Method Type</Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="stripe">Stripe Express</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentType === "paypal" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">PayPal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="paypal-email">PayPal Email Address</Label>
                  <Input
                    id="paypal-email"
                    type="email"
                    placeholder="your-paypal@email.com"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                  />
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    We'll send payouts directly to this PayPal email address. Make sure it's verified and active.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {paymentType === "bank" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bank Transfer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="account-holder">Account Holder Name</Label>
                  <Input
                    id="account-holder"
                    placeholder="Full name as on bank account"
                    value={bankDetails.accountHolderName}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolderName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="account-number">Account Number</Label>
                  <Input
                    id="account-number"
                    placeholder="Your bank account number"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="routing-number">Routing Number</Label>
                  <Input
                    id="routing-number"
                    placeholder="Bank routing number"
                    value={bankDetails.routingNumber}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, routingNumber: e.target.value }))}
                  />
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Bank transfers may take 3-5 business days to process and may incur additional fees.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {paymentType === "stripe" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stripe Express</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Stripe Express provides the fastest payouts, usually within 1-2 business days. You'll be redirected to Stripe to complete the setup.
                  </p>
                </div>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Connect with Stripe Express
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="flex space-x-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSavePaymentMethod} className="flex-1">
              Save Payment Method
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}