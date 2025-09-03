import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
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
import DocumentSignup from "@/pages/DocumentSignup";
import ProfessionalSignup from "@/pages/ProfessionalSignup";
import SignupCompletion from "@/pages/SignupCompletion";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={isAuthenticated} />
      <main className={isAuthenticated ? "pt-16" : ""}>
        <Switch>
          {!isAuthenticated ? (
            <>
              <Route path="/" component={Landing} />
              <Route path="/subscribe" component={Subscribe} />
              <Route path="/document-signup" component={DocumentSignup} />
              <Route path="/professional-signup" component={ProfessionalSignup} />
              <Route path="/signup-completion" component={SignupCompletion} />
            </>
          ) : (
            <>
              <Route path="/" component={() => {
                // Publishers go to stays page, others go to dashboard
                if (user?.role === 'publisher') {
                  return <Stays />;
                }
                return <Dashboard />;
              }} />
              <Route path="/dashboard" component={() => {
                // Publishers shouldn't access dashboard - redirect to stays
                if (user?.role === 'publisher') {
                  return <Stays />;
                }
                return <Dashboard />;
              }} />
              <Route path="/discover" component={DiscoverTravelers} />
              <Route path="/stays" component={Stays} />
              <Route path="/trips" component={Trips} />
              <Route path="/tour-packages" component={TourPackages} />
              <Route path="/profile" component={Profile} />
              <Route path="/feed" component={Feed} />
              <Route path="/ads" component={AdsWrapper} />
              <Route path="/messages" component={Messages} />
              <Route path="/admin" component={Admin} />
              <Route path="/subscribe" component={Subscribe} />
              <Route path="/events" component={Events} />
              <Route path="/billing" component={Billing} />
              <Route path="/document-signup" component={DocumentSignup} />
              <Route path="/professional-signup" component={ProfessionalSignup} />
            </>
          )}
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;