import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  MapPin, 
  Users, 
  Bed, 
  Bath, 
  DollarSign,
  Wifi,
  Car,
  Coffee,
  Waves,
  Tv,
  Wind,
  Snowflake,
  Camera,
  Save,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const stayFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
  type: z.string().min(1, "Property type is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().optional(),
  pricePerNight: z.string().optional(), // Allow empty for free stays
  isFreeStay: z.boolean().default(false),
  currency: z.string().min(1, "Currency is required"),
  maxGuests: z.string().min(1, "Number of guests is required"),
  bedrooms: z.string().min(1, "Number of bedrooms is required"),
  bathrooms: z.string().min(1, "Number of bathrooms is required"),
  amenities: z.array(z.string()).default([]),
  houseRules: z.string().optional(),
  checkInTime: z.string().default("15:00"),
  checkOutTime: z.string().default("11:00"),
  minimumStay: z.string().default("1"),
  maximumStay: z.string().optional(),
  instantBooking: z.boolean().default(false),
  contactInfo: z.string().optional(),
  availableFrom: z.string().optional(),
  availableTo: z.string().optional(),
});

type StayFormData = z.infer<typeof stayFormSchema>;

interface AddStayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const propertyTypes = [
  { value: "guest-room", label: "🏠 Guest Room (in home)", category: "room" },
  { value: "private-room", label: "🚪 Private Room", category: "room" },
  { value: "shared-room", label: "👥 Shared Room", category: "room" },
  { value: "hostel-bed", label: "🛏️ Hostel Bed", category: "room" },
  { value: "studio", label: "🏢 Studio Apartment", category: "entire" },
  { value: "apartment", label: "🏠 Entire Apartment", category: "entire" },
  { value: "house", label: "🏘️ Entire House", category: "entire" },
  { value: "villa", label: "🏖️ Villa", category: "entire" },
  { value: "cottage", label: "🏡 Cottage", category: "entire" },
  { value: "loft", label: "🏭 Loft", category: "entire" },
  { value: "tiny-house", label: "🏘️ Tiny House", category: "unique" },
  { value: "boat", label: "🚤 Boat/Yacht", category: "unique" },
  { value: "cabin", label: "🏕️ Cabin", category: "unique" },
];

const amenitiesList = [
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "kitchen", label: "Kitchen", icon: Coffee },
  { id: "parking", label: "Free Parking", icon: Car },
  { id: "pool", label: "Swimming Pool", icon: Waves },
  { id: "tv", label: "TV", icon: Tv },
  { id: "heating", label: "Heating", icon: Wind },
  { id: "aircon", label: "Air Conditioning", icon: Snowflake },
  { id: "balcony", label: "Balcony", icon: Waves },
  { id: "garden", label: "Garden", icon: "🌱" },
  { id: "gym", label: "Gym", icon: "💪" },
  { id: "laundry", label: "Washing Machine", icon: "🧺" },
  { id: "breakfast", label: "Breakfast", icon: "🥐" },
];

const countries = [
  "United Kingdom", "Spain", "France", "Germany", "Italy", "Netherlands", 
  "Portugal", "Greece", "Austria", "Switzerland", "Belgium", "Ireland"
];

const currencies = [
  { value: "GBP", label: "£ GBP" },
  { value: "EUR", label: "€ EUR" },
  { value: "USD", label: "$ USD" },
];

