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
        
        // Get stored signup data from localStorage (persists across redirects)
        const signupData = localStorage.getItem('thepicstory_signup_data');
        const signupType = localStorage.getItem('thepicstory_signup_type');
        
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
          
          // Clear signup data from localStorage
          localStorage.removeItem('thepicstory_signup_data');
          localStorage.removeItem('thepicstory_signup_type');
          
          // Set flag to show "Welcome" instead of "Welcome back"
          localStorage.setItem('justSignedUp', 'true');
          
          toast({
            title: "Signup Complete!",
            description: "Your account has been created and verified successfully. Welcome to ThePicStory!",
          });
          
          // Redirect to home page with success message
          // User is now logged in with active session
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ SignupCompletion: API Error:', response.status, errorData);
          throw new Error(errorData.message || `Signup failed with status ${response.status}`);
        }
      } catch (error: any) {
        console.error('Signup completion error:', error);
        
        // Show detailed error message
        const errorMessage = error?.message || 'Failed to complete signup. Please try signing up again.';
        
        // Clear signup data on error from localStorage
        localStorage.removeItem('thepicstory_signup_data');
        localStorage.removeItem('thepicstory_signup_type');
        
        // Check if user already exists - redirect to homepage with login prompt
        if (errorMessage.toLowerCase().includes('already exists')) {
          toast({
            title: "Account Already Exists",
            description: "This email is already registered. Redirecting you to login...",
            variant: "default",
            duration: 3000,
          });
          
          setTimeout(() => {
            window.location.href = '/?login=account_exists';
          }, 2000);
        } else {
          // Other errors - show error and redirect to home
          toast({
            title: "Signup Error",
            description: errorMessage,
            variant: "destructive",
            duration: 10000,
          });
          
          setTimeout(() => {
            window.location.href = '/';
          }, 5000);
        }
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