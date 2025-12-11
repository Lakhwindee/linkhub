import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock } from "lucide-react";
import { useLocation } from "wouter";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'invalid'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Extract token from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    
    if (resetToken) {
      setToken(resetToken);
      console.log('🔐 Reset token found in URL:', resetToken.substring(0, 8) + '...');
    } else {
      setStatus('invalid');
      setMessage('Invalid reset link. Please request a new password reset.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('idle');
    setMessage('');
    
    // Validation
    if (!newPassword || !confirmPassword) {
      setStatus('error');
      setMessage('Please fill in all fields');
      setIsLoading(false);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    if (newPassword.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('🔐 Submitting password reset with token:', token.substring(0, 8) + '...');
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: token,
          newPassword: newPassword 
        }),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Password reset successful:', result);
        setStatus('success');
        setMessage('Password updated successfully! Please login with your new password.');
        
        // Clear form
        setNewPassword('');
        setConfirmPassword('');
        
        // Clear any existing sessions and redirect to login page
        setTimeout(() => {
          // Clear session storage
          sessionStorage.clear();
          // Force reload to Landing/Login page
          window.location.href = '/';
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('❌ Password reset error:', error);
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
    
    setIsLoading(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password to complete the reset process
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Status Messages */}
          {status === 'success' && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Success!</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {message}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                Redirecting to login page...
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {message}
              </p>
            </div>
          )}
          
          {status === 'invalid' && (
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Invalid Link</span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {message}
              </p>
              <Button 
                onClick={() => setLocation('/')} 
                variant="outline" 
                className="mt-3 w-full"
              >
                Go to Login
              </Button>
            </div>
          )}
          
          {status !== 'invalid' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading || status === 'success'}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading || status === 'success'}
                  minLength={6}
                />
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Password must be at least 6 characters long
              </div>
              
              <div className="flex flex-col space-y-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || status === 'success' || !token}
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setLocation('/')}
                  disabled={isLoading}
                >
                  Back to Login
                </Button>
              </div>
            </form>
          )}
          
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
            © 2025 ThePicStory Tourism Platform
          </div>
        </CardContent>
      </Card>
    </div>
  );
}