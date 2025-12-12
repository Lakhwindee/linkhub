import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Radar, MessageCircle, Users, Calendar, DollarSign, Settings, LogOut, Moon, Sun, Menu, TrendingUp, Home, Globe, Plane, Package, Crown, Lock, CreditCard, UserCheck, History, Zap } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LoginModal } from "@/components/auth/LoginModal";
import { useToast } from "@/hooks/use-toast";

export function Navigation({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { user, isLoading } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { toast } = useToast();
  
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();

  // Check for login redirect from signup (when user already exists)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loginParam = params.get('login');
    
    if (!isAuthenticated) {
      if (loginParam === 'account_exists') {
        // Open login modal
        setLoginModalOpen(true);
        
        // Show toast message
        toast({
          title: "Account Already Registered",
          description: "This email is already registered. Please log in instead.",
          variant: "default",
          duration: 5000,
        });
        
        // Clean URL without reloading
        window.history.replaceState({}, '', '/');
      } else if (loginParam === 'true') {
        // Open login modal when coming from "Sign in here" link
        setLoginModalOpen(true);
        
        // Clean URL without reloading
        window.history.replaceState({}, '', '/');
      }
    }
  }, [isAuthenticated, toast]);

  const handleSignIn = () => {
    setLoginModalOpen(true);
  };

  const handleGetStarted = () => {
    // Redirect to professional signup page
    window.location.href = '/professional-signup';
  };

  const handleLogout = async () => {
    try {
      // Call logout API to clear server session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.log('Logout error:', error);
    }
    
    localStorage.clear(); // Clear all user data
    window.location.href = '/'; // Redirect to homepage
  };

  if (!isAuthenticated) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <img 
                  src="/thepicstory-logo.png" 
                  alt="ThePicStory" 
                  className="w-auto" 
                  style={{ height: '120px', maxWidth: '500px' }}
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {location !== '/' && (
                <Button variant="ghost" asChild>
                  <Link href="/">Home</Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                data-testid="button-theme-toggle"
              >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/for-business">For Business</Link>
              </Button>
              <Button variant="ghost" onClick={handleSignIn} data-testid="button-sign-in">
                Sign In
              </Button>
              <Button onClick={handleGetStarted} data-testid="button-get-started">
                Get Started
              </Button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <div className="flex flex-col space-y-4 mt-8">
                    {location !== '/' && (
                      <Button variant="outline" asChild className="w-full justify-start">
                        <Link href="/">Home</Link>
                      </Button>
                    )}
                    <Button variant="outline" asChild className="w-full justify-start">
                      <Link href="/for-business">For Business</Link>
                    </Button>
                    <Button variant="outline" onClick={handleSignIn} className="w-full justify-start">
                      Sign In
                    </Button>
                    <Button onClick={handleGetStarted} className="w-full">
                      Get Started
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
        
        {/* Auth Modals */}
        <LoginModal 
          open={loginModalOpen} 
          onOpenChange={setLoginModalOpen} 
        />
      </nav>
    );
  }

  // Navigation items based on user role
  let navItems: Array<{href: string, icon: any, label: string, testId: string}> = [];
  
  // Don't render navigation items until user data is fully loaded to prevent flashing
  if (isLoading || !user) {
    navItems = [];
  } else if (user.role === 'publisher') {
    // Publisher role sees flat navigation structure (original)
    navItems = [
      { href: "/stays", icon: Home, label: "Stays", testId: "nav-stays" },
      { href: "/tour-packages", icon: Package, label: "Tour Packages", testId: "nav-tour-packages" },
      { href: "/personal-hosts", icon: UserCheck, label: "Personal Hosts", testId: "nav-personal-hosts" },
      { href: "/ads", icon: DollarSign, label: "Campaigns", testId: "nav-campaigns" },
      { href: "/publisher/submissions", icon: Users, label: "Submissions", testId: "nav-submissions" },
      { href: "/wallet", icon: CreditCard, label: "Wallet", testId: "nav-wallet" },
      { href: "/billing", icon: CreditCard, label: "Finance", testId: "nav-finance" },
    ];
  } else {
    // All other roles see full navigation
    const campaignsLabel = (user?.role === 'creator' || user?.role === 'free_creator') ? 'Earn' : 'Campaigns';
    navItems = [
      { href: "/dashboard", icon: TrendingUp, label: "Dashboard", testId: "nav-dashboard" },
      { href: "/discover", icon: Radar, label: "Discover", testId: "nav-discover" },
      { href: "/explore", icon: Globe, label: "Explore", testId: "nav-explore" },
      { href: "/trips", icon: Plane, label: "Trips", testId: "nav-trips" },
      { href: "/messages", icon: MessageCircle, label: "Messages", testId: "nav-messages" },
      { href: "/feed", icon: Users, label: "Feed", testId: "nav-feed" },
      { href: "/events", icon: Calendar, label: "Events", testId: "nav-events" },
      { href: "/ads", icon: DollarSign, label: campaignsLabel, testId: "nav-campaigns" },
    ];
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-full px-1 sm:px-2 lg:max-w-7xl lg:mx-auto lg:px-4">
        <div className="flex justify-center items-center h-16">
          {/* Centered Container with ALL navigation elements */}
          <div className="flex items-center space-x-4 lg:space-x-6">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center space-x-2">
                <img 
                  src="/thepicstory-logo.png" 
                  alt="ThePicStory" 
                  className="w-auto" 
                  style={{ height: '100px', maxWidth: '250px' }}
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-0.5 lg:space-x-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={location === item.href ? "default" : "ghost"}
                  className="flex items-center space-x-1 text-sm lg:text-base whitespace-nowrap px-2 lg:px-3 py-2 h-9 lg:h-10 min-w-fit"
                  data-testid={item.testId}
                >
                  <item.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span>{item.label}</span>
                  {(item as any).restricted && <Lock className="w-3 h-3 ml-1 text-muted-foreground" />}
                </Button>
              </Link>
            ))}
            </div>

            {/* Right side controls - now part of centered container */}
            <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            data-testid="button-theme-toggle"
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[350px]">
              <div className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={location === item.href ? "default" : "ghost"}
                      className="w-full justify-start space-x-2"
                      data-testid={`mobile-${item.testId}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {(item as any).restricted && <Lock className="w-3 h-3 ml-auto text-muted-foreground" />}
                    </Button>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-user-menu">
                <Avatar className="h-8 w-8">
                  {!isLoading && user ? (
                    <>
                      <AvatarImage src={user.profileImageUrl || ""} alt={user.displayName || user.username} />
                      <AvatarFallback data-testid="text-user-initials">
                        {(user.displayName || user.username || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </>
                  ) : (
                    <AvatarFallback data-testid="text-user-initials">
                      U
                    </AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mr-2" align="end" sideOffset={8}>
              <DropdownMenuItem asChild>
                  <Link href="/profile" data-testid="link-profile">
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                {/* Boosted Posts - Only for creators/users, not publishers */}
                {user?.role !== 'publisher' && (
                  <DropdownMenuItem asChild>
                    <Link href="/boosted-posts" data-testid="link-boosted-posts">
                      <Zap className="mr-2 h-4 w-4" />
                      Boosted Posts
                    </Link>
                  </DropdownMenuItem>
                )}
                {user?.plan !== 'free' && user?.role !== 'publisher' ? (
                  <DropdownMenuItem asChild>
                    <Link href="/billing" data-testid="link-billing">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Billing
                    </Link>
                  </DropdownMenuItem>
                ) : user?.plan === 'free' && user?.role !== 'publisher' ? (
                  <DropdownMenuItem asChild>
                    <Link href="/subscribe" data-testid="link-upgrade">
                      <Crown className="mr-2 h-4 w-4 text-orange-500" />
                      Upgrade Plan
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onClick={handleLogout} data-testid="link-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth Modals */}
      <LoginModal 
        open={loginModalOpen} 
        onOpenChange={setLoginModalOpen} 
      />
    </nav>
  );
}
