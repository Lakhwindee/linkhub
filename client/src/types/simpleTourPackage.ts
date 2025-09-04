// Simplified Tour Package Interface - Based on Standard Travel Websites
export interface SimpleTourPackage {
  id: string;
  title: string;
  description: string;
  destination: string;
  country: string;
  city: string;
  duration: number; // days
  price: number; // simple price per person
  currency: string;
  
  // Basic Info
  maxGroupSize: number;
  minAge?: number;
  difficulty: 'easy' | 'moderate' | 'challenging';
  packageType: 'adventure' | 'cultural' | 'luxury' | 'family' | 'business' | 'wildlife' | 'beach' | 'heritage';
  
  // Tour Operator Info
  operatorName: string;
  operatorRating: number;
  operatorContact?: string;
  
  // Media
  images: string[];
  
  // What's Included (Standard Travel Website Features)
  inclusions: string[];
  exclusions: string[];
  
  // Simple Day-by-Day Itinerary
  itinerary: {
    day: number;
    title: string;
    description: string;
    activities: string[];
    meals: string[]; // breakfast, lunch, dinner
    accommodation?: string;
  }[];
  
  // Booking Info
  departureDate: string;
  returnDate: string;
  availability: number;
  bookingDeadline?: string;
  
  // Reviews & Ratings
  rating: number;
  reviewCount: number;
  
  // Additional Info
  featured: boolean;
  tags: string[];
  highlights: string[]; // top 3-5 key features
  
  // Simple Terms
  cancellationPolicy?: string;
  importantNotes?: string[];
  
  // Timestamps
  createdAt: string;
  updatedAt?: string;
}

// Simplified form data for creating tour packages
export interface CreateTourPackageData {
  title: string;
  description: string;
  destination: string;
  country: string;
  city: string;
  duration: number;
  price: number;
  currency: string;
  maxGroupSize: number;
  packageType: string;
  operatorName: string;
  inclusions: string[];
  exclusions: string[];
  itinerary: {
    day: number;
    title: string;
    description: string;
    activities: string[];
  }[];
  departureDate: string;
  highlights: string[];
  images?: string[];
}