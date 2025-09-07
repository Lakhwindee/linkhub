import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, MessageCircle, Users, Calendar, DollarSign, Shield, CheckIcon, Crown, Zap, Megaphone } from "lucide-react";
import { useState } from "react";

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState<string | null>(null);

  const handleDemoLogin = async (userId: string, role: string, plan: string) => {
    console.log('🔴 BUTTON CLICKED! Demo login triggered for:', { userId, role, plan });
    setIsLoading(true);
    setLoadingUser(userId);
    try {
      console.log('Starting demo login for:', userId);
      const response = await fetch('/api/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role, plan }),
        credentials: 'include',
      });
      
      if (response.ok) {
        console.log('Demo login API success, setting localStorage...');
        // Clear any existing auth data first
        localStorage.clear();
        
        // Set new demo user data with multiple attempts
        console.log('Setting localStorage for userId:', userId);
        
        // Try setting multiple times with verification each time
        for (let i = 0; i < 3; i++) {
          localStorage.setItem('hublink_demo_user', 'true');
          localStorage.setItem('hublink_demo_user_id', userId);
          
          const checkUser = localStorage.getItem('hublink_demo_user');
          const checkUserId = localStorage.getItem('hublink_demo_user_id');
          console.log(`🔄 Attempt ${i + 1}: localStorage set:`, { checkUser, checkUserId, expectedUserId: userId });
          
          if (checkUser === 'true' && checkUserId === userId) {
            console.log(`✅ Success on attempt ${i + 1}!`);
            break;
          }
          
          if (i === 2) {
            console.error('❌ Failed to set localStorage after 3 attempts!');
          }
        }
        
        // Check again after 100ms
        setTimeout(() => {
          const doubleCheckUser = localStorage.getItem('hublink_demo_user');
          const doubleCheckUserId = localStorage.getItem('hublink_demo_user_id');
          console.log('🕐 localStorage 100ms later:', { doubleCheckUser, doubleCheckUserId });
        }, 100);
        
        console.log('localStorage set:', {
          demo_user: localStorage.getItem('hublink_demo_user'),
          demo_user_id: localStorage.getItem('hublink_demo_user_id')
        });
        
        // Wait a bit more to ensure localStorage is fully set before triggering auth update
        setTimeout(() => {
          console.log('🚀 About to trigger authUpdate event...');
          window.dispatchEvent(new Event('authUpdate'));
        }, 200);
        
        // Fallback: reload after delay if auth doesn't update
        setTimeout(() => {
          const currentAuthState = localStorage.getItem('hublink_demo_user');
          console.log('🔍 Checking if auth updated, current state:', currentAuthState);
          if (currentAuthState === 'true') {
            console.log('✅ Auth updated successfully without reload');
          } else {
            console.log('⚠️ Auth not updated, forcing page reload');
            window.location.reload();
          }
        }, 500);
      } else {
        console.error('Demo login failed with status:', response.status);
      }
    } catch (error) {
      console.error('Demo login error:', error);
    } finally {
      setIsLoading(false);
      setLoadingUser(null);
    }
  };

  const demoUsers = [
    {
      id: 'demo-admin',
      role: 'admin',
      plan: 'premium',
      name: 'Admin',
      description: 'Platform management',
      icon: Shield,
      color: 'bg-red-500',
    },
    {
      id: 'demo-creator-premium',
      role: 'creator',
      plan: 'premium',
      name: 'Creator Premium',
      description: 'Full creator access',
      icon: Crown,
      color: 'bg-purple-500',
    },
    {
      id: 'demo-creator-standard',
      role: 'creator',
      plan: 'standard',
      name: 'Creator Standard',
      description: 'Basic creator access',
      icon: Zap,
      color: 'bg-blue-500',
    },
    {
      id: 'demo-publisher',
      role: 'publisher',
      plan: 'premium',
      name: 'Publisher',
      description: 'Campaign creation',
      icon: Megaphone,
      color: 'bg-green-500',
    }
  ];

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
      description: "Perfect for browsing",
      price: "$0",
      period: "Forever free",
      features: [
        "View global feed",
        "Limited map preview", 
        "Basic profile"
      ],
      limitations: [
        "No DM access"
      ]
    },
    {
      name: "Premium",
      description: "Full access & earn money",
      price: "$45", 
      period: "per month",
      popular: true,
      features: [
        "Full map access",
        "Connect requests & DM",
        "Create & join events",
        "Ad Marketplace access",
        "Earnings dashboard",
        "Priority support"
      ]
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

          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-accent' : ''}`} >
                {plan.popular && (
                  <div className="absolute top-4 right-4 bg-accent text-accent-foreground px-3 py-1 text-xs font-medium rounded-full">
                    Most Popular
                  </div>
                )}
                <CardContent className="p-8 space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-card-foreground" >
                      {plan.name}
                    </h3>
                    <p className="text-muted-foreground" >
                      {plan.description}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-card-foreground" >
                      {plan.price}
                    </div>
                    <div className="text-sm text-muted-foreground" >
                      {plan.period}
                    </div>
                  </div>
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-accent hover:bg-accent/90' : ''}`}
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                                      >
                    <a href="/document-signup">
                      {plan.name === 'Free' ? 'Sign Up' : 'Start Free Trial'}
                    </a>
                  </Button>
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-3" >
                        <CheckIcon className="w-5 h-5 text-accent" />
                        <span className="text-card-foreground">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations?.map((limitation, limitIndex) => (
                      <div key={limitIndex} className="flex items-center space-x-3 opacity-50" >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                        <span className="text-muted-foreground">{limitation}</span>
                      </div>
                    ))}
                  </div>
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
                <a href="/document-signup">Join HubLink Today</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Login Credentials Section */}
      <section className="py-10 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">🔑 Demo Login Credentials</h2>
            <p className="text-muted-foreground">Use these credentials on the main login page to test different user roles!</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardContent className="p-6 text-center">
                <Crown className="w-12 h-12 mx-auto mb-4 text-orange-600" />
                <h3 className="font-bold text-lg mb-2">Creator Premium</h3>
                <div className="space-y-2 text-sm bg-white p-4 rounded-lg">
                  <div><strong>Username:</strong> <code className="bg-gray-100 px-2 py-1 rounded">premium_creator</code></div>
                  <div><strong>Email:</strong> <code className="bg-gray-100 px-2 py-1 rounded">creator-premium@hublink.com</code></div>
                  <div><strong>Access:</strong> Full premium creator features</div>
                </div>
                <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => navigator.clipboard.writeText('premium_creator')}>
                  Copy Username
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-6 text-center">
                <Zap className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <h3 className="font-bold text-lg mb-2">Creator Standard</h3>
                <div className="space-y-2 text-sm bg-white p-4 rounded-lg">
                  <div><strong>Username:</strong> <code className="bg-gray-100 px-2 py-1 rounded">standard_creator</code></div>
                  <div><strong>Email:</strong> <code className="bg-gray-100 px-2 py-1 rounded">creator-standard@hublink.com</code></div>
                  <div><strong>Access:</strong> Standard creator features</div>
                </div>
                <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => navigator.clipboard.writeText('standard_creator')}>
                  Copy Username
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardContent className="p-6 text-center">
                <Megaphone className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                <h3 className="font-bold text-lg mb-2">Publisher</h3>
                <div className="space-y-2 text-sm bg-white p-4 rounded-lg">
                  <div><strong>Username:</strong> <code className="bg-gray-100 px-2 py-1 rounded">demo_publisher</code></div>
                  <div><strong>Email:</strong> <code className="bg-gray-100 px-2 py-1 rounded">publisher@hublink.com</code></div>
                  <div><strong>Access:</strong> Full publisher features</div>
                </div>
                <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => navigator.clipboard.writeText('demo_publisher')}>
                  Copy Username
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>How to use:</strong> Click "Sign In" in the top navigation, then use any of these usernames. 
              No password needed - this is a demo system!
            </p>
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
                <li><a href="#" className="hover:text-primary-foreground">Ad Marketplace</a></li>
                <li><a href="#" className="hover:text-primary-foreground">Mobile App</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Support</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li><a href="#" className="hover:text-primary-foreground">Help Center</a></li>
                <li><a href="#" className="hover:text-primary-foreground">Community Guidelines</a></li>
                <li><a href="#" className="hover:text-primary-foreground">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary-foreground">Terms of Service</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Company</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li><a href="#" className="hover:text-primary-foreground">About Us</a></li>
                <li><a href="#" className="hover:text-primary-foreground">Careers</a></li>
                <li><a href="#" className="hover:text-primary-foreground">Press</a></li>
                <li><a href="#" className="hover:text-primary-foreground">Contact</a></li>
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
