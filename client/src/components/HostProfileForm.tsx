import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Plus, X, Upload, MapPin, Home, Map, Coffee, Car } from "lucide-react";
import { worldCountries } from "@/data/locationData";

const hostProfileSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  hostType: z.enum(["accommodation", "guide", "experience", "transport"], {
    required_error: "Please select a host type"
  }),
  priceType: z.enum(["free", "paid"], {
    required_error: "Please select pricing type"
  }),
  pricePerDay: z.string().optional(),
  currency: z.string().default("USD"),
  maxGuests: z.number().min(1, "At least 1 guest required").max(50, "Too many guests"),
  amenities: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  imageUrls: z.array(z.string()).optional(),
});

type HostProfileFormData = z.infer<typeof hostProfileSchema>;

interface HostProfileFormProps {
  onSubmit: (data: HostProfileFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<HostProfileFormData>;
  isEditing?: boolean;
}

const HOST_TYPES = [
  { value: "accommodation", label: "🏠 Accommodation", icon: Home, desc: "Offer places to stay" },
  { value: "guide", label: "🗺️ Local Guide", icon: Map, desc: "Show travelers around" },
  { value: "experience", label: "☕ Experience", icon: Coffee, desc: "Unique activities & tours" },
  { value: "transport", label: "🚗 Transport", icon: Car, desc: "Transportation services" },
];

const COMMON_AMENITIES = [
  "wifi", "parking", "kitchen", "laundry", "air_conditioning", "heating", 
  "pool", "gym", "pets_allowed", "smoking_allowed", "breakfast", "lunch", 
  "dinner", "pickup_service", "24_7_support", "english_speaking"
];

const COMMON_LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Russian",
  "Chinese", "Japanese", "Korean", "Arabic", "Hindi", "Bengali", "Tamil",
  "Telugu", "Marathi", "Gujarati", "Kannada", "Malayalam", "Urdu"
];

