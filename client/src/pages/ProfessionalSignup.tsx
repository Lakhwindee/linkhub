import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, Upload, CheckCircle, AlertCircle, Clock, User, MapPin, Calendar, 
  Briefcase, IdCard, Phone, Mail, Home, Users, Star, Building, Loader2
} from "lucide-react";
import { useLocation } from "wouter";
import { countryCodes, countries, statesByCountry, getCitiesForState, citiesByCountry } from "@/data/locationData";

interface ExtractedInfo {
  documentNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  nationality?: string;
  expiryDate?: string;
}

export default function ProfessionalSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<'creator' | 'publisher' | null>(null);
  const [documentType, setDocumentType] = useState<'passport' | 'driving_license' | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successStage, setSuccessStage] = useState<'none' | 'creating' | 'success' | 'redirecting'>('none');
  
  const [formData, setFormData] = useState({
    // Personal Information
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    
    // Address Information  
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    
    // Professional Information
    username: '',
    bio: '',
    profession: '',
    experience: '',
    languages: '',
    
    // Account Information
    password: '',
    confirmPassword: '',
    countryCode: '+44',
    
    // Publisher specific
    businessName: '',
    businessType: '',
    businessAddress: '',
    businessPhone: '',
    taxId: '',
  });


  const handleRoleSelection = (role: 'creator' | 'publisher') => {
    setSelectedRole(role);
    if (role === 'creator') {
      // Creator goes directly to form
      setStep(3);
    } else {
      // Publisher needs document verification
      setStep(2);
    }
  };

  const handleDocumentUpload = async (url: string) => {
    setDocumentUrl(url);
    setIsVerifying(true);
    
    try {
      // Call real OCR API for document verification
      const response = await fetch('/api/verify-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentUrl: url,
          documentType: documentType
        }),
      }).catch((error) => {
        console.error('Network error during document verification:', error);
        throw new Error(`Network error: ${error.message}`);
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Verification failed');
      }

      if (result.success && result.extractedInfo) {
        const extractedInfo = result.extractedInfo;
        
        setExtractedInfo(extractedInfo);
        setFormData(prev => ({
          ...prev,
          firstName: extractedInfo.fullName?.split(' ')[0] || '',
          lastName: extractedInfo.fullName?.split(' ').slice(1).join(' ') || '',
          dateOfBirth: extractedInfo.dateOfBirth || '',
          nationality: extractedInfo.nationality || ''
        }));
        
        setVerificationStatus('verified');
        setStep(3);
        
        toast({
          title: "Document Verified!",
          description: `Real document verification successful! Extracted: ${extractedInfo.fullName || 'Name'}, ${extractedInfo.documentNumber || 'Document Number'}`,
        });
      } else {
        throw new Error('Could not extract valid information from document');
      }
    } catch (error: any) {
      console.error('Document verification error:', error);
      setVerificationStatus('failed');
      toast({
        title: "Verification Failed",
        description: error.message || "Unable to verify your document. Please ensure the image is clear and try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match!",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.password.length < 6) {
      toast({
        title: "Error", 
        description: "Password must be at least 6 characters!",
        variant: "destructive",
      });
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
        documentType: selectedRole === 'publisher' ? documentType : null,
        documentUrl: selectedRole === 'publisher' ? documentUrl : null,
        ...extractedInfo,
        verificationStatus: selectedRole === 'publisher' ? verificationStatus : 'verified',
      };

      // Store signup data for completion after OTP verification
      localStorage.setItem('hublink_signup_data', JSON.stringify(signupData));
      localStorage.setItem('hublink_signup_type', 'professional');
      
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
    const totalSteps = selectedRole === 'creator' ? 2 : 3;
    const currentStep = selectedRole === 'creator' && step === 3 ? 2 : step;
    
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
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-4xl mx-auto px-2 sm:px-4">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Join HubLink Professional
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            Create your professional account and start connecting with travelers worldwide
          </p>
        </div>

        {renderStepIndicator()}

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Choose Your Role</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <button
                  onClick={() => handleRoleSelection('creator')}
                  className={`p-4 sm:p-6 border-2 rounded-lg text-left transition-colors ${
                    selectedRole === 'creator'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Star className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Creator</h3>
                      <Badge variant="secondary" className="mt-1">Content Creator</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Perfect for content creators, influencers, and travel enthusiasts who want to earn through brand campaigns and connect with travelers.
                  </p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Access to Ad Marketplace</li>
                    <li>• Reserve brand campaigns</li>
                    <li>• Earnings dashboard</li>
                    <li>• Creator verification badge</li>
                  </ul>
                </button>

                <button
                  onClick={() => handleRoleSelection('publisher')}
                  className={`p-4 sm:p-6 border-2 rounded-lg text-left transition-colors ${
                    selectedRole === 'publisher'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Building className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Publisher</h3>
                      <Badge variant="secondary" className="mt-1">Business</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    For businesses, hotels, tour operators, and service providers who want to list accommodations and tour packages.
                  </p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• List accommodations & stays</li>
                    <li>• Create tour packages</li>
                    <li>• Business analytics</li>
                    <li>• Document verification required</li>
                  </ul>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Document Upload (Publisher Only) */}
        {step === 2 && selectedRole === 'publisher' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Business Verification</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Publisher accounts require document verification</strong> to ensure trust and security for travelers. Please upload your passport or driving license.
                </p>
              </div>

              {!documentType && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setDocumentType('passport')}
                    className="p-6 border-2 rounded-lg text-left transition-colors border-border hover:border-primary/50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Passport</h3>
                        <p className="text-sm text-muted-foreground">International travel document</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setDocumentType('driving_license')}
                    className="p-6 border-2 rounded-lg text-left transition-colors border-border hover:border-primary/50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <IdCard className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Driving License</h3>
                        <p className="text-sm text-muted-foreground">Government issued ID</p>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {documentType && (
                <div className="space-y-4">
                  <Badge variant="outline" className="mb-4">
                    {documentType === 'passport' ? 'Passport' : 'Driving License'} Selected
                  </Badge>
                  
                  {!documentUrl ? (
                    <ObjectUploader
                      onGetUploadParameters={() => Promise.resolve({ method: "PUT" as const, url: "/api/upload-demo" })}
                      onComplete={(result) => {
                        if (result.successful && result.successful.length > 0) {
                          handleDocumentUpload(result.successful[0].uploadURL);
                        }
                      }}
                      maxFileSize={10 * 1024 * 1024} // 10MB
                      buttonClassName="border-2 border-dashed border-primary/20 p-8 rounded-lg w-full"
                    >
                      <div className="text-center">
                        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          Upload {documentType === 'passport' ? 'Passport' : 'Driving License'}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Drag and drop or click to select your document
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Supported formats: JPEG, PNG, PDF (Max 10MB)
                        </p>
                      </div>
                    </ObjectUploader>
                  ) : (
                    <div className="space-y-4">
                      {isVerifying ? (
                        <div className="text-center p-8">
                          <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
                          <h3 className="text-lg font-semibold mb-2">Verifying Document...</h3>
                          <p className="text-muted-foreground mb-4">
                            Our AI is analyzing your document. This may take a few moments.
                          </p>
                          <Progress value={66} className="w-full max-w-xs mx-auto" />
                        </div>
                      ) : (
                        <div className="text-center p-8">
                          {verificationStatus === 'verified' ? (
                            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                          ) : (
                            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                          )}
                          <h3 className="text-lg font-semibold mb-2">
                            {verificationStatus === 'verified' ? 'Document Verified!' : 'Verification Failed'}
                          </h3>
                          {verificationStatus === 'failed' && (
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setDocumentUrl('');
                                setVerificationStatus('pending');
                              }}
                            >
                              Try Again
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                {verificationStatus === 'verified' && (
                  <Button onClick={() => setStep(3)}>
                    Continue
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Complete Professional Form */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Complete Your Professional Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Verified Information Display (Publisher Only) */}
              {selectedRole === 'publisher' && extractedInfo.fullName && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Verified Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Full Name</Label>
                      <p className="font-medium">{extractedInfo.fullName}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Document Number</Label>
                      <p className="font-medium">{extractedInfo.documentNumber}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Date of Birth</Label>
                      <p className="font-medium">{extractedInfo.dateOfBirth}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Nationality</Label>
                      <p className="font-medium">{extractedInfo.nationality}</p>
                    </div>
                  </div>
                </div>
              )}

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
                      <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value, state: '', city: '' }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80 overflow-y-auto">
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

              {/* Publisher Business Information */}
              {selectedRole === 'publisher' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Building className="w-5 h-5 mr-2" />
                    Business Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                        placeholder="ABC Travel Services Ltd."
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessType">Business Type</Label>
                      <Select value={formData.businessType} onValueChange={(value) => setFormData(prev => ({ ...prev, businessType: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hotel">Hotel/Lodge</SelectItem>
                          <SelectItem value="tour-operator">Tour Operator</SelectItem>
                          <SelectItem value="travel-agency">Travel Agency</SelectItem>
                          <SelectItem value="restaurant">Restaurant</SelectItem>
                          <SelectItem value="transport">Transport Service</SelectItem>
                          <SelectItem value="activity">Activity Provider</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="businessPhone">Business Phone</Label>
                      <Input
                        id="businessPhone"
                        value={formData.businessPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, businessPhone: e.target.value }))}
                        placeholder="+44 20 1234 5678"
                      />
                    </div>
                    <div>
                      <Label htmlFor="taxId">Tax ID/Registration Number</Label>
                      <Input
                        id="taxId"
                        value={formData.taxId}
                        onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                        placeholder="12345678"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="businessAddress">Business Address</Label>
                    <Textarea
                      id="businessAddress"
                      value={formData.businessAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessAddress: e.target.value }))}
                      placeholder="Complete business address with postal code"
                      rows={2}
                    />
                  </div>
                </div>
              )}

              {/* Account Security */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Account Security
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => selectedRole === 'creator' ? setStep(1) : setStep(2)}
                  className="w-full sm:w-auto"
                >
                  Back
                </Button>
                
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    onClick={handleSubmit}
                    disabled={isSubmitting || !formData.firstName || !formData.lastName || !formData.email || !formData.phone || 
                             !formData.address || !formData.city || !formData.postalCode || !formData.country || 
                             !formData.password || !formData.confirmPassword ||
                             (selectedRole === 'publisher' && !formData.businessName)}
                    className="px-4 sm:px-8 min-w-0 sm:min-w-[200px] w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {successStage === 'creating' && 'Creating Account...'}
                        {successStage === 'success' && 'Account Created!'}
                        {successStage === 'redirecting' && 'Redirecting...'}
                      </div>
                    ) : (
                      `Create ${selectedRole === 'publisher' ? 'Publisher' : 'Creator'} Account`
                    )}
                  </Button>
                </div>
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
                  <p className="text-muted-foreground">Please wait while we set up your HubLink profile...</p>
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
                  <p className="text-muted-foreground">Welcome to HubLink! Your {selectedRole} account is ready.</p>
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
                    Taking you to your {selectedRole === 'publisher' ? 'stays management' : 'dashboard'}...
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