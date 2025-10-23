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
import DocumentSignup from "@/pages/DocumentSignup";
import ProfessionalSignup from "@/pages/ProfessionalSignup";
import SignupCompletion from "@/pages/SignupCompletion";
import OTPVerification from "@/pages/OTPVerification";
import ResetPassword from "@/pages/ResetPassword";

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
  
  // Check if we're on admin route OR user is admin - don't show Navigation
  const isAdminRoute = location === '/admin';
  const isAdminUser = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'moderator';

  return (
    <div className="min-h-screen bg-background">
      {!isAdminRoute && !isAdminUser && <Navigation isAuthenticated={isAuthenticated} />}
      <main className={isAuthenticated && !isAdminRoute && !isAdminUser ? "pt-16" : ""}>
        <Switch>
          {/* Admin route accessible to everyone - handles its own auth */}
          <Route path="/admin" component={Admin} />
          
          {!isAuthenticated ? (
            <>
              <Route path="/" component={Landing} />
              <Route path="/subscribe" component={Subscribe} />
              <Route path="/document-signup" component={DocumentSignup} />
              <Route path="/professional-signup" component={ProfessionalSignup} />
              <Route path="/signup-completion" component={SignupCompletion} />
              <Route path="/verify-otp" component={OTPVerification} />
            </>
          ) : (
            <>
              <Route path="/" component={() => {
                // Admins should ONLY access admin panel, not user dashboard
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                // Publishers go to stays page (flat structure), others go to dashboard
                if (user?.role === 'publisher') {
                  return <Stays />;
                }
                return <Dashboard />;
              }} />
              <Route path="/dashboard" component={() => {
                // Block admins from accessing user dashboard
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                // Publishers shouldn't access dashboard - redirect to stays
                if (user?.role === 'publisher') {
                  return <Stays />;
                }
                return <Dashboard />;
              }} />
              <Route path="/discover" component={() => {
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                return <DiscoverTravelers />;
              }} />
              <Route path="/explore" component={() => {
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                return <Explore />;
              }} />
              <Route path="/stays" component={() => {
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                return <Stays />;
              }} />
              <Route path="/trips" component={() => {
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                return <Trips />;
              }} />
              <Route path="/tour-packages" component={() => {
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                return <TourPackages />;
              }} />
              <Route path="/my-bookings" component={() => {
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                return <MyBookings />;
              }} />
              <Route path="/personal-hosts" component={() => {
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                return <PersonalHosts />;
              }} />
              <Route path="/profile/:userId" component={() => {
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                return <UserProfile />;
              }} />
              <Route path="/map" component={() => {
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                return <Map />;
              }} />
              <Route path="/profile" component={() => {
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                return <Profile />;
              }} />
              <Route path="/feed" component={() => {
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                return <Feed />;
              }} />
              <Route path="/boosted-posts" component={() => {
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                return <BoostedPosts />;
              }} />
              <Route path="/ads" component={() => {
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                return <AdsWrapper />;
              }} />
              <Route path="/earn" component={() => {
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                return <AdsWrapper />;
              }} />
              <Route path="/payment/:campaignId" component={() => {
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                return <PaymentPage />;
              }} />
              <Route path="/payment/success/:campaignId" component={() => {
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                return <PaymentSuccess />;
              }} />
              <Route path="/messages" component={() => {
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                return <Messages />;
              }} />
              <Route path="/subscribe" component={() => {
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                return <Subscribe />;
              }} />
              <Route path="/events" component={() => {
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                return <Events />;
              }} />
              <Route path="/billing" component={() => {
                if (isAdminUser) {
                  window.location.href = '/admin';
                  return null;
                }
                return <Billing />;
              }} />
              <Route path="/document-signup" component={DocumentSignup} />
              <Route path="/professional-signup" component={ProfessionalSignup} />
              <Route path="/signup-completion" component={SignupCompletion} />
              <Route path="/verify-otp" component={OTPVerification} />
            </>
          )}
          {/* Public routes (accessible to everyone) */}
          <Route path="/reset-password" component={ResetPassword} />
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