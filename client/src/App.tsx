import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import DiscoverTravelers from "@/pages/DiscoverTravelers";
import Profile from "@/pages/Profile";
import Feed from "@/pages/Feed";
import AdsWrapper from "@/pages/AdsWrapper";
import Messages from "@/pages/Messages";
import Admin from "@/pages/Admin";
import Subscribe from "@/pages/Subscribe";
import Events from "@/pages/Events";
import Billing from "@/pages/Billing";
import Wallet from "@/pages/Wallet";
import Stays from "@/pages/Stays";
import Trips from "@/pages/Trips";
import TourPackages from "@/pages/TourPackages";
import MyBookings from "@/pages/MyBookings";
import PersonalHosts from "@/pages/PersonalHosts";
import Explore from "@/pages/Explore";
import UserProfile from "@/pages/UserProfile";
import BoostedPosts from "@/pages/BoostedPosts";
import Map from "@/pages/Map";
import PaymentPage from "@/pages/PaymentPage";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PublisherDashboard from "@/pages/PublisherDashboard";
import Signup from "@/pages/Signup";
import DocumentSignup from "@/pages/DocumentSignup";
import ProfessionalSignup from "@/pages/ProfessionalSignup";
import SignupCompletion from "@/pages/SignupCompletion";
import OTPVerification from "@/pages/OTPVerification";
import ResetPassword from "@/pages/ResetPassword";
import HelpCenter from "@/pages/HelpCenter";
import CommunityGuidelines from "@/pages/CommunityGuidelines";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import AboutUs from "@/pages/AboutUs";
import Careers from "@/pages/Careers";
import Press from "@/pages/Press";
import Contact from "@/pages/Contact";
import MobileApp from "@/pages/MobileApp";

// Initialize Stripe with a test key for demo purposes
// In production, this would be loaded from environment variables
const stripePromise = loadStripe('pk_test_51Hf6ZnKiG8GjZ0YhN2OU4ZqKwf9JhP8OjLnK6mN0fQ9nZ8G7cE1jRnT4fW3sA9wE2vB5dF7kL1nM0xY6pQ8oI3uN5tV00q9vZ8G7c');

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  // Remove demo login requirement - show normal pages
  
  // Hide Navigation on /admin route OR for admin/superadmin users
  const isAdminRoute = location === '/admin';
  const isAdminUser = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <div className="min-h-screen bg-background">
      {!isAdminRoute && !isAdminUser && <Navigation isAuthenticated={isAuthenticated} />}
      <main className={isAuthenticated && !isAdminRoute ? "pt-16" : ""}>
        <Switch>
          {/* Admin route accessible to everyone - handles its own auth */}
          <Route path="/admin" component={Admin} />
          
          {/* Public routes - always accessible */}
          <Route path="/signup" component={Signup} />
          <Route path="/document-signup" component={DocumentSignup} />
          <Route path="/professional-signup" component={ProfessionalSignup} />
          <Route path="/signup-completion" component={SignupCompletion} />
          <Route path="/verify-otp" component={OTPVerification} />
          
          {!isAuthenticated ? (
            <>
              <Route path="/" component={Landing} />
            </>
          ) : (
            <>
              <Route path="/" component={() => {
                // Admin/Superadmin go directly to admin panel only
                if (user?.role === 'admin' || user?.role === 'superadmin') {
                  window.location.href = '/admin';
                  return null;
                }
                // Publishers go to stays page (flat structure)
                if (user?.role === 'publisher') {
                  return <Stays />;
                }
                // Regular users see dashboard
                return <Dashboard />;
              }} />
              <Route path="/dashboard" component={() => {
                // Admin/Superadmin - redirect to admin panel
                if (user?.role === 'admin' || user?.role === 'superadmin') {
                  window.location.href = '/admin';
                  return null;
                }
                // Publishers shouldn't access dashboard - redirect to stays
                if (user?.role === 'publisher') {
                  return <Stays />;
                }
                return <Dashboard />;
              }} />
              {/* Block all normal routes for admin/superadmin */}
              {user?.role !== 'admin' && user?.role !== 'superadmin' && (
                <>
                  <Route path="/discover" component={DiscoverTravelers} />
                  <Route path="/explore" component={Explore} />
                  <Route path="/stays" component={Stays} />
                  <Route path="/trips" component={Trips} />
                  <Route path="/tour-packages" component={TourPackages} />
                  <Route path="/my-bookings" component={MyBookings} />
                  <Route path="/personal-hosts" component={PersonalHosts} />
                  <Route path="/profile/:userId" component={UserProfile} />
                  <Route path="/map" component={Map} />
                  <Route path="/profile" component={Profile} />
                  <Route path="/feed" component={Feed} />
                  <Route path="/boosted-posts" component={BoostedPosts} />
                  <Route path="/ads" component={AdsWrapper} />
                  <Route path="/earn" component={AdsWrapper} />
                  <Route path="/payment/:campaignId" component={PaymentPage} />
                  <Route path="/payment/success/:campaignId" component={PaymentSuccess} />
                  <Route path="/publisher/submissions" component={PublisherDashboard} />
                  <Route path="/messages" component={Messages} />
                  <Route path="/events" component={Events} />
                  <Route path="/billing" component={Billing} />
                  <Route path="/wallet" component={Wallet} />
                </>
              )}
            </>
          )}
          {/* Public routes (accessible to everyone) */}
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/help-center" component={HelpCenter} />
          <Route path="/community-guidelines" component={CommunityGuidelines} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route path="/about-us" component={AboutUs} />
          <Route path="/careers" component={Careers} />
          <Route path="/press" component={Press} />
          <Route path="/contact" component={Contact} />
          <Route path="/mobile-app" component={MobileApp} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Elements stripe={stripePromise}>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </Elements>
    </QueryClientProvider>
  );
}

export default App;