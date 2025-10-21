import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, MapPin, Users, Clock } from "lucide-react";
import { PlatformFeeBreakdown } from "@/components/PlatformFeeBreakdown";

interface BookingConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  bookingType: 'stay' | 'trip' | 'ad';
  bookingData: {
    itemName: string;
    basePrice: number;
    currency: string;
    dates?: string;
    location?: string;
    guests?: number;
    duration?: string;
  };
}

export function BookingConfirmation({ 
  isOpen, 
  onClose, 
  bookingType, 
  bookingData 
}: BookingConfirmationProps) {
  const getSuccessMessage = (type: string) => {
    switch (type) {
      case 'stay': return 'Stay Booked Successfully!';
      case 'trip': return 'Trip Booking Confirmed!';
      case 'ad': return 'Campaign Reserved Successfully!';
      default: return 'Booking Confirmed!';
    }
  };

  const getBookingIcon = (type: string) => {
    switch (type) {
      case 'stay': return '🏠';
      case 'trip': return '✈️';
      case 'ad': return '📢';
      default: return '✅';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-2xl">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <span>{getSuccessMessage(bookingType)}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Details */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center space-x-2">
              <span className="text-2xl">{getBookingIcon(bookingType)}</span>
              <span>{bookingData.itemName}</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              {bookingData.dates && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{bookingData.dates}</span>
                </div>
              )}
              
              {bookingData.location && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{bookingData.location}</span>
                </div>
              )}
              
              {bookingData.guests && (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{bookingData.guests} guests</span>
                </div>
              )}
              
              {bookingData.duration && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{bookingData.duration}</span>
                </div>
              )}
            </div>
          </div>

          {/* Platform Fee Breakdown */}
          <PlatformFeeBreakdown 
            basePrice={bookingData.basePrice}
            currency={bookingData.currency}
            itemName={bookingData.itemName}
            itemType={bookingType}
          />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={onClose}
              className="flex-1 bg-accent hover:bg-accent/90"
            >
              Continue Browsing
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/billing'}
              className="flex-1"
            >
              View in Billing
            </Button>
          </div>

          {/* Confirmation Note */}
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              📧 Confirmation details have been sent to your email.
              💳 Payment will be processed securely through our platform.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}