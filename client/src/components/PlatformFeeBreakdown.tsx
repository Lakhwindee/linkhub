import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calculator, DollarSign } from "lucide-react";

interface PlatformFeeBreakdownProps {
  basePrice: number;
  currency?: string;
  itemName?: string;
  itemType?: 'stay' | 'trip' | 'ad' | 'general';
  className?: string;
}

export function PlatformFeeBreakdown({ 
  basePrice, 
  currency = 'USD', 
  itemName = 'Service',
  itemType = 'general',
  className 
}: PlatformFeeBreakdownProps) {
  const platformFee = basePrice * 0.10; // 10% platform fee
  const totalPrice = basePrice + platformFee;
  
  const getCurrencySymbol = (curr: string) => {
    switch (curr.toLowerCase()) {
      case 'gbp': return '£';
      case 'eur': return '€';
      case 'inr': return '₹';
      default: return '$';
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'stay': return '🏠';
      case 'trip': return '✈️';
      case 'ad': return '📢';
      default: return '💳';
    }
  };

  const currencySymbol = getCurrencySymbol(currency);

  return (
    <Card className={`bg-gradient-to-br from-muted/20 to-muted/40 border-2 border-muted-foreground/10 ${className}`}>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Price Breakdown</h3>
              <p className="text-sm text-muted-foreground">{getItemIcon(itemType)} {itemName}</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-chart-2/20 text-chart-2">
            Total: {currencySymbol}{totalPrice.toFixed(2)}
          </Badge>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-foreground font-medium">Base Price:</span>
            <span className="font-semibold">{currencySymbol}{basePrice.toFixed(2)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Platform Fee (10%):</span>
              <Badge variant="outline" className="text-xs">
                <DollarSign className="w-3 h-3 mr-1" />
                Service Fee
              </Badge>
            </div>
            <span className="text-muted-foreground">+{currencySymbol}{platformFee.toFixed(2)}</span>
          </div>
          
          <Separator className="my-2" />
          
          <div className="flex items-center justify-between text-lg font-bold border-t border-muted-foreground/20 pt-3">
            <span className="text-foreground">Total Amount:</span>
            <span className="text-chart-1">{currencySymbol}{totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-primary/5 rounded-lg p-3 mt-4">
          <p className="text-xs text-muted-foreground text-center">
            🛡️ Platform fee helps us maintain secure payments, customer support, and platform features
          </p>
        </div>
      </CardContent>
    </Card>
  );
}