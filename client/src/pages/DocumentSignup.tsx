import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, CheckCircle, AlertCircle, Clock, User, MapPin, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { countries, statesByCountry, getCitiesForState } from "@/data/locationData";

interface ExtractedInfo {
  documentNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  nationality?: string;
  expiryDate?: string;
}

export default function DocumentSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState<'passport' | 'driving_license' | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo>({});
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    bio: '',
    country: '',
    city: '',
  });

  const fillDemoData = () => {
    const demoData = {
      username: 'priya_mumbai',
      email: 'priya.sharma@example.com',
      firstName: 'Priya',
      lastName: 'Sharma',
      bio: 'Mumbai-based travel enthusiast and content creator exploring India\'s hidden gems.',
      country: 'India',
      city: 'Ahmedabad',
    };
    
    setFormData(demoData);
    
    toast({
      title: "Demo Data Filled!",
      description: "Form has been filled with sample data for testing.",
      duration: 3000,
    });
  };

  const handleDocumentUpload = async (url: string) => {
    setDocumentUrl(url);
    setIsVerifying(true);
    
    try {
      // Simulate AI document verification
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock extracted information based on document type
      const mockExtractedInfo: ExtractedInfo = {
        documentNumber: documentType === 'passport' ? 'P1234567' : 'DL987654321',
        fullName: 'John Smith',
        dateOfBirth: '1990-05-15',
        nationality: documentType === 'passport' ? 'British' : 'UK',
        expiryDate: '2030-12-31'
      };
      
      setExtractedInfo(mockExtractedInfo);
      setFormData(prev => ({
        ...prev,
        firstName: mockExtractedInfo.fullName?.split(' ')[0] || '',
        lastName: mockExtractedInfo.fullName?.split(' ').slice(1).join(' ') || ''
      }));
      
      setVerificationStatus('verified');
      setStep(3);
      
      toast({
        title: "Document Verified!",
        description: "Your document has been successfully verified. Please complete your profile.",
      });
    } catch (error) {
      setVerificationStatus('failed');
      toast({
        title: "Verification Failed",
        description: "Unable to verify your document. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/complete-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          documentType,
          documentUrl,
          ...extractedInfo,
          verificationStatus,
        }),
      });

      if (response.ok) {
        // Set user as authenticated after successful verification
        localStorage.setItem('hublink_demo_user', 'true');
        localStorage.setItem('hublink_verification_complete', 'true');
        
        toast({
          title: "Signup Complete!",
          description: "Your account has been created and verified successfully. Welcome to HubLink!",
        });
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        throw new Error('Signup failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete signup. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              stepNumber <= step 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {stepNumber}
            </div>
            {stepNumber < 3 && (
              <div className={`w-20 h-1 mx-2 ${
                stepNumber < step ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Complete Your Account Setup
          </h1>
          <p className="text-muted-foreground">
            Verify your identity with your passport or driving license for enhanced security
          </p>
        </div>

        {renderStepIndicator()}

        {/* Step 1: Document Type Selection */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Choose Document Type</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setDocumentType('passport');
                    setStep(2);
                  }}
                  className={`p-6 border-2 rounded-lg text-left transition-colors ${
                    documentType === 'passport'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
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
                  onClick={() => {
                    setDocumentType('driving_license');
                    setStep(2);
                  }}
                  className={`p-6 border-2 rounded-lg text-left transition-colors ${
                    documentType === 'driving_license'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Driving License</h3>
                      <p className="text-sm text-muted-foreground">Government issued ID</p>
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Document Upload */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Upload Your {documentType === 'passport' ? 'Passport' : 'Driving License'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
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

        {/* Step 3: Complete Profile */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Complete Your Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Extracted Information Display */}
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

              {/* Profile Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Enter your username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value, city: '' }))}>
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
                    <Label htmlFor="city">City</Label>
                    <Select 
                      value={formData.city} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                      disabled={!formData.country}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80 overflow-y-auto">
                        {formData.country && statesByCountry[formData.country as keyof typeof statesByCountry] ? (
                          statesByCountry[formData.country as keyof typeof statesByCountry].reduce((allCities: string[], state: string) => {
                            const cities = getCitiesForState(formData.country, state);
                            return [...allCities, ...cities];
                          }, []).map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-cities" disabled>
                            Select country first
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={fillDemoData}>
                    🎯 Fill Demo Data
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!formData.username || !formData.email}
                  >
                    Complete Signup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}