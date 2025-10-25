import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, MessageCircle, Users, Calendar, DollarSign, Shield, CheckIcon, CheckCircle, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function Landing() {
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);

  useEffect(() => {
    try {
      // Check if user was redirected here after successful signup
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('signup') === 'success') {
        setShowSignupSuccess(true);
        // Clean up URL
        window.history.replaceState({}, '', '/');
      }
    } catch (error) {
      console.error('Landing page error:', error);
    }
  }, []);

  const features = [
    {
      icon: MapPin,
      title: "Discover on Map",
      description: "Find travelers near you with interactive clustering, city filters, and privacy controls.",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300"
    },
    {
      icon: MessageCircle,
      title: "Connect & Chat",
      description: "Send connect requests with intro messages and chat privately with accepted connections.",
      image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300"
    },
    {
      icon: Users,
      title: "Share Stories",
      description: "Post text, photos, and videos to global, country, or following feeds with location tags.",
      image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300"
    },
    {
      icon: DollarSign,
      title: "Earn from Ads",
      description: "Reserve brand campaigns, create content, and earn money after admin approval.",
      image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300"
    },
    {
      icon: Calendar,
      title: "Create Events",
      description: "Organize meetups, tours, and collaborations with RSVP management and reminders.",
      image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300"
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Control your visibility, set location radius, and manage who can contact you.",
      image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300"
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Browse Campaigns",
      description: "Explore available brand campaigns in the Ad Marketplace",
      image: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300"
    },
    {
      step: 2,
      title: "Reserve Campaign",
      description: "Reserve your preferred campaign with a 72-hour deadline",
      image: "https://images.unsplash.com/photo-1556740758-90de374c12ad?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300"
    },
    {
      step: 3,
      title: "Create Content",
      description: "Film your video following the brand guidelines and requirements",
      image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300"
    },
    {
      step: 4,
      title: "Get Paid",
      description: "Submit for approval and receive payment after admin verification",
      image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300"
    }
  ];

  const plans = [
    {
      name: "Free",
      description: "Perfect for browsing & connecting",
      price: "$0",
      period: "Forever free",
      features: [
        "View global feed",
        "Connect requests & DM",
        "Create & join events",
        "View stays & tour packages",
        "Full map access",
        "Basic profile"
      ],
      limitations: [
        "Cannot earn money from ads",
        "No YouTube verification",
        "No creator payouts"
      ],
      popular: false,
      cta: "Sign Up Free",
      ctaLink: "/signup"
    },
    {
      name: "Premium",
      description: "For creators who want to earn",
      price: "£45",
      period: "per month",
      features: [
        "Everything in Free",
        "Earn from brand campaigns",
        "YouTube channel verification",
        "Creator payout account",
        "Reserve campaigns",
        "Submit content for approval",
        "15-tier creator system",
        "Campaign earnings tracker",
        "Priority support"
      ],
      limitations: [],
      popular: true,
      cta: "Upgrade to Premium",
      ctaLink: "/signup?redirect=/subscribe"
    }
  ];

  const destinations = [
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
    "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
    "https://images.unsplash.com/photo-1526392060635-9d6019884377?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
    "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
    "https://images.unsplash.com/photo-1527004013197-933c4bb611b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
    "https://images.unsplash.com/photo-1516426122078-c23e76319801?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300"
  ];

  return (
    <div className="bg-background">
      {/* Success Message */}
      {showSignupSuccess && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              🎉 Signup completed successfully! Please sign in with your credentials to access your account.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-accent/10 text-accent border-accent/20">
                  🌍 Connect with 1M+ travelers worldwide
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                  Your Global Travel
                  <span className="text-accent"> Community</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Discover travelers near you, share your journey, and earn from brand collaborations. Join the world's most trusted travel network.
                </p>
              </div>


              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground" >50K+</div>
                  <div className="text-sm text-muted-foreground">Active Travelers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground" >180+</div>
                  <div className="text-sm text-muted-foreground">Countries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground" >$2M+</div>
                  <div className="text-sm text-muted-foreground">Creator Earnings</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1519302959554-a75be0afc82a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                alt="World map with location pins" 
                className="rounded-2xl shadow-2xl w-full h-auto"
                              />
              
              <div className="absolute top-4 right-4 bg-card border border-border rounded-xl p-4 shadow-lg glass-effect animate-bounce-slow">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-accent-foreground">JS</span>
                  </div>
                  <div>
                    <div className="font-semibold text-card-foreground">@hublink/UK/000123</div>
                    <div className="text-xs text-muted-foreground">London, UK • Online</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 left-4 bg-card border border-border rounded-xl p-4 shadow-lg glass-effect">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-chart-2 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">AR</span>
                  </div>
                  <div>
                    <div className="font-semibold text-card-foreground">@hublink/IN/000456</div>
                    <div className="text-xs text-muted-foreground">Mumbai, India • Creating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground" >
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" >
              From discovering travelers nearby to earning from brand collaborations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="travel-card">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="rounded-t-xl w-full h-48 object-cover"
                                 />
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-4 h-4 text-accent" />
                    </div>
                    <h3 className="text-lg font-semibold text-card-foreground">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground" >
              How Creators Earn
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" >
              Simple steps to start earning from brand collaborations
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center space-y-4" >
                <img 
                  src={step.image} 
                  alt={step.title}
                  className="rounded-xl w-full h-48 object-cover mx-auto"
                                  />
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto">
                  <span className="text-xl font-bold text-accent-foreground" >
                    {step.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground" >
                  {step.title}
                </h3>
                <p className="text-muted-foreground" >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground" >
              Choose Your Plan
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" >
              Start free and upgrade as you grow your travel network
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-2 border-primary shadow-xl' : ''}`} >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold rounded-full">
                    Most Popular
                  </div>
                )}
                <CardContent className="p-8 space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-card-foreground" >
                      {plan.name}
                    </h3>
                    <p className="text-muted-foreground mt-2" >
                      {plan.description}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-card-foreground" >
                      {plan.price}
                    </div>
                    <div className="text-sm text-muted-foreground" >
                      {plan.period}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-card-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    {plan.limitations && plan.limitations.length > 0 && (
                      <div className="pt-4 border-t border-border">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Limitations:</p>
                        {plan.limitations.map((limitation, idx) => (
                          <div key={idx} className="flex items-start space-x-3">
                            <span className="text-muted-foreground text-xs">• {limitation}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Link href={plan.ctaLink}>
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground" >
              Join Our Global Community
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" >
              Connect with travelers from around the world
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((image, index) => (
              <img 
                key={index}
                src={image} 
                alt={`Travel destination ${index + 1}`}
                className="rounded-xl travel-card h-48 w-full object-cover"
                              />
            ))}
          </div>

          <div className="text-center mt-12">
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground" >180+</div>
                  <div className="text-muted-foreground">Countries</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground" >50K+</div>
                  <div className="text-muted-foreground">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground" >1M+</div>
                  <div className="text-muted-foreground">Connections Made</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground" >$2M+</div>
                  <div className="text-muted-foreground">Creator Earnings</div>
                </div>
              </div>

              <Button size="lg" className="px-8 py-4" asChild >
                <Link href="/signup">Join HubLink Today</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <img 
                  src="/hublink-logo.png" 
                  alt="HubLink" 
                  className="w-auto brightness-0 invert" 
                  style={{ height: '100px', maxWidth: '375px' }}
                />
              </div>
              <p className="text-primary-foreground/80">
                Your global travel community platform. Connect, share, and earn from your travel experiences.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li><a href="#features" className="hover:text-primary-foreground">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary-foreground">Pricing</a></li>
                <li><a href="/ads" className="hover:text-primary-foreground">Ad Marketplace</a></li>
                <li><a href="/mobile-app" className="hover:text-primary-foreground">Mobile App</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Support</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li><a href="/help-center" className="hover:text-primary-foreground">Help Center</a></li>
                <li><a href="/community-guidelines" className="hover:text-primary-foreground">Community Guidelines</a></li>
                <li><a href="/privacy-policy" className="hover:text-primary-foreground">Privacy Policy</a></li>
                <li><a href="/terms-of-service" className="hover:text-primary-foreground">Terms of Service</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Company</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li><a href="/about-us" className="hover:text-primary-foreground">About Us</a></li>
                <li><a href="/careers" className="hover:text-primary-foreground">Careers</a></li>
                <li><a href="/press" className="hover:text-primary-foreground">Press</a></li>
                <li><a href="/contact" className="hover:text-primary-foreground">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center text-primary-foreground/80">
            <p>&copy; 2024 HubLink. All rights reserved. | Made with ❤️ for travelers worldwide</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