export default function HostProfileForm({ onSubmit, onCancel, initialData, isEditing }: HostProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialData?.amenities || []);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(initialData?.languages || []);
  const [newAmenity, setNewAmenity] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>(initialData?.imageUrls || []);
  const [newImageUrl, setNewImageUrl] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<HostProfileFormData>({
    resolver: zodResolver(hostProfileSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      location: initialData?.location || "",
      country: initialData?.country || "",
      city: initialData?.city || "",
      hostType: initialData?.hostType || "accommodation",
      priceType: initialData?.priceType || "paid",
      pricePerDay: initialData?.pricePerDay || "0",
      currency: initialData?.currency || "USD",
      maxGuests: initialData?.maxGuests || 1,
      amenities: initialData?.amenities || [],
      languages: initialData?.languages || [],
      imageUrls: initialData?.imageUrls || [],
    }
  });

  const watchPriceType = watch("priceType");
  const watchCountry = watch("country");
  
  const selectedCountryData = worldCountries.find((c: any) => c.name === watchCountry);
  const cities = selectedCountryData?.cities || [];

  const handleFormSubmit = async (data: HostProfileFormData) => {
    setIsSubmitting(true);
    try {
      const formData = {
        ...data,
        amenities: selectedAmenities,
        languages: selectedLanguages,
        imageUrls: imageUrls,
        pricePerDay: watchPriceType === "paid" ? data.pricePerDay || "0" : "0",
        maxGuests: Number(data.maxGuests),
      };
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAmenity = () => {
    if (newAmenity && !selectedAmenities.includes(newAmenity)) {
      setSelectedAmenities([...selectedAmenities, newAmenity]);
      setNewAmenity("");
    }
  };

  const removeAmenity = (amenity: string) => {
    setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
  };

  const addLanguage = () => {
    if (newLanguage && !selectedLanguages.includes(newLanguage)) {
      setSelectedLanguages([...selectedLanguages, newLanguage]);
      setNewLanguage("");
    }
  };

  const removeLanguage = (language: string) => {
    setSelectedLanguages(selectedLanguages.filter(l => l !== language));
  };

  const addImageUrl = () => {
    if (newImageUrl && !imageUrls.includes(newImageUrl)) {
      setImageUrls([...imageUrls, newImageUrl]);
      setNewImageUrl("");
    }
  };

  const removeImageUrl = (url: string) => {
    setImageUrls(imageUrls.filter(u => u !== url));
  };

  const toggleCommonAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      removeAmenity(amenity);
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const toggleCommonLanguage = (language: string) => {
    if (selectedLanguages.includes(language)) {
      removeLanguage(language);
    } else {
      setSelectedLanguages([...selectedLanguages, language]);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="e.g., Cozy Home Stay in Mumbai"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe what you offer to travelers..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country *</Label>
              <Select onValueChange={(value) => setValue("country", value)} defaultValue={initialData?.country}>
                <SelectTrigger className={errors.country ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {worldCountries.map((country) => (
                    <SelectItem key={country.name} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="city">City *</Label>
              <Select onValueChange={(value) => setValue("city", value)} defaultValue={initialData?.city}>
                <SelectTrigger className={errors.city ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city: any) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.city && (
                <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="location">Specific Location</Label>
            <Input
              id="location"
              {...register("location")}
              placeholder="e.g., Near Airport, Downtown, Beach Area"
              className={errors.location ? "border-red-500" : ""}
            />
            {errors.location && (
              <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Host Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What Type of Host Are You?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HOST_TYPES.map((type) => {
              const IconComponent = type.icon;
              return (
                <label
                  key={type.value}
                  className={`cursor-pointer border-2 rounded-lg p-4 transition-colors ${
                    watch("hostType") === type.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setValue("hostType", type.value as any)}
                >
                  <div className="flex items-start space-x-3">
                    <IconComponent className="w-6 h-6 mt-1 text-primary" />
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-muted-foreground">{type.desc}</div>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          {errors.hostType && (
            <p className="text-red-500 text-sm mt-2">{errors.hostType.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Pricing Type *</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  {...register("priceType")}
                  value="free"
                  className="text-primary"
                />
                <span>Free</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  {...register("priceType")}
                  value="paid"
                  className="text-primary"
                />
                <span>Paid</span>
              </label>
            </div>
          </div>

          {watchPriceType === "paid" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pricePerDay">Price per Day</Label>
                <Input
                  id="pricePerDay"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("pricePerDay")}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select onValueChange={(value) => setValue("currency", value)} defaultValue="USD">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="maxGuests">Maximum Guests *</Label>
            <Input
              id="maxGuests"
              type="number"
              min="1"
              max="50"
              {...register("maxGuests", { valueAsNumber: true })}
              className={errors.maxGuests ? "border-red-500" : ""}
            />
            {errors.maxGuests && (
              <p className="text-red-500 text-sm mt-1">{errors.maxGuests.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Amenities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Amenities & Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {COMMON_AMENITIES.map((amenity) => (
              <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={selectedAmenities.includes(amenity)}
                  onCheckedChange={() => toggleCommonAmenity(amenity)}
                />
                <span className="text-sm capitalize">{amenity.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Add custom amenity"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
            />
            <Button type="button" onClick={addAmenity} variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {selectedAmenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedAmenities.map((amenity) => (
                <Badge key={amenity} variant="secondary" className="cursor-pointer">
                  {amenity.replace(/_/g, ' ')}
                  <X
                    className="w-3 h-3 ml-1"
                    onClick={() => removeAmenity(amenity)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Languages Spoken</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {COMMON_LANGUAGES.map((language) => (
              <label key={language} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={selectedLanguages.includes(language)}
                  onCheckedChange={() => toggleCommonLanguage(language)}
                />
                <span className="text-sm">{language}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Add other language"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
            />
            <Button type="button" onClick={addLanguage} variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {selectedLanguages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedLanguages.map((language) => (
                <Badge key={language} variant="secondary" className="cursor-pointer">
                  {language}
                  <X
                    className="w-3 h-3 ml-1"
                    onClick={() => removeLanguage(language)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add image URL"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
            />
            <Button type="button" onClick={addImageUrl} variant="outline">
              <Upload className="w-4 h-4" />
            </Button>
          </div>

          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Host image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImageUrl(url)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEditing ? "Update Profile" : "Create Profile"}
        </Button>
      </div>
    </form>
  );
}