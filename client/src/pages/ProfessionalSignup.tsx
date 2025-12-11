import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  User, MapPin, Calendar, Briefcase, Phone, Mail, Home, Users, Star, Building, Loader2,
  FileText, CreditCard, Shield, Globe, DollarSign, BadgeCheck, CheckCircle, ArrowLeft
} from "lucide-react";
import { useLocation } from "wouter";
import { countryCodes, countries, statesByCountry, getCitiesForState, citiesByCountry } from "@/data/locationData";
import { useAuth } from "@/hooks/useAuth";

export default function ProfessionalSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [step] = useState(3); // Start directly at form - creator only
  const [selectedRole] = useState<'creator'>('creator'); // Always creator for this page
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successStage, setSuccessStage] = useState<'none' | 'creating' | 'success' | 'redirecting'>('none');

  // Redirect already-authenticated users
  useEffect(() => {
    if (authLoading) return;
    
    if (user) {
      // Publishers shouldn't be on creator signup - send to their dashboard
      if (user.role === 'publisher') {
        toast({
          title: "Already Registered",
          description: "You're already registered as a publisher. Redirecting to your dashboard...",
        });
        setTimeout(() => setLocation('/stays'), 1000);
        return;
      }
      
      // Creators with complete profiles - send to dashboard
      if (user.role === 'creator' && user.username && user.firstName && user.lastName) {
        toast({
          title: "Already Registered",
          description: "Your profile is already complete. Redirecting to dashboard...",
        });
        setTimeout(() => setLocation('/'), 1000);
        return;
      }
    }
  }, [user, authLoading, setLocation, toast]);
  
  const [formData, setFormData] = useState({
    // Personal Information (Creator)
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    
    // Address Information (Creator)
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    
    // Professional Information (Creator)
    username: '',
    bio: '',
    profession: '',
    experience: '',
    languages: '',
    
    // Account Information
    password: '',
    confirmPassword: '',
    countryCode: '+44',
    
    // Publisher Business Information
    businessName: '',
    businessRegistrationNumber: '',
    businessType: '',
    businessCategory: '',
    yearEstablished: '',
    taxId: '',
    vatNumber: '',
    
    // Publisher Contact Details
    businessEmail: '',
    businessPhone: '',
    businessWebsite: '',
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessPostalCode: '',
    businessCountry: '',
    
    // Owner/Representative Information
    ownerName: '',
    ownerPosition: '',
    ownerEmail: '',
    ownerPhone: '',
    
    // Service Details
    servicesOffered: '',
    serviceAreas: '',
    propertyCount: '',
    roomCapacity: '',
    
    // Banking Information
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ibanSwift: '',
    bankBranch: '',
    
    // Legal & Compliance
    businessLicense: '',
    tourismLicense: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
  });



  const handleSubmit = async () => {
    // Required fields validation
    if (!formData.email || !formData.email.trim()) {
      toast({ title: "Error", description: "Email address is required", variant: "destructive" });
      return;
    }
    
    if (!formData.firstName || !formData.firstName.trim()) {
      toast({ title: "Error", description: "First name is required", variant: "destructive" });
      return;
    }
    
    if (!formData.lastName || !formData.lastName.trim()) {
      toast({ title: "Error", description: "Last name is required", variant: "destructive" });
      return;
    }
    
    if (!formData.phone || !formData.phone.trim()) {
      toast({ title: "Error", description: "Phone number is required", variant: "destructive" });
      return;
    }
    
    if (!formData.dateOfBirth) {
      toast({ title: "Error", description: "Date of birth is required", variant: "destructive" });
      return;
    }
    
    if (!formData.address || !formData.address.trim()) {
      toast({ title: "Error", description: "Street address is required", variant: "destructive" });
      return;
    }
    
    if (!formData.country) {
      toast({ title: "Error", description: "Country is required", variant: "destructive" });
      return;
    }
    
    if (!formData.city) {
      toast({ title: "Error", description: "City is required", variant: "destructive" });
      return;
    }
    
    if (!formData.username || !formData.username.trim()) {
      toast({ title: "Error", description: "Username is required", variant: "destructive" });
      return;
    }
    
    if (!formData.password || !formData.password.trim()) {
      toast({ title: "Error", description: "Password is required", variant: "destructive" });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    // Name validation (letters, spaces, hyphens only)
    const nameRegex = /^[a-zA-Z\s-]+$/;
    if (!nameRegex.test(formData.firstName)) {
      toast({ title: "Invalid First Name", description: "First name can only contain letters, spaces, and hyphens", variant: "destructive" });
      return;
    }
    
    if (!nameRegex.test(formData.lastName)) {
      toast({ title: "Invalid Last Name", description: "Last name can only contain letters, spaces, and hyphens", variant: "destructive" });
      return;
    }

    // Phone number validation (digits only, 7-15 characters)
    const phoneRegex = /^\d{7,15}$/;
    const cleanPhone = formData.phone.replace(/[\s-]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      toast({ title: "Invalid Phone Number", description: "Phone number must be 7-15 digits only", variant: "destructive" });
      return;
    }

    // Age validation (must be 18+)
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const isBeforeBirthday = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate());
    const actualAge = isBeforeBirthday ? age - 1 : age;
    
    if (actualAge < 18) {
      toast({ title: "Age Restriction", description: "You must be at least 18 years old to sign up", variant: "destructive" });
      return;
    }

    // Username validation (alphanumeric, underscore, hyphen only, 3-30 characters)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(formData.username)) {
      toast({ title: "Invalid Username", description: "Username must be 3-30 characters (letters, numbers, underscore, hyphen only)", variant: "destructive" });
      return;
    }

    // Password validation
    if (formData.password.length < 6) {
      toast({ title: "Weak Password", description: "Password must be at least 6 characters long", variant: "destructive" });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Password Mismatch", description: "Passwords don't match", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    setSuccessStage('creating');

    try {
      // Simulate account creation process with realistic timing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const signupData = {
        ...formData,
        role: selectedRole,
        verificationStatus: 'pending', // Will be verified by admin
      };

      // Store signup data for completion after OTP verification
      localStorage.setItem('hublink_signup_data', JSON.stringify(signupData));
      localStorage.setItem('thepicstory_signup_type', 'professional');
      
      // Store OTP verification data
      localStorage.setItem('signup_email', formData.email);
      localStorage.setItem('signup_phone', `${formData.countryCode}${formData.phone}`);
      localStorage.setItem('verification_type', 'email');
      localStorage.setItem('signup_role', selectedRole || 'creator');
      
      // Immediately redirect to OTP verification - don't show success yet
      // User will see success message after OTP verification is complete
      window.location.href = `/verify-otp?email=${encodeURIComponent(formData.email)}&type=email`;
      
    } catch (error) {
      setIsSubmitting(false);
      setSuccessStage('none');
      toast({
        title: "Error",
        description: "Failed to complete signup. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderStepIndicator = () => {
    const totalSteps = 2; // Both creator and publisher have 2 steps now
    const currentStep = step === 3 ? 2 : step;
    
    return (
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                stepNumber <= currentStep 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {stepNumber}
              </div>
              {stepNumber < totalSteps && (
                <div className={`w-20 h-1 mx-2 ${
                  stepNumber < currentStep ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 pt-20 sm:pt-24">
      <div className="max-w-4xl mx-auto px-2 sm:px-4">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Join ThePicStory as a Creator
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            Create content, earn from campaigns, and connect with travelers worldwide
          </p>
        </div>

        {renderStepIndicator()}

        {/* Creator Registration Form */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Complete Your Professional Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Smith"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="flex gap-2">
                      <Select value={formData.countryCode || "+44"} onValueChange={(value) => setFormData(prev => ({ ...prev, countryCode: value }))}>
                        <SelectTrigger className="w-20 sm:w-24">
                          <SelectValue placeholder="+44" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80 overflow-y-auto">
                          {countryCodes.map((item, index) => (
                            <SelectItem key={`${item.code}-${item.country}-${index}`} value={item.code}>
                              {item.flag} {item.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="123 456 7890"
                        className="flex-1"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                      placeholder="British"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Home className="w-5 h-5 mr-2" />
                  Address Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="123 Main Street"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Select 
                        value={formData.country || undefined} 
                        onValueChange={(value) => {
                          console.log('Country selected:', value);
                          setFormData(prev => ({ ...prev, country: value, state: '', city: '' }));
                        }}
                      >
                        <SelectTrigger id="country">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80 overflow-y-auto" position="popper" sideOffset={4}>
                          {countries.map((country) => (
                            <SelectItem key={country.name} value={country.name}>
                              {country.flag} {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Select 
                        value={formData.state} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, state: value, city: '' }))}
                        disabled={!formData.country}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state/province" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80 overflow-y-auto">
                          {formData.country && statesByCountry[formData.country as keyof typeof statesByCountry] ? (
                            statesByCountry[formData.country as keyof typeof statesByCountry].map((state: string) => (
                              <SelectItem key={state} value={state}>
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
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Select 
                        value={formData.city} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                        disabled={!formData.country || !formData.state}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80 overflow-y-auto">
                          {formData.country && formData.state ? (
                            getCitiesForState(formData.country, formData.state).map((city) => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-cities" disabled>
                              {!formData.country ? "Select country first" : "Select state first"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                        placeholder="SW1A 1AA, 400001, etc."
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Security */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Account Security
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                      placeholder="your_username (3-30 characters, letters, numbers, _ and - only)"
                      required
                      maxLength={30}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be your public profile URL: thepicstory.com/@{formData.username || 'your_username'}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t">
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.firstName || !formData.lastName || !formData.email || !formData.phone || 
                           !formData.address || !formData.city || !formData.postalCode || !formData.country || 
                           !formData.password || !formData.confirmPassword}
                  className="px-8 min-w-[200px]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {successStage === 'creating' && 'Creating Account...'}
                      {successStage === 'success' && 'Account Created!'}
                      {successStage === 'redirecting' && 'Redirecting...'}
                    </div>
                  ) : (
                    'Create Creator Account'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Success Overlay */}
      {successStage !== 'none' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
          <Card className="w-[400px] mx-4">
            <CardContent className="p-8 text-center">
              {successStage === 'creating' && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Creating Your Account</h3>
                  <p className="text-muted-foreground">Please wait while we set up your ThePicStory profile...</p>
                </div>
              )}
              
              {successStage === 'success' && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-green-600">Account Created Successfully!</h3>
                  <p className="text-muted-foreground">Welcome to ThePicStory! Your creator account is ready.</p>
                </div>
              )}
              
              {successStage === 'redirecting' && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-blue-600">Redirecting...</h3>
                  <p className="text-muted-foreground">
                    Taking you to your dashboard...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}