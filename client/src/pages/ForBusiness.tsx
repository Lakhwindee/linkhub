import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Building2, CheckCircle, Globe, TrendingUp, Shield, Award } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { PublisherSignupForm } from "@/components/PublisherSignupForm";

export default function ForBusiness() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    
    if (user) {
      if (user.role === 'publisher') {
        toast({
          title: "Already Registered",
          description: "You're already registered as a publisher. Redirecting...",
        });
        setTimeout(() => setLocation('/stays'), 1000);
        return;
      }
      
      if (user.role === 'creator') {
        toast({
          title: "Wrong Signup Page",
          description: "This is for business publishers. Redirecting you to dashboard...",
        });
        setTimeout(() => setLocation('/'), 1000);
        return;
      }
    }
  }, [user, authLoading, setLocation, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Building2 className="h-16 w-16 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            HubLink for Business
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Connect with millions of travelers worldwide. Grow your business with our powerful platform designed for hospitality and tourism professionals.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
            <div className="flex justify-center mb-4">
              <Globe className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Global Reach</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Reach travelers from around the world looking for authentic experiences in your area.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
            <div className="flex justify-center mb-4">
              <TrendingUp className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Grow Your Revenue</h3>
            <p className="text-gray-600 dark:text-gray-300">
              List your services, attract more customers, and increase your bookings with our marketing tools.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Secure Payments</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Get paid securely through Stripe with automatic payouts and transparent transaction fees.
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">
            What You Get as a Publisher
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">List Your Services</h4>
                <p className="text-gray-600 dark:text-gray-300">Hotels, tours, restaurants, activities - showcase everything you offer</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Manage Bookings</h4>
                <p className="text-gray-600 dark:text-gray-300">Easy-to-use dashboard to track and manage all your reservations</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Creator Collaborations</h4>
                <p className="text-gray-600 dark:text-gray-300">Partner with travel creators to promote your business worldwide</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Marketing Campaigns</h4>
                <p className="text-gray-600 dark:text-gray-300">Run targeted advertising campaigns to reach your ideal customers</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Analytics & Insights</h4>
                <p className="text-gray-600 dark:text-gray-300">Track performance with detailed analytics and booking reports</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">24/7 Support</h4>
                <p className="text-gray-600 dark:text-gray-300">Get help whenever you need it from our dedicated support team</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Info */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 mb-16 text-white">
          <div className="text-center">
            <Award className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl mb-2">Only 10% platform fee on completed bookings</p>
            <p className="text-blue-100">No monthly fees. No hidden charges. Pay only when you earn.</p>
          </div>
        </div>

        {/* Signup Form Section */}
        <div id="signup-form" className="max-w-4xl mx-auto">
          <PublisherSignupForm showCard={true} />
        </div>
      </div>
    </div>
  );
}
