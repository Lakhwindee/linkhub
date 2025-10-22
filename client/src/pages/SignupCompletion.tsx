import React, { useEffect, useState } from 'react';
import { useToast } from '../hooks/use-toast';

export default function SignupCompletion() {
  const { toast } = useToast();
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    const completeSignup = async () => {
      try {
        setIsCompleting(true);
        
        console.log('🔄 SignupCompletion: Starting signup completion...');
        
        // Get stored signup data
        const signupData = sessionStorage.getItem('hublink_signup_data');
        const signupType = sessionStorage.getItem('hublink_signup_type');
        
        console.log('📦 SignupCompletion: Retrieved data from sessionStorage:', {
          hasData: !!signupData,
          signupType,
          dataLength: signupData?.length
        });
        
        if (!signupData) {
          console.error('❌ SignupCompletion: No signup data found in sessionStorage!');
          // No signup data, redirect to home
          window.location.href = '/';
          return;
        }

        const data = JSON.parse(signupData);
        console.log('✅ SignupCompletion: Parsed data:', { email: data.email, hasPassword: !!data.password });
        
        // Complete signup via traditional auth API (no OAuth required)
        console.log('📡 SignupCompletion: Calling /api/auth/complete-registration...');
        const response = await fetch('/api/auth/complete-registration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data),
        }).catch((error) => {
          console.error('❌ Network error during signup completion:', error);
          throw new Error(`Network error: ${error.message}`);
        });

        console.log('📨 SignupCompletion: Response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ SignupCompletion: Registration successful!', result);
          
          // Clear signup data
          sessionStorage.removeItem('hublink_signup_data');
          sessionStorage.removeItem('hublink_signup_type');
          
          toast({
            title: "Signup Complete!",
            description: "Your account has been created and verified successfully. Welcome to HubLink!",
          });
          
          // Redirect based on signup type
          if (signupType === 'document') {
            // Document users need to login first, redirect to home with success message
            window.location.href = '/?signup=success';
          } else {
            // Professional signup goes to subscription
            window.location.href = '/subscribe';
          }
        } else {
          throw new Error('Signup completion failed');
        }
      } catch (error) {
        console.error('Signup completion error:', error);
        
        // Clear signup data on error
        sessionStorage.removeItem('hublink_signup_data');
        sessionStorage.removeItem('hublink_signup_type');
        
        toast({
          title: "Signup Error",
          description: "Failed to complete signup. Please try signing up again.",
          variant: "destructive",
        });
        
        // Redirect to home page since /signup doesn't exist
        window.location.href = '/';
      } finally {
        setIsCompleting(false);
      }
    };

    completeSignup();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold mb-2">Completing Your Signup...</h2>
        <p className="text-muted-foreground">
          Please wait while we finish creating your account.
        </p>
      </div>
    </div>
  );
}