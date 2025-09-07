import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Radar, MessageCircle, Users, Calendar, DollarSign, Settings, LogOut, Moon, Sun, Menu, TrendingUp, Home, Globe, Plane, Package, Crown, Lock, CreditCard, UserCheck, MoreHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LoginModal } from "@/components/auth/LoginModal";

export function Navigation({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { user } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();

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
    
    localStorage.clear(); // Clear all demo user data
    window.location.href = '/'; // Redirect to homepage
  };

  if (!isAuthenticated) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <span className="text-xl font-bold text-foreground">HubLink</span>
              </div>
            </Link>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                data-testid="button-theme-toggle"
              >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" onClick={handleSignIn} data-testid="button-sign-in">
                Sign In
              </Button>
              <Button onClick={handleGetStarted} data-testid="button-get-started">
                Get Started
              </Button>
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
  let navItems = [];
  
  if (user?.role === 'publisher') {
    // Publisher role only sees these 5 menus
    navItems = [
      { href: "/stays", icon: Home, label: "Stays", testId: "nav-stays" },
      { href: "/tour-packages", icon: Package, label: "Tour Packages", testId: "nav-tour-packages" },
      { href: "/personal-hosts", icon: UserCheck, label: "Personal Hosts", testId: "nav-personal-hosts" },
      { href: "/ads", icon: DollarSign, label: "Campaigns", testId: "nav-ads" },
      { href: "/billing", icon: CreditCard, label: "Billing", testId: "nav-billing" },
    ];
  } else {
    // All other roles see primary navigation (reduced to fit better)
    navItems = [
      { href: "/dashboard", icon: TrendingUp, label: "Dashboard", testId: "nav-dashboard" },
      { href: "/discover", icon: Radar, label: "Discover", testId: "nav-discover" },
      { href: "/stays", icon: Home, label: "Stays", testId: "nav-stays" },
      { href: "/personal-hosts", icon: UserCheck, label: "Hosts", testId: "nav-personal-hosts" },
      { href: "/feed", icon: Users, label: "Feed", testId: "nav-feed" },
      { href: "/earn", icon: DollarSign, label: "Earn", testId: "nav-earn" },
    ];
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-foreground">HubLink</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-3">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={location === item.href ? "default" : "ghost"}
                  className="flex items-center space-x-1 h-9 px-3"
                  data-testid={item.testId}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                  {(item as any).restricted && <Lock className="w-3 h-3 ml-1 text-muted-foreground" />}
                </Button>
              </Link>
            ))}
          </div>

          {/* Medium Screen Navigation - Icons Only */}
          <div className="hidden md:flex lg:hidden items-center space-x-2">
            {navItems.slice(0, 4).map((item) => (
              <Link key={item.href} href={item.href} title={item.label}>
                <Button
                  variant={location === item.href ? "default" : "ghost"}
                  size="icon"
                  className="h-9 w-9"
                  data-testid={item.testId}
                >
                  <item.icon className="w-4 h-4" />
                </Button>
              </Link>
            ))}
            
            {/* More Menu for remaining items */}
            {navItems.length > 4 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {navItems.slice(4).map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center space-x-2">
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex items-center space-x-4">
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
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col space-y-3 mt-8">
                  {/* All navigation items in mobile */}
                  {[
                    { href: "/dashboard", icon: TrendingUp, label: "Dashboard", testId: "nav-dashboard" },
                    { href: "/discover", icon: Radar, label: "Discover", testId: "nav-discover" },
                    { href: "/stays", icon: Home, label: "Stays", testId: "nav-stays" },
                    { href: "/trips", icon: Plane, label: "Trips", testId: "nav-trips" },
                    { href: "/tour-packages", icon: Package, label: "Tour Packages", testId: "nav-tour-packages" },
                    { href: "/personal-hosts", icon: UserCheck, label: "Personal Hosts", testId: "nav-personal-hosts" },
                    { href: "/messages", icon: MessageCircle, label: "Messages", testId: "nav-messages" },
                    { href: "/feed", icon: Users, label: "Feed", testId: "nav-feed" },
                    { href: "/events", icon: Calendar, label: "Events", testId: "nav-events" },
                    { href: "/earn", icon: DollarSign, label: "Earn", testId: "nav-earn" },
                  ].filter(item => {
                    // Filter based on user role
                    if (user?.role === 'publisher') {
                      return ["/stays", "/tour-packages", "/personal-hosts", "/ads", "/billing"].some(path => item.href === path) || 
                             item.href === "/ads" || item.href === "/billing";
                    }
                    return true;
                  }).map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={location === item.href ? "default" : "ghost"}
                        className="w-full justify-start space-x-3 h-12"
                        data-testid={`mobile-${item.testId}`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="text-base">{item.label}</span>
                        {(item as any).restricted && <Lock className="w-4 h-4 ml-auto text-muted-foreground" />}
                      </Button>
                    </Link>
                  ))}
                  
                  {/* Add missing publisher items if needed */}
                  {user?.role === 'publisher' && (
                    <>
                      <Link href="/ads">
                        <Button
                          variant={location === "/ads" ? "default" : "ghost"}
                          className="w-full justify-start space-x-3 h-12"
                        >
                          <DollarSign className="w-5 h-5" />
                          <span className="text-base">Campaigns</span>
                        </Button>
                      </Link>
                      <Link href="/billing">
                        <Button
                          variant={location === "/billing" ? "default" : "ghost"}
                          className="w-full justify-start space-x-3 h-12"
                        >
                          <CreditCard className="w-5 h-5" />
                          <span className="text-base">Billing</span>
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl || ""} alt={user?.displayName || user?.username} />
                    <AvatarFallback data-testid="text-user-initials">
                      {(user?.displayName || user?.username || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile" data-testid="link-profile">
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                {user?.plan !== 'free' && user?.role !== 'publisher' ? (
                  <DropdownMenuItem asChild>
                    <Link href="/billing" data-testid="link-billing">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Billing
                    </Link>
                  </DropdownMenuItem>
                ) : user?.plan === 'free' ? (
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
      
      {/* Auth Modals */}
      <LoginModal 
        open={loginModalOpen} 
        onOpenChange={setLoginModalOpen} 
      />
    </nav>
  );
}
