import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Mail, CheckCircle } from "lucide-react";

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('idle');
    setMessage('');
    
    if (!email) {
      setStatus('error');
      setMessage('Please enter your email address');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('🔐 Sending password reset request for:', email);
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Password reset request successful:', result);
        setStatus('success');
        setMessage(result.message || 'Password reset email sent successfully!');
        
        // Clear form
        setEmail('');
        
        // Auto close after 3 seconds
        setTimeout(() => {
          onOpenChange(false);
          setStatus('idle');
          setMessage('');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.message || 'Failed to send password reset email');
      }
    } catch (error) {
      console.error('❌ Password reset request error:', error);
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
    
    setIsLoading(false);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Forgot Password
          </DialogTitle>
          <DialogDescription>
            Enter your email address and we'll send you a link to reset your password
          </DialogDescription>
        </DialogHeader>
        
        
        {/* Status Messages */}
        {status === 'success' && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Email Sent!</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              {message}
            </p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Error</span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {message}
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading || status === 'success'}
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || status === 'success'}
            >
              {isLoading ? "Sending..." : "Send Reset Email"}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Remember your password? Go back to login instead.
        </div>
      </DialogContent>
    </Dialog>
  );
}