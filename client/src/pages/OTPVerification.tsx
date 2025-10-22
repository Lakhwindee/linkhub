import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, Mail, MessageCircle, AlertCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

interface OTPVerificationProps {
  email?: string;
  phone?: string;
  verificationType?: 'email' | 'sms' | 'both';
  onVerificationComplete?: () => void;
}

export default function OTPVerification() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get data from URL params or local storage
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationType, setVerificationType] = useState<'email' | 'sms' | 'both'>('email');
  
  const [emailOTP, setEmailOTP] = useState('');
  const [smsOTP, setSmsOTP] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const [developmentOTP, setDevelopmentOTP] = useState<string | null>(null);

  useEffect(() => {
    // Get verification data from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const storedEmail = urlParams.get('email') || localStorage.getItem('signup_email') || '';
    const storedPhone = urlParams.get('phone') || localStorage.getItem('signup_phone') || '';
    const storedType = urlParams.get('type') || localStorage.getItem('verification_type') || 'email';
    
    setEmail(storedEmail);
    setPhone(storedPhone);
    setVerificationType(storedType as 'email' | 'sms' | 'both');
    
    // Auto-send OTP when page loads
    if (storedEmail || storedPhone) {
      sendInitialOTP(storedEmail, storedPhone, storedType);
    }
    
    // Start countdown timer
    startCountdown();
  }, []);

  const sendInitialOTP = async (email: string, phone: string, type: string) => {
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: type === 'email' || type === 'both' ? email : null,
          phone: type === 'sms' || type === 'both' ? phone : null,
          type
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('🎯 OTP sent successfully:', data);
        
        // Check if we're in development mode and show OTP code
        if (data.developmentMode && data.otpCode) {
          setDevelopmentOTP(data.otpCode);
          toast({
            title: "⚠️ Development Mode",
            description: `Email failed! OTP Code: ${data.otpCode}`,
            duration: 0, // Keep visible until dismissed
          });
        } else {
          toast({
            title: "Verification Code Sent!",
            description: `Check your ${type === 'both' ? 'email and phone' : type} for the verification code.`,
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error('Error sending initial OTP:', error);
    }
  };

  const startCountdown = () => {
    setCountdown(60);
    setCanResend(false);
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    try {
      // Call API to resend OTP
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: verificationType === 'email' || verificationType === 'both' ? email : null,
          phone: verificationType === 'sms' || verificationType === 'both' ? phone : null,
          type: verificationType
        }),
      });

      if (response.ok) {
        toast({
          title: "OTP Sent!",
          description: "New verification code has been sent.",
          duration: 3000,
        });
        startCountdown();
      } else {
        throw new Error('Failed to resend OTP');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend OTP. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleVerifyOTP = async () => {
    if (verificationType === 'email' && !emailOTP) {
      toast({
        title: "Missing OTP",
        description: "Please enter the email verification code.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (verificationType === 'sms' && !smsOTP) {
      toast({
        title: "Missing OTP",
        description: "Please enter the SMS verification code.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (verificationType === 'both' && (!emailOTP || !smsOTP)) {
      toast({
        title: "Missing OTP",
        description: "Please enter both email and SMS verification codes.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsVerifying(true);
    
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          phone,
          emailOTP: emailOTP || null,
          smsOTP: smsOTP || null,
          type: verificationType
        }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        setVerificationStatus('verified');
        
        // Clean up stored data
        localStorage.removeItem('signup_email');
        localStorage.removeItem('signup_phone');
        localStorage.removeItem('verification_type');
        
        toast({
          title: "Verification Successful!",
          description: "Completing your registration...",
          duration: 2000,
        });

        // Redirect to signup-completion to create user in database
        setTimeout(() => {
          setLocation('/signup-completion');
        }, 1500);
      } else {
        setVerificationStatus('failed');
        toast({
          title: "Verification Failed",
          description: data.message || "Invalid verification code. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      setVerificationStatus('failed');
      toast({
        title: "Error",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (verificationStatus === 'verified') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Verification Complete!</h2>
                <p className="text-gray-600 mt-2">
                  Your account has been successfully verified. Redirecting...
                </p>
              </div>
              <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center space-x-2">
            {verificationType === 'email' && <Mail className="w-5 h-5" />}
            {verificationType === 'sms' && <MessageCircle className="w-5 h-5" />}
            {verificationType === 'both' && (
              <>
                <Mail className="w-5 h-5" />
                <MessageCircle className="w-5 h-5" />
              </>
            )}
            <span>Verify Your Account</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Verification Instructions */}
          <div className="text-center text-sm text-gray-600">
            {verificationType === 'email' && (
              <p>We've sent a verification code to <strong>{email}</strong></p>
            )}
            {verificationType === 'sms' && (
              <p>We've sent a verification code to <strong>{phone}</strong></p>
            )}
            {verificationType === 'both' && (
              <p>We've sent verification codes to your email and phone number</p>
            )}
          </div>

          {/* Development Mode OTP Display */}
          {developmentOTP && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Development Mode</span>
              </div>
              <p className="text-xs text-yellow-700 mb-3">Email sending failed. Your OTP code is:</p>
              <div className="bg-white border-2 border-yellow-300 rounded-lg py-3 px-4">
                <span className="text-2xl font-mono font-bold text-gray-900 tracking-widest">
                  {developmentOTP}
                </span>
              </div>
              <p className="text-xs text-yellow-600 mt-2">Copy this code into the verification field below</p>
            </div>
          )}

          {/* Email OTP Input */}
          {(verificationType === 'email' || verificationType === 'both') && (
            <div className="space-y-2">
              <Label htmlFor="emailOTP" className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Email Verification Code</span>
              </Label>
              <Input
                id="emailOTP"
                type="text"
                placeholder="Enter 6-digit code"
                value={emailOTP}
                onChange={(e) => setEmailOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest font-mono"
              />
            </div>
          )}

          {/* SMS OTP Input */}
          {(verificationType === 'sms' || verificationType === 'both') && (
            <div className="space-y-2">
              <Label htmlFor="smsOTP" className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>SMS Verification Code</span>
              </Label>
              <Input
                id="smsOTP"
                type="text"
                placeholder="Enter 6-digit code"
                value={smsOTP}
                onChange={(e) => setSmsOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest font-mono"
              />
            </div>
          )}

          {/* Verification Status */}
          {verificationStatus === 'failed' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Verification failed. Please check your code and try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button 
              onClick={handleVerifyOTP} 
              className="w-full" 
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>

            {/* Resend Timer/Button */}
            <div className="text-center">
              {!canResend ? (
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Resend code in {formatTime(countdown)}</span>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={handleResendOTP}
                  className="text-sm"
                >
                  Resend Verification Code
                </Button>
              )}
            </div>
          </div>

          {/* Back to Signup */}
          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/document-signup')}
              className="text-sm text-gray-600"
            >
              ← Back to Signup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}