export function AddStayDialog({ open, onOpenChange }: AddStayDialogProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<StayFormData>({
    resolver: zodResolver(stayFormSchema),
    defaultValues: {
      amenities: [],
      checkInTime: "15:00",
      checkOutTime: "11:00",
      minimumStay: "1",
      currency: "GBP",
      instantBooking: false,
    },
  });

  const onSubmit = async (data: StayFormData) => {
    setIsSubmitting(true);
    try {
      // Transform data for API - handle free stays
      const stayData = {
        ...data,
        pricePerNight: data.isFreeStay ? null : (data.pricePerNight ? parseFloat(data.pricePerNight) : null),
        maxGuests: parseInt(data.maxGuests),
        bedrooms: parseInt(data.bedrooms),
        bathrooms: parseInt(data.bathrooms),
        minimumStay: parseInt(data.minimumStay || "1"),
        maximumStay: data.maximumStay ? parseInt(data.maximumStay) : null,
      };
      
      const response = await fetch('/api/stays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stayData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create stay');
      }
      
      toast({
        title: data.isFreeStay ? "🎉 Free Stay Listed!" : "Stay Listed Successfully!",
        description: data.isFreeStay 
          ? "Your generous free offer is now available to travelers!" 
          : "Your stay has been added and is now visible to travelers.",
      });
      
      onOpenChange(false);
      form.reset();
      setCurrentStep(1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create stay. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = [
    { number: 1, title: "Basic Info", icon: Home },
    { number: 2, title: "Location", icon: MapPin },
    { number: 3, title: "Details", icon: Users },
    { number: 4, title: "Amenities & Rules", icon: Coffee },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">List Your Stay</DialogTitle>
          <DialogDescription>
            Share your space with travelers and start earning
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.number 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : 'border-muted-foreground text-muted-foreground'
              }`}>
                <step.icon className="w-5 h-5" />
              </div>
              <div className="ml-2 hidden sm:block">
                <div className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 w-12 mx-4 ${
                  currentStep > step.number ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Beautiful London Apartment" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Create a catchy title that highlights what makes your place special
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your space, the neighborhood, and what makes it special..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Tell travelers about your space and what they can expect
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {propertyTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., London" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 123 Baker Street" {...field} />
                      </FormControl>
                      <FormDescription>
                        Exact address will only be shared with confirmed guests
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Details & Pricing */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="maxGuests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Guests</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Guests" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[1,2,3,4,5,6,7,8].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} {num === 1 ? 'Guest' : 'Guests'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bedrooms</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Bedrooms" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[1,2,3,4,5].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} {num === 1 ? 'Bedroom' : 'Bedrooms'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bathrooms</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Bathrooms" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[1,2,3,4,5].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} {num === 1 ? 'Bathroom' : 'Bathrooms'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Free Stay Toggle */}
                <FormField
                  control={form.control}
                  name="isFreeStay"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              form.setValue("pricePerNight", "");
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">
                          💝 Offer Free Stay - Host a Traveler for Free!
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Open your home to fellow travelers without charge. Build connections and share experiences!
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pricePerNight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {form.watch("isFreeStay") ? "Price (Free Stay Selected)" : "Price per Night"}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={form.watch("isFreeStay") ? "Free!" : "0.00"}
                            type="number"
                            step="0.01"
                            disabled={form.watch("isFreeStay")}
                            className={form.watch("isFreeStay") ? "bg-green-50 dark:bg-green-900/20" : ""}
                            {...field} 
                          />
                        </FormControl>
                        {form.watch("isFreeStay") && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            🎉 You're offering a free stay! How generous!
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem key={currency.value} value={currency.value}>
                                {currency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Amenities & Rules */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="amenities"
                  render={() => (
                    <FormItem>
                      <FormLabel>Amenities</FormLabel>
                      <FormDescription>
                        Select all amenities available at your property
                      </FormDescription>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {amenitiesList.map((amenity) => (
                          <FormField
                            key={amenity.id}
                            control={form.control}
                            name="amenities"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={amenity.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(amenity.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, amenity.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== amenity.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal flex items-center space-x-2">
                                    <amenity.icon className="w-4 h-4" />
                                    <span>{amenity.label}</span>
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="houseRules"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>House Rules (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g., No smoking, no pets, quiet hours after 10pm..."
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Set clear expectations for your guests
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="checkInTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check-in Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="checkOutTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check-out Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contactInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Information (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Phone number, WhatsApp, etc."
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        How guests can reach you for questions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <div>
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                )}
              </div>
              
              <div className="space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                
                {currentStep < 4 ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        List My Stay
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}