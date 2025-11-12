import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, Loader2 } from "lucide-react";
import { countries, statesByCountry, getCitiesForState } from "@/data/locationData";
import { apiRequest } from "@/lib/queryClient";

interface PublisherSignupFormProps {
  showCard?: boolean;
  onSuccess?: () => void;
}

export function PublisherSignupForm({ showCard = true, onSuccess }: PublisherSignupFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    businessName: '',
    businessType: '',
    taxId: '',
    businessDescription: '',
    country: '',
    state: '',
    city: '',
    address: '',
    postalCode: '',
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
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Reset dependent fields in same update
      if (field === 'country') {
        updated.state = '';
        updated.city = '';
      } else if (field === 'state') {
        updated.city = '';
      }
      
      return updated;
    });
  };

  const validateForm = () => {
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

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters.",
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
          if (onSuccess) {
            onSuccess();
          } else {
            // Default redirect to publisher dashboard
            setTimeout(() => {
              window.location.href = '/publisher/submissions';
            }, 1000);
          }
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

  const availableStates = formData.country ? (statesByCountry as Record<string, string[]>)[formData.country] || [] : [];
  const availableCities = formData.state ? getCitiesForState(formData.country, formData.state) : [];

  const formContent = (
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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Business Information</h3>
        
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            value={formData.businessName}
            onChange={(e) => handleChange('businessName', e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessType">Business Type *</Label>
          <Select value={formData.businessType} onValueChange={(value) => handleChange('businessType', value)} disabled={isSubmitting}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {businessTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      {/* Location */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Business Location</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select value={formData.country} onValueChange={(value) => handleChange('country', value)} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map(({ name, flag }) => (
                  <SelectItem key={name} value={name}>{flag} {name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State/Province</Label>
            <Select 
              value={formData.state} 
              onValueChange={(value) => handleChange('state', value)}
              disabled={isSubmitting || !formData.country || availableStates.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={availableStates.length > 0 ? "Select state" : "Not available"} />
              </SelectTrigger>
              <SelectContent>
                {availableStates.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Select 
              value={formData.city} 
              onValueChange={(value) => handleChange('city', value)}
              disabled={isSubmitting || !formData.country}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {availableCities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => handleChange('postalCode', e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            disabled={isSubmitting}
            placeholder="Optional"
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
          />
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Creating Account...
          </>
        ) : (
          <>
            <Building2 className="mr-2 h-5 w-5" />
            Register Business
          </>
        )}
      </Button>

      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <a href="/login" className="text-blue-600 hover:underline">
          Sign in here
        </a>
      </p>
    </form>
  );

  if (showCard) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-accent" />
            </div>
          </div>
          <CardTitle className="text-2xl">Publisher Registration</CardTitle>
          <CardDescription>
            Provide your business details to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formContent}
        </CardContent>
      </Card>
    );
  }

  return formContent;
}
