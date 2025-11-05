import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, Loader2, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { countries, statesByCountry, getCitiesForState } from "@/data/locationData";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export default function DocumentSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect already-authenticated users
  useEffect(() => {
    if (authLoading) return;
    
    if (user) {
      // Publishers already registered - redirect to their dashboard
      if (user.role === 'publisher') {
        toast({
          title: "Already Registered",
          description: "You're already registered as a publisher. Redirecting...",
        });
        setTimeout(() => setLocation('/stays'), 1000);
        return;
      }
      
      // Creators shouldn't use publisher signup
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
  const [formData, setFormData] = useState({
    // Personal Account Info
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    
    // Business Information
    businessName: '',
    businessType: '',
    taxId: '',
    businessDescription: '',
    
    // Address
    country: '',
    state: '',
    city: '',
    address: '',
    postalCode: '',
    
    // Contact
    phoneNumber: '',
  });

  const businessTypes = [
    'Hotel',
    'Tour Operator',
    'Travel Agency',
    'Restaurant',
    'Transportation Service',
    'Adventure Activities',
    'Event Organizer',
    'Other'
  ];

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Reset dependent fields when parent changes
    if (field === 'country') {
      setFormData(prev => ({ ...prev, state: '', city: '' }));
    } else if (field === 'state') {
      setFormData(prev => ({ ...prev, city: '' }));
    }
  };

  const validateForm = () => {
    // Required fields validation
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in email and password fields.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.firstName || !formData.lastName) {
      toast({
        title: "Missing Information",
        description: "Please provide your first and last name.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.businessName || !formData.businessType) {
      toast({
        title: "Missing Information",
        description: "Please provide business name and type.",
        variant: "destructive",
      });
      return false;
    }

    // Password validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Create publisher account
      const response = await apiRequest("POST", "/api/auth/publisher-signup", {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        businessName: formData.businessName,
        businessType: formData.businessType,
        taxId: formData.taxId,
        businessDescription: formData.businessDescription,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        address: formData.address,
        postalCode: formData.postalCode,
        phoneNumber: formData.phoneNumber,
      });

      if (response.ok) {
        toast({
          title: "Account Created!",
          description: "Your publisher account has been created successfully.",
        });

        // Auto login
        const loginResponse = await apiRequest("POST", "/api/auth/login", {
          email: formData.email,
          password: formData.password
        });

        if (loginResponse.ok) {
          // Redirect to publisher dashboard
          setTimeout(() => {
            window.location.href = '/publisher/submissions';
          }, 1000);
        }
      } else {
        const error = await response.json();
        toast({
          title: "Registration Failed",
          description: error.message || "Could not create publisher account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableStates = formData.country ? statesByCountry[formData.country] || [] : [];
  const availableCities = formData.state ? getCitiesForState(formData.country, formData.state) : [];

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-accent" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Publisher Registration
          </h1>
          <p className="text-muted-foreground">
            Register your business to create campaigns and reach travel creators
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Provide your business details to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Account Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Account Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      required
                      disabled={isSubmitting}
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-foreground">Business Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => handleChange('businessName', e.target.value)}
                      required
                      disabled={isSubmitting}
                      placeholder="Your company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type *</Label>
                    <Select
                      value={formData.businessType}
                      onValueChange={(value) => handleChange('businessType', value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.map((type, idx) => (
                          <SelectItem key={`business-type-${idx}`} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / Business Registration Number</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => handleChange('taxId', e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessDescription">Business Description</Label>
                  <Textarea
                    id="businessDescription"
                    value={formData.businessDescription}
                    onChange={(e) => handleChange('businessDescription', e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Tell us about your business..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-foreground">Business Address</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select
                      value={formData.country || undefined}
                      onValueChange={(value) => {
                        console.log('Country selected:', value);
                        handleChange('country', value);
                      }}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="country">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80 overflow-y-auto" position="popper" sideOffset={4}>
                        {countries.map((country, idx) => (
                          <SelectItem key={`${country.name}-${idx}`} value={country.name}>
                            {country.flag} {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Select
                      value={formData.state || undefined}
                      onValueChange={(value) => {
                        console.log('State selected:', value);
                        handleChange('state', value);
                      }}
                      disabled={isSubmitting || !formData.country}
                    >
                      <SelectTrigger id="state">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80 overflow-y-auto" position="popper" sideOffset={4}>
                        {availableStates.length > 0 ? (
                          availableStates.map((state, idx) => (
                            <SelectItem key={`${state}-${idx}`} value={state}>
                              {state}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-states" disabled>
                            Select country first
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Select
                      value={formData.city || undefined}
                      onValueChange={(value) => {
                        console.log('City selected:', value);
                        handleChange('city', value);
                      }}
                      disabled={isSubmitting || !formData.state}
                    >
                      <SelectTrigger id="city">
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80 overflow-y-auto" position="popper" sideOffset={4}>
                        {availableCities.length > 0 ? (
                          availableCities.map((city, idx) => (
                            <SelectItem key={`${city}-${idx}`} value={city}>
                              {city}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-cities" disabled>
                            {!formData.country ? 'Select country first' : 'Select state first'}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleChange('postalCode', e.target.value)}
                      disabled={isSubmitting}
                      placeholder="Postal/ZIP code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleChange('phoneNumber', e.target.value)}
                      disabled={isSubmitting}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Create Publisher Account
                    </>
                  )}
                </Button>
              </div>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <a href="/api/login" className="text-accent hover:underline">
                  Sign in
                </a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
