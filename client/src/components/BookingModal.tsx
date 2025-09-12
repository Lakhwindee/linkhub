import { useState, useEffect } from "react";
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Users, CreditCard, MapPin, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { format, addDays } from "date-fns";
import type { Stay } from "@shared/schema";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  stay: Stay | null;
  onSuccess?: (bookingId: string) => void;
}

interface BookingQuote {
  stayId: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guests: number;
  pricing: {
    unitPrice: number;
    subtotal: number;
    platformFee: number;
    tax: number;
    totalPrice: number;
    currency: string;
  };
  stay: {
    title: string;
    checkInTime: string;
    checkOutTime: string;
    cancellationPolicy: string;
  };
}

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  emergencyContact: string;
}

enum BookingStep {
  DATES_GUESTS = 'dates_guests',
  CONTACT_INFO = 'contact_info', 
  PAYMENT = 'payment',
  CONFIRMATION = 'confirmation'
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

export function BookingModal({ isOpen, onClose, stay, onSuccess }: BookingModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<BookingStep>(BookingStep.DATES_GUESTS);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  
  // Form states
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    name: '',
    email: '',
    phone: '',
    emergencyContact: ''
  });
  const [specialRequests, setSpecialRequests] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(BookingStep.DATES_GUESTS);
      setQuote(null);
      setBooking(null);
      setCheckInDate('');
      setCheckOutDate('');
      setGuests(1);
      setContactInfo({ name: '', email: '', phone: '', emergencyContact: '' });
      setSpecialRequests('');
    }
  }, [isOpen]);

  // Set default dates when stay changes
  useEffect(() => {
    if (stay && !checkInDate) {
      const tomorrow = addDays(new Date(), 1);
      const dayAfter = addDays(new Date(), 2);
      setCheckInDate(format(tomorrow, 'yyyy-MM-dd'));
      setCheckOutDate(format(dayAfter, 'yyyy-MM-dd'));
    }
  }, [stay]);

  const calculateQuote = async () => {
    if (!stay || !checkInDate || !checkOutDate || guests < 1) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/stays/${stay.id}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkInDate,
          checkOutDate,
          guests
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to calculate quote');
      }

      const quoteData = await response.json();
      setQuote(quoteData);
      setCurrentStep(BookingStep.CONTACT_INFO);
    } catch (error: any) {
      toast({
        title: "Quote Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const proceedToPayment = async () => {
    if (!contactInfo.name || !contactInfo.email || !contactInfo.phone) {
      toast({
        title: "Contact Info Required",
        description: "Please fill in all contact information",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/stays/${stay!.id}/book-enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkInDate,
          checkOutDate,
          guests,
          contactInfo,
          specialRequests
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create booking');
      }

      const bookingData = await response.json();
      setBooking(bookingData);
      
      if (bookingData.payment.requiresPayment) {
        setCurrentStep(BookingStep.PAYMENT);
      } else {
        setCurrentStep(BookingStep.CONFIRMATION);
      }
    } catch (error: any) {
      toast({
        title: "Booking Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    if (!stripe || !elements || !booking) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }

    setPaymentProcessing(true);

    try {
      // Confirm the payment with Stripe
      const result = await stripe.confirmCardPayment(booking.payment.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: contactInfo.name,
            email: contactInfo.email,
            phone: contactInfo.phone,
          },
        }
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Confirm payment on backend
      const response = await fetch(`/api/bookings/${booking.booking.id}/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: result.paymentIntent.id
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment confirmation failed');
      }

      setCurrentStep(BookingStep.CONFIRMATION);
      
      toast({
        title: "Payment Successful",
        description: "Your booking has been confirmed!",
      });

    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleSuccess = () => {
    onSuccess?.(booking.booking.id);
    onClose();
  };

  if (!stay) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Book {stay.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${currentStep === BookingStep.DATES_GUESTS ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === BookingStep.DATES_GUESTS ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>1</div>
              <span className="text-sm font-medium">Dates & Guests</span>
            </div>
            <div className={`flex items-center gap-2 ${currentStep === BookingStep.CONTACT_INFO ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === BookingStep.CONTACT_INFO ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>2</div>
              <span className="text-sm font-medium">Contact Info</span>
            </div>
            <div className={`flex items-center gap-2 ${currentStep === BookingStep.PAYMENT ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === BookingStep.PAYMENT ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>3</div>
              <span className="text-sm font-medium">Payment</span>
            </div>
            <div className={`flex items-center gap-2 ${currentStep === BookingStep.CONFIRMATION ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === BookingStep.CONFIRMATION ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>✓</div>
              <span className="text-sm font-medium">Confirmed</span>
            </div>
          </div>

          {/* Step 1: Dates & Guests */}
          {currentStep === BookingStep.DATES_GUESTS && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="checkin">Check-in Date</Label>
                  <Input
                    id="checkin"
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                <div>
                  <Label htmlFor="checkout">Check-out Date</Label>
                  <Input
                    id="checkout"
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    min={checkInDate || format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="guests">Number of Guests</Label>
                <Input
                  id="guests"
                  type="number"
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                  min={1}
                  max={stay.maxGuests}
                />
                <p className="text-sm text-gray-500 mt-1">Maximum {stay.maxGuests} guests allowed</p>
              </div>

              {stay.minimumStay > 1 && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Minimum stay: {stay.minimumStay} nights
                  </p>
                </div>
              )}

              <Button onClick={calculateQuote} disabled={loading} className="w-full">
                {loading ? "Calculating..." : "Get Quote"}
              </Button>
            </div>
          )}

          {/* Step 2: Contact Info */}
          {currentStep === BookingStep.CONTACT_INFO && quote && (
            <div className="space-y-4">
              {/* Pricing Summary */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{format(new Date(checkInDate), 'MMM dd')} - {format(new Date(checkOutDate), 'MMM dd')}</span>
                      <span>{quote.nights} {quote.nights === 1 ? 'night' : 'nights'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{quote.pricing.currency} {quote.pricing.unitPrice} x {quote.nights} nights</span>
                      <span>{quote.pricing.currency} {quote.pricing.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform fee</span>
                      <span>{quote.pricing.currency} {quote.pricing.platformFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>{quote.pricing.currency} {quote.pricing.tax}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{quote.pricing.currency} {quote.pricing.totalPrice}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+44 20 1234 5678"
                  />
                </div>
                <div>
                  <Label htmlFor="emergency">Emergency Contact</Label>
                  <Input
                    id="emergency"
                    value={contactInfo.emergencyContact}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, emergencyContact: e.target.value }))}
                    placeholder="Emergency contact info"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="requests">Special Requests</Label>
                <Textarea
                  id="requests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any special requests or notes for the host..."
                  rows={3}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(BookingStep.DATES_GUESTS)}>
                  Back
                </Button>
                <Button onClick={proceedToPayment} disabled={loading}>
                  {loading ? "Processing..." : "Continue to Payment"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {currentStep === BookingStep.PAYMENT && booking && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-semibold mb-2">Payment Information</h3>
                <p className="text-sm text-gray-600">
                  Total Amount: <span className="font-semibold">{quote?.pricing.currency} {quote?.pricing.totalPrice}</span>
                </p>
              </div>

              <div className="space-y-4">
                <Label>Credit Card Information</Label>
                <div className="p-3 border rounded-md">
                  <CardElement options={CARD_ELEMENT_OPTIONS} />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  <CreditCard className="w-4 h-4 inline mr-1" />
                  Your payment is secured by Stripe. Your card will be charged immediately upon confirmation.
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(BookingStep.CONTACT_INFO)}>
                  Back
                </Button>
                <Button onClick={processPayment} disabled={paymentProcessing || !stripe}>
                  {paymentProcessing ? "Processing Payment..." : "Confirm & Pay"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === BookingStep.CONFIRMATION && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
              <h3 className="text-2xl font-bold text-green-600">Booking Confirmed!</h3>
              <p className="text-gray-600">
                Your booking has been successfully confirmed. You'll receive a confirmation email shortly.
              </p>
              
              {booking && (
                <Card>
                  <CardContent className="p-4 text-left">
                    <h4 className="font-semibold mb-2">Booking Details</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Booking ID:</strong> {booking.booking.id}</p>
                      <p><strong>Check-in:</strong> {format(new Date(checkInDate), 'MMM dd, yyyy')} at {stay.checkInTime}</p>
                      <p><strong>Check-out:</strong> {format(new Date(checkOutDate), 'MMM dd, yyyy')} at {stay.checkOutTime}</p>
                      <p><strong>Guests:</strong> {guests}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button onClick={handleSuccess} className="w-full">
                View My Bookings
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}