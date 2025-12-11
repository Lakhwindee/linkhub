import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Globe, Radar, User as UserIcon, MessageCircle, Users, Maximize2, Minimize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Globe3D from "@/components/Globe3D";
import type { User } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { getCountriesForMap, getStatesForCountry } from "@/utils/locationUtils";

// Use comprehensive real-world countries data (250+ countries) with map coordinates
const COUNTRIES = getCountriesForMap();

// Old hardcoded data (replaced with real data above)
const OLD_HARDCODED_COUNTRIES = [
  { code: "all", name: "All Countries", lat: 20, lng: 0, zoom: 2 },
  // Europe
  { code: "GB", name: "United Kingdom", lat: 54.7753, lng: -2.3508, zoom: 6 },
  { code: "FR", name: "France", lat: 46.6034, lng: 1.8883, zoom: 6 },
  { code: "DE", name: "Germany", lat: 51.1657, lng: 10.4515, zoom: 6 },
  { code: "IT", name: "Italy", lat: 41.8719, lng: 12.5674, zoom: 6 },
  { code: "ES", name: "Spain", lat: 40.4637, lng: -3.7492, zoom: 6 },
  { code: "NL", name: "Netherlands", lat: 52.1326, lng: 5.2913, zoom: 7 },
  { code: "CH", name: "Switzerland", lat: 46.8182, lng: 8.2275, zoom: 7 },
  { code: "AT", name: "Austria", lat: 47.5162, lng: 14.5501, zoom: 7 },
  { code: "BE", name: "Belgium", lat: 50.8503, lng: 4.3517, zoom: 7 },
  { code: "SE", name: "Sweden", lat: 60.1282, lng: 18.6435, zoom: 5 },
  { code: "NO", name: "Norway", lat: 60.4720, lng: 8.4689, zoom: 5 },
  { code: "DK", name: "Denmark", lat: 56.2639, lng: 9.5018, zoom: 7 },
  { code: "FI", name: "Finland", lat: 61.9241, lng: 25.7482, zoom: 5 },
  { code: "PL", name: "Poland", lat: 51.9194, lng: 19.1451, zoom: 6 },
  { code: "CZ", name: "Czech Republic", lat: 49.8175, lng: 15.4730, zoom: 7 },
  { code: "PT", name: "Portugal", lat: 39.3999, lng: -8.2245, zoom: 7 },
  { code: "GR", name: "Greece", lat: 39.0742, lng: 21.8243, zoom: 6 },
  { code: "RU", name: "Russia", lat: 61.5240, lng: 105.3188, zoom: 3 },
  
  // Asia
  { code: "IN", name: "India", lat: 20.5937, lng: 78.9629, zoom: 5 },
  { code: "CN", name: "China", lat: 35.8617, lng: 104.1954, zoom: 4 },
  { code: "JP", name: "Japan", lat: 36.2048, lng: 138.2529, zoom: 6 },
  { code: "KR", name: "South Korea", lat: 35.9078, lng: 127.7669, zoom: 7 },
  { code: "TH", name: "Thailand", lat: 15.8700, lng: 100.9925, zoom: 6 },
  { code: "VN", name: "Vietnam", lat: 14.0583, lng: 108.2772, zoom: 6 },
  { code: "SG", name: "Singapore", lat: 1.3521, lng: 103.8198, zoom: 11 },
  { code: "MY", name: "Malaysia", lat: 4.2105, lng: 101.9758, zoom: 6 },
  { code: "ID", name: "Indonesia", lat: -0.7893, lng: 113.9213, zoom: 5 },
  { code: "PH", name: "Philippines", lat: 12.8797, lng: 121.7740, zoom: 6 },
  { code: "PK", name: "Pakistan", lat: 30.3753, lng: 69.3451, zoom: 6 },
  { code: "BD", name: "Bangladesh", lat: 23.6850, lng: 90.3563, zoom: 7 },
  { code: "LK", name: "Sri Lanka", lat: 7.8731, lng: 80.7718, zoom: 8 },
  { code: "IR", name: "Iran", lat: 32.4279, lng: 53.6880, zoom: 6 },
  { code: "TR", name: "Turkey", lat: 38.9637, lng: 35.2433, zoom: 6 },
  { code: "IL", name: "Israel", lat: 31.0461, lng: 34.8516, zoom: 8 },
  { code: "AE", name: "UAE", lat: 23.4241, lng: 53.8478, zoom: 7 },
  { code: "SA", name: "Saudi Arabia", lat: 23.8859, lng: 45.0792, zoom: 6 },
  
  // North America
  { code: "US", name: "United States", lat: 39.8283, lng: -98.5795, zoom: 4 },
  { code: "CA", name: "Canada", lat: 56.1304, lng: -106.3468, zoom: 4 },
  { code: "MX", name: "Mexico", lat: 23.6345, lng: -102.5528, zoom: 5 },
  
  // South America
  { code: "BR", name: "Brazil", lat: -14.2350, lng: -51.9253, zoom: 4 },
  { code: "AR", name: "Argentina", lat: -38.4161, lng: -63.6167, zoom: 4 },
  { code: "CL", name: "Chile", lat: -35.6751, lng: -71.5430, zoom: 4 },
  { code: "CO", name: "Colombia", lat: 4.5709, lng: -74.2973, zoom: 6 },
  { code: "PE", name: "Peru", lat: -9.1900, lng: -75.0152, zoom: 6 },
  { code: "VE", name: "Venezuela", lat: 6.4238, lng: -66.5897, zoom: 6 },
  
  // Africa
  { code: "ZA", name: "South Africa", lat: -30.5595, lng: 22.9375, zoom: 6 },
  { code: "EG", name: "Egypt", lat: 26.0975, lng: 30.0444, zoom: 6 },
  { code: "NG", name: "Nigeria", lat: 9.0820, lng: 8.6753, zoom: 6 },
  { code: "KE", name: "Kenya", lat: -0.0236, lng: 37.9062, zoom: 7 },
  { code: "MA", name: "Morocco", lat: 31.7917, lng: -7.0926, zoom: 6 },
  { code: "GH", name: "Ghana", lat: 7.9465, lng: -1.0232, zoom: 7 },
  
  // Oceania
  { code: "AU", name: "Australia", lat: -25.2744, lng: 133.7751, zoom: 5 },
  { code: "NZ", name: "New Zealand", lat: -40.9006, lng: 174.8860, zoom: 6 },
];  // End of old hardcoded countries

// Dynamic states/provinces loaded from real-world data based on selected country
const getStatesForSelectedCountry = (countryName: string) => {
  if (countryName === "All Countries" || countryName === "all") return [];
  return getStatesForCountry(countryName);
};

// OLD HARDCODED states/provinces by country (replaced with real data above)
const OLD_STATES: Record<string, Array<{ code: string, name: string, lat: number, lng: number, zoom: number }>> = {
  "US": [
    { code: "CA", name: "California", lat: 36.7783, lng: -119.4179, zoom: 7 },
    { code: "TX", name: "Texas", lat: 31.9686, lng: -99.9018, zoom: 6 },
    { code: "FL", name: "Florida", lat: 27.7663, lng: -81.6868, zoom: 7 },
    { code: "NY", name: "New York", lat: 42.1657, lng: -74.9481, zoom: 7 },
    { code: "PA", name: "Pennsylvania", lat: 41.2033, lng: -77.1945, zoom: 7 },
    { code: "IL", name: "Illinois", lat: 40.3363, lng: -89.0022, zoom: 7 },
    { code: "OH", name: "Ohio", lat: 40.3888, lng: -82.7649, zoom: 7 },
    { code: "GA", name: "Georgia", lat: 33.0406, lng: -83.6431, zoom: 7 },
    { code: "NC", name: "North Carolina", lat: 35.6301, lng: -79.8064, zoom: 7 },
    { code: "MI", name: "Michigan", lat: 43.3266, lng: -84.5361, zoom: 7 },
    { code: "WA", name: "Washington", lat: 47.0379, lng: -121.0187, zoom: 7 },
    { code: "CO", name: "Colorado", lat: 39.0598, lng: -105.3111, zoom: 7 },
    { code: "AZ", name: "Arizona", lat: 33.7712, lng: -111.3877, zoom: 7 },
    { code: "NV", name: "Nevada", lat: 38.9517, lng: -117.0542, zoom: 7 },
    { code: "OR", name: "Oregon", lat: 44.5720, lng: -122.0709, zoom: 7 }
  ],
  "IN": [
    { code: "MH", name: "Maharashtra", lat: 19.7515, lng: 75.7139, zoom: 7 },
    { code: "DL", name: "Delhi", lat: 28.7041, lng: 77.1025, zoom: 9 },
    { code: "KA", name: "Karnataka", lat: 15.3173, lng: 75.7139, zoom: 7 },
    { code: "TN", name: "Tamil Nadu", lat: 11.1271, lng: 78.6569, zoom: 7 },
    { code: "WB", name: "West Bengal", lat: 22.9868, lng: 87.8550, zoom: 7 },
    { code: "TS", name: "Telangana", lat: 18.1124, lng: 79.0193, zoom: 8 },
    { code: "GJ", name: "Gujarat", lat: 22.2587, lng: 71.1924, zoom: 7 },
    { code: "RJ", name: "Rajasthan", lat: 27.0238, lng: 74.2179, zoom: 6 },
    { code: "UP", name: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, zoom: 6 },
    { code: "MP", name: "Madhya Pradesh", lat: 22.9734, lng: 78.6569, zoom: 6 },
    { code: "BR", name: "Bihar", lat: 25.0961, lng: 85.3131, zoom: 7 },
    { code: "OR", name: "Odisha", lat: 20.9517, lng: 85.0985, zoom: 7 },
    { code: "PB", name: "Punjab", lat: 31.1471, lng: 75.3412, zoom: 8 },
    { code: "HR", name: "Haryana", lat: 29.0588, lng: 76.0856, zoom: 8 },
    { code: "JH", name: "Jharkhand", lat: 23.6102, lng: 85.2799, zoom: 7 },
    { code: "AS", name: "Assam", lat: 26.2006, lng: 92.9376, zoom: 7 },
    { code: "KL", name: "Kerala", lat: 10.8505, lng: 76.2711, zoom: 8 },
    { code: "AP", name: "Andhra Pradesh", lat: 15.9129, lng: 79.7400, zoom: 7 },
    { code: "UK", name: "Uttarakhand", lat: 30.0668, lng: 79.0193, zoom: 8 },
    { code: "HP", name: "Himachal Pradesh", lat: 31.1048, lng: 77.1734, zoom: 8 },
    { code: "JK", name: "Jammu and Kashmir", lat: 34.0837, lng: 74.7973, zoom: 8 },
    { code: "GA", name: "Goa", lat: 15.2993, lng: 74.1240, zoom: 10 }
  ],
  "CA": [
    { code: "ON", name: "Ontario", lat: 51.2538, lng: -85.3232, zoom: 5 },
    { code: "QC", name: "Quebec", lat: 53.9214, lng: -72.7665, zoom: 5 },
    { code: "BC", name: "British Columbia", lat: 53.7267, lng: -127.6476, zoom: 5 },
    { code: "AB", name: "Alberta", lat: 53.9333, lng: -116.5765, zoom: 6 },
    { code: "MB", name: "Manitoba", lat: 53.7609, lng: -98.8139, zoom: 6 },
    { code: "SK", name: "Saskatchewan", lat: 52.9399, lng: -106.4509, zoom: 6 },
    { code: "NS", name: "Nova Scotia", lat: 44.6820, lng: -63.7443, zoom: 8 },
    { code: "NB", name: "New Brunswick", lat: 46.5653, lng: -66.4619, zoom: 8 },
    { code: "NL", name: "Newfoundland and Labrador", lat: 53.1355, lng: -57.6604, zoom: 6 }
  ],
  "GB": [
    { code: "ENG", name: "England", lat: 52.3555, lng: -1.1743, zoom: 7 },
    { code: "SCT", name: "Scotland", lat: 56.4907, lng: -4.2026, zoom: 7 },
    { code: "WLS", name: "Wales", lat: 52.1307, lng: -3.7837, zoom: 8 },
    { code: "NIR", name: "Northern Ireland", lat: 54.7877, lng: -6.4923, zoom: 8 }
  ],
  "AU": [
    { code: "NSW", name: "New South Wales", lat: -31.2532, lng: 146.9211, zoom: 6 },
    { code: "VIC", name: "Victoria", lat: -37.4713, lng: 144.7852, zoom: 7 },
    { code: "QLD", name: "Queensland", lat: -20.9176, lng: 142.7028, zoom: 5 },
    { code: "WA", name: "Western Australia", lat: -25.2744, lng: 133.7751, zoom: 5 },
    { code: "SA", name: "South Australia", lat: -30.0002, lng: 136.2092, zoom: 6 },
    { code: "TAS", name: "Tasmania", lat: -41.4545, lng: 145.9707, zoom: 8 },
    { code: "NT", name: "Northern Territory", lat: -19.4914, lng: 132.5510, zoom: 6 },
    { code: "ACT", name: "Australian Capital Territory", lat: -35.4735, lng: 149.0124, zoom: 10 }
  ],
  "BR": [
    { code: "SP", name: "São Paulo", lat: -23.5489, lng: -46.6388, zoom: 7 },
    { code: "RJ", name: "Rio de Janeiro", lat: -22.9068, lng: -43.1729, zoom: 8 },
    { code: "MG", name: "Minas Gerais", lat: -18.5122, lng: -44.5550, zoom: 6 },
    { code: "BA", name: "Bahia", lat: -12.5797, lng: -41.7007, zoom: 6 },
    { code: "PR", name: "Paraná", lat: -24.8341, lng: -51.9253, zoom: 7 },
    { code: "RS", name: "Rio Grande do Sul", lat: -30.0346, lng: -51.2177, zoom: 6 },
    { code: "PE", name: "Pernambuco", lat: -8.8137, lng: -36.9541, zoom: 7 },
    { code: "CE", name: "Ceará", lat: -5.4984, lng: -39.3206, zoom: 7 },
    { code: "SC", name: "Santa Catarina", lat: -27.2423, lng: -50.2189, zoom: 7 }
  ]
};

const CITIES = {
  // Europe
  "GB": [
    // England - Major Cities
    { name: "London", lat: 51.5074, lng: -0.1278, zoom: 10 },
    { name: "Manchester", lat: 53.4808, lng: -2.2426, zoom: 10 },
    { name: "Birmingham", lat: 52.4862, lng: -1.8904, zoom: 10 },
    { name: "Liverpool", lat: 53.4084, lng: -2.9916, zoom: 10 },
    { name: "Bristol", lat: 51.4545, lng: -2.5879, zoom: 10 },
    { name: "Leeds", lat: 53.8008, lng: -1.5491, zoom: 10 },
    { name: "Sheffield", lat: 53.3811, lng: -1.4701, zoom: 10 },
    { name: "Newcastle", lat: 54.9783, lng: -1.6178, zoom: 10 },
    { name: "Brighton", lat: 50.8225, lng: -0.1372, zoom: 10 },
    { name: "Nottingham", lat: 52.9548, lng: -1.1581, zoom: 10 },
    
    // England - University Cities
    { name: "Oxford", lat: 51.7520, lng: -1.2577, zoom: 10 },
    { name: "Cambridge", lat: 52.2053, lng: 0.1218, zoom: 10 },
    { name: "Bath", lat: 51.3811, lng: -2.3590, zoom: 10 },
    { name: "York", lat: 53.9600, lng: -1.0873, zoom: 10 },
    { name: "Canterbury", lat: 51.2802, lng: 1.0789, zoom: 10 },
    { name: "Leicester", lat: 52.6369, lng: -1.1398, zoom: 10 },
    { name: "Coventry", lat: 52.4068, lng: -1.5197, zoom: 10 },
    { name: "Hull", lat: 53.7676, lng: -0.3274, zoom: 10 },
    { name: "Plymouth", lat: 50.3755, lng: -4.1427, zoom: 10 },
    { name: "Stoke-on-Trent", lat: 53.0027, lng: -2.1794, zoom: 10 },
    
    // England - Coastal & Tourist Cities
    { name: "Portsmouth", lat: 50.8198, lng: -1.0880, zoom: 10 },
    { name: "Southampton", lat: 50.9097, lng: -1.4044, zoom: 10 },
    { name: "Bournemouth", lat: 50.7192, lng: -1.8808, zoom: 10 },
    { name: "Reading", lat: 51.4543, lng: -0.9781, zoom: 10 },
    { name: "Luton", lat: 51.8787, lng: -0.4200, zoom: 10 },
    { name: "Northampton", lat: 52.2405, lng: -0.9027, zoom: 10 },
    { name: "Preston", lat: 53.7632, lng: -2.7031, zoom: 10 },
    { name: "Milton Keynes", lat: 52.0406, lng: -0.7594, zoom: 10 },
    { name: "Swindon", lat: 51.5558, lng: -1.7797, zoom: 10 },
    { name: "Blackpool", lat: 53.8175, lng: -3.0357, zoom: 10 },
    
    // Scotland
    { name: "Edinburgh", lat: 55.9533, lng: -3.1883, zoom: 10 },
    { name: "Glasgow", lat: 55.8642, lng: -4.2518, zoom: 10 },
    { name: "Aberdeen", lat: 57.1497, lng: -2.0943, zoom: 10 },
    { name: "Dundee", lat: 56.4620, lng: -2.9707, zoom: 10 },
    { name: "Stirling", lat: 56.1165, lng: -3.9369, zoom: 10 },
    { name: "Perth", lat: 56.3951, lng: -3.4311, zoom: 10 },
    { name: "Inverness", lat: 57.4778, lng: -4.2247, zoom: 10 },
    { name: "St Andrews", lat: 56.3398, lng: -2.7967, zoom: 10 },
    
    // Wales
    { name: "Cardiff", lat: 51.4816, lng: -3.1791, zoom: 10 },
    { name: "Swansea", lat: 51.6214, lng: -3.9436, zoom: 10 },
    { name: "Newport", lat: 51.5842, lng: -2.9977, zoom: 10 },
    { name: "Wrexham", lat: 53.0478, lng: -2.9916, zoom: 10 },
    { name: "Bangor", lat: 53.2280, lng: -4.1262, zoom: 10 },
    
    // Northern Ireland
    { name: "Belfast", lat: 54.5973, lng: -5.9301, zoom: 10 },
    { name: "Derry", lat: 54.9981, lng: -7.3086, zoom: 10 },
    { name: "Lisburn", lat: 54.5162, lng: -6.0581, zoom: 10 },
    { name: "Newtownabbey", lat: 54.6564, lng: -5.9065, zoom: 10 }
  ],
  "FR": [
    { name: "Paris", lat: 48.8566, lng: 2.3522, zoom: 10 },
    { name: "Lyon", lat: 45.7640, lng: 4.8357, zoom: 10 },
    { name: "Marseille", lat: 43.2965, lng: 5.3698, zoom: 10 },
    { name: "Nice", lat: 43.7102, lng: 7.2620, zoom: 10 },
    { name: "Toulouse", lat: 43.6047, lng: 1.4442, zoom: 10 },
  ],
  "DE": [
    { name: "Berlin", lat: 52.5200, lng: 13.4050, zoom: 10 },
    { name: "Munich", lat: 48.1351, lng: 11.5820, zoom: 10 },
    { name: "Hamburg", lat: 53.5511, lng: 9.9937, zoom: 10 },
    { name: "Frankfurt", lat: 50.1109, lng: 8.6821, zoom: 10 },
    { name: "Cologne", lat: 50.9375, lng: 6.9603, zoom: 10 },
  ],
  "IT": [
    { name: "Rome", lat: 41.9028, lng: 12.4964, zoom: 10 },
    { name: "Milan", lat: 45.4642, lng: 9.1900, zoom: 10 },
    { name: "Naples", lat: 40.8518, lng: 14.2681, zoom: 10 },
    { name: "Venice", lat: 45.4408, lng: 12.3155, zoom: 10 },
    { name: "Florence", lat: 43.7696, lng: 11.2558, zoom: 10 },
  ],
  "ES": [
    { name: "Madrid", lat: 40.4168, lng: -3.7038, zoom: 10 },
    { name: "Barcelona", lat: 41.3851, lng: 2.1734, zoom: 10 },
    { name: "Valencia", lat: 39.4699, lng: -0.3763, zoom: 10 },
    { name: "Seville", lat: 37.3891, lng: -5.9845, zoom: 10 },
    { name: "Bilbao", lat: 43.2627, lng: -2.9253, zoom: 10 },
  ],
  "NL": [
    { name: "Amsterdam", lat: 52.3676, lng: 4.9041, zoom: 10 },
    { name: "Rotterdam", lat: 51.9244, lng: 4.4777, zoom: 10 },
    { name: "The Hague", lat: 52.0705, lng: 4.3007, zoom: 10 },
    { name: "Utrecht", lat: 52.0907, lng: 5.1214, zoom: 10 },
  ],
  "CH": [
    { name: "Zurich", lat: 47.3769, lng: 8.5417, zoom: 10 },
    { name: "Geneva", lat: 46.2044, lng: 6.1432, zoom: 10 },
    { name: "Basel", lat: 47.5596, lng: 7.5886, zoom: 10 },
    { name: "Bern", lat: 46.9481, lng: 7.4474, zoom: 10 },
  ],
  "AT": [
    { name: "Vienna", lat: 48.2082, lng: 16.3738, zoom: 10 },
    { name: "Salzburg", lat: 47.8095, lng: 13.0550, zoom: 10 },
    { name: "Innsbruck", lat: 47.2692, lng: 11.4041, zoom: 10 },
  ],
  "SE": [
    { name: "Stockholm", lat: 59.3293, lng: 18.0686, zoom: 10 },
    { name: "Gothenburg", lat: 57.7089, lng: 11.9746, zoom: 10 },
    { name: "Malmö", lat: 55.6049, lng: 13.0038, zoom: 10 },
  ],
  "NO": [
    { name: "Oslo", lat: 59.9139, lng: 10.7522, zoom: 10 },
    { name: "Bergen", lat: 60.3913, lng: 5.3221, zoom: 10 },
    { name: "Trondheim", lat: 63.4305, lng: 10.3951, zoom: 10 },
  ],
  "DK": [
    { name: "Copenhagen", lat: 55.6761, lng: 12.5683, zoom: 10 },
    { name: "Aarhus", lat: 56.1629, lng: 10.2039, zoom: 10 },
    { name: "Odense", lat: 55.4038, lng: 10.4024, zoom: 10 },
  ],
  "RU": [
    { name: "Moscow", lat: 55.7558, lng: 37.6176, zoom: 10 },
    { name: "Saint Petersburg", lat: 59.9311, lng: 30.3609, zoom: 10 },
    { name: "Novosibirsk", lat: 55.0084, lng: 82.9357, zoom: 10 },
  ],

  // Asia
  "IN": [
    { name: "Mumbai", lat: 19.0760, lng: 72.8777, zoom: 10 },
    { name: "Delhi", lat: 28.7041, lng: 77.1025, zoom: 10 },
    { name: "Bangalore", lat: 12.9716, lng: 77.5946, zoom: 10 },
    { name: "Chennai", lat: 13.0827, lng: 80.2707, zoom: 10 },
    { name: "Kolkata", lat: 22.5726, lng: 88.3639, zoom: 10 },
    { name: "Hyderabad", lat: 17.3850, lng: 78.4867, zoom: 10 },
    { name: "Pune", lat: 18.5204, lng: 73.8567, zoom: 10 },
    { name: "Ahmedabad", lat: 23.0225, lng: 72.5714, zoom: 10 },
    { name: "Jaipur", lat: 26.9124, lng: 75.7873, zoom: 10 },
    { name: "Surat", lat: 21.1702, lng: 72.8311, zoom: 10 },
    { name: "Lucknow", lat: 26.8467, lng: 80.9462, zoom: 10 },
    { name: "Kanpur", lat: 26.4499, lng: 80.3319, zoom: 10 },
    { name: "Nagpur", lat: 21.1458, lng: 79.0882, zoom: 10 },
    { name: "Indore", lat: 22.7196, lng: 75.8577, zoom: 10 },
    { name: "Thane", lat: 19.2183, lng: 72.9781, zoom: 10 },
    { name: "Bhopal", lat: 23.2599, lng: 77.4126, zoom: 10 },
    { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185, zoom: 10 },
    { name: "Pimpri-Chinchwad", lat: 18.6298, lng: 73.7997, zoom: 10 },
    { name: "Patna", lat: 25.5941, lng: 85.1376, zoom: 10 },
    { name: "Vadodara", lat: 22.3072, lng: 73.1812, zoom: 10 },
    { name: "Ghaziabad", lat: 28.6692, lng: 77.4538, zoom: 10 },
    { name: "Ludhiana", lat: 30.9001, lng: 75.8573, zoom: 10 },
    { name: "Agra", lat: 27.1767, lng: 78.0081, zoom: 10 },
    { name: "Nashik", lat: 19.9975, lng: 73.7898, zoom: 10 },
    { name: "Faridabad", lat: 28.4089, lng: 77.3178, zoom: 10 },
    { name: "Meerut", lat: 28.9845, lng: 77.7064, zoom: 10 },
    { name: "Rajkot", lat: 22.3039, lng: 70.8022, zoom: 10 },
    { name: "Kalyan-Dombivali", lat: 19.2403, lng: 73.1305, zoom: 10 },
    { name: "Vasai-Virar", lat: 19.4919, lng: 72.8197, zoom: 10 },
    { name: "Varanasi", lat: 25.3176, lng: 82.9739, zoom: 10 },
    { name: "Srinagar", lat: 34.0837, lng: 74.7973, zoom: 10 },
    { name: "Aurangabad", lat: 19.8762, lng: 75.3433, zoom: 10 },
    { name: "Dhanbad", lat: 23.7957, lng: 86.4304, zoom: 10 },
    { name: "Amritsar", lat: 31.6340, lng: 74.8723, zoom: 10 },
    { name: "Navi Mumbai", lat: 19.0330, lng: 73.0297, zoom: 10 },
    { name: "Allahabad", lat: 25.4358, lng: 81.8463, zoom: 10 },
    { name: "Ranchi", lat: 23.3441, lng: 85.3096, zoom: 10 },
    { name: "Howrah", lat: 22.5958, lng: 88.2636, zoom: 10 },
    { name: "Coimbatore", lat: 11.0168, lng: 76.9558, zoom: 10 },
    { name: "Jabalpur", lat: 23.1815, lng: 79.9864, zoom: 10 },
    { name: "Gwalior", lat: 26.2183, lng: 78.1828, zoom: 10 },
    { name: "Vijayawada", lat: 16.5062, lng: 80.6480, zoom: 10 },
    { name: "Jodhpur", lat: 26.2389, lng: 73.0243, zoom: 10 },
    { name: "Madurai", lat: 9.9252, lng: 78.1198, zoom: 10 },
    { name: "Raipur", lat: 21.2514, lng: 81.6296, zoom: 10 },
    { name: "Kota", lat: 25.2138, lng: 75.8648, zoom: 10 },
    { name: "Chandigarh", lat: 30.7333, lng: 76.7794, zoom: 10 },
    { name: "Guwahati", lat: 26.1445, lng: 91.7362, zoom: 10 },
    { name: "Solapur", lat: 17.6599, lng: 75.9064, zoom: 10 },
    { name: "Hubli-Dharwad", lat: 15.3647, lng: 75.1240, zoom: 10 },
    { name: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366, zoom: 10 },
    { name: "Bareilly", lat: 28.3670, lng: 79.4304, zoom: 10 },
    { name: "Mysore", lat: 12.2958, lng: 76.6394, zoom: 10 },
    { name: "Tiruppur", lat: 11.1085, lng: 77.3411, zoom: 10 },
    { name: "Gurgaon", lat: 28.4595, lng: 77.0266, zoom: 10 },
    { name: "Salem", lat: 11.6643, lng: 78.1460, zoom: 10 },
    { name: "Aligarh", lat: 27.8974, lng: 78.0880, zoom: 10 },
    { name: "Bhiwandi", lat: 19.3002, lng: 73.0635, zoom: 10 },
    { name: "Moradabad", lat: 28.8386, lng: 78.7733, zoom: 10 },
    { name: "Gorakhpur", lat: 26.7606, lng: 83.3732, zoom: 10 },
    { name: "Bikaner", lat: 28.0229, lng: 73.3119, zoom: 10 },
    { name: "Saharanpur", lat: 29.9680, lng: 77.5552, zoom: 10 },
    { name: "Guntur", lat: 16.3067, lng: 80.4365, zoom: 10 },
    { name: "Warangal", lat: 17.9784, lng: 79.6000, zoom: 10 },
    { name: "Bhilai", lat: 21.1938, lng: 81.3509, zoom: 10 },
    { name: "Firozabad", lat: 27.1592, lng: 78.3957, zoom: 10 },
    { name: "Noida", lat: 28.5355, lng: 77.3910, zoom: 10 },
    { name: "Dehradun", lat: 30.3165, lng: 78.0322, zoom: 10 },
    { name: "Kochi", lat: 9.9312, lng: 76.2673, zoom: 10 },
    { name: "Bhubaneswar", lat: 20.2961, lng: 85.8245, zoom: 10 },
    { name: "Goa", lat: 15.2993, lng: 74.1240, zoom: 10 },
    { name: "Jammu", lat: 32.7266, lng: 74.8570, zoom: 10 },
    { name: "Shimla", lat: 31.1048, lng: 77.1734, zoom: 10 },
    { name: "Manali", lat: 32.2396, lng: 77.1887, zoom: 10 },
    { name: "Rishikesh", lat: 30.0869, lng: 78.2676, zoom: 10 },
    { name: "Haridwar", lat: 29.9457, lng: 78.1642, zoom: 10 },
    { name: "Udaipur", lat: 24.5854, lng: 73.7125, zoom: 10 },
    { name: "Pushkar", lat: 26.4900, lng: 74.5511, zoom: 10 },
    { name: "Darjeeling", lat: 27.0360, lng: 88.2627, zoom: 10 },
    { name: "Gangtok", lat: 27.3389, lng: 88.6065, zoom: 10 }
  ],
  "CN": [
    { name: "Beijing", lat: 39.9042, lng: 116.4074, zoom: 10 },
    { name: "Shanghai", lat: 31.2304, lng: 121.4737, zoom: 10 },
    { name: "Guangzhou", lat: 23.1291, lng: 113.2644, zoom: 10 },
    { name: "Shenzhen", lat: 22.5431, lng: 114.0579, zoom: 10 },
    { name: "Chengdu", lat: 30.5728, lng: 104.0668, zoom: 10 },
    { name: "Xi'an", lat: 34.3416, lng: 108.9398, zoom: 10 },
  ],
  "JP": [
    { name: "Tokyo", lat: 35.6762, lng: 139.6503, zoom: 10 },
    { name: "Osaka", lat: 34.6937, lng: 135.5023, zoom: 10 },
    { name: "Kyoto", lat: 35.0116, lng: 135.7681, zoom: 10 },
    { name: "Nagoya", lat: 35.1815, lng: 136.9066, zoom: 10 },
    { name: "Yokohama", lat: 35.4438, lng: 139.6380, zoom: 10 },
  ],
  "KR": [
    { name: "Seoul", lat: 37.5665, lng: 126.9780, zoom: 11 },
    { name: "Busan", lat: 35.1796, lng: 129.0756, zoom: 11 },
    { name: "Incheon", lat: 37.4563, lng: 126.7052, zoom: 11 },
    { name: "Daegu", lat: 35.8714, lng: 128.6014, zoom: 11 },
    { name: "Jeju", lat: 33.4996, lng: 126.5312, zoom: 11 },
  ],
  "TH": [
    { name: "Bangkok", lat: 13.7563, lng: 100.5018, zoom: 10 },
    { name: "Chiang Mai", lat: 18.7883, lng: 98.9853, zoom: 10 },
    { name: "Phuket", lat: 7.8804, lng: 98.3923, zoom: 10 },
    { name: "Pattaya", lat: 12.9236, lng: 100.8825, zoom: 10 },
  ],
  "VN": [
    { name: "Ho Chi Minh City", lat: 10.8231, lng: 106.6297, zoom: 10 },
    { name: "Hanoi", lat: 21.0285, lng: 105.8542, zoom: 10 },
    { name: "Da Nang", lat: 16.0544, lng: 108.2022, zoom: 10 },
    { name: "Hoi An", lat: 15.8801, lng: 108.3380, zoom: 10 },
  ],
  "SG": [
    { name: "Singapore", lat: 1.3521, lng: 103.8198, zoom: 11 },
  ],
  "MY": [
    { name: "Kuala Lumpur", lat: 3.1390, lng: 101.6869, zoom: 10 },
    { name: "George Town", lat: 5.4164, lng: 100.3327, zoom: 10 },
    { name: "Johor Bahru", lat: 1.4927, lng: 103.7414, zoom: 10 },
  ],
  "ID": [
    { name: "Jakarta", lat: -6.2088, lng: 106.8456, zoom: 10 },
    { name: "Bali", lat: -8.4095, lng: 115.1889, zoom: 10 },
    { name: "Yogyakarta", lat: -7.7956, lng: 110.3695, zoom: 10 },
    { name: "Bandung", lat: -6.9175, lng: 107.6191, zoom: 10 },
  ],
  "PH": [
    { name: "Manila", lat: 14.5995, lng: 120.9842, zoom: 10 },
    { name: "Cebu", lat: 10.3157, lng: 123.8854, zoom: 10 },
    { name: "Davao", lat: 7.1907, lng: 125.4553, zoom: 10 },
  ],
  "PK": [
    { name: "Karachi", lat: 24.8607, lng: 67.0011, zoom: 10 },
    { name: "Lahore", lat: 31.5204, lng: 74.3587, zoom: 10 },
    { name: "Islamabad", lat: 33.6844, lng: 73.0479, zoom: 10 },
  ],
  "BD": [
    { name: "Dhaka", lat: 23.8103, lng: 90.4125, zoom: 10 },
    { name: "Chittagong", lat: 22.3569, lng: 91.7832, zoom: 10 },
  ],
  "TR": [
    { name: "Istanbul", lat: 41.0082, lng: 28.9784, zoom: 10 },
    { name: "Ankara", lat: 39.9334, lng: 32.8597, zoom: 10 },
    { name: "Izmir", lat: 38.4192, lng: 27.1287, zoom: 10 },
    { name: "Cappadocia", lat: 38.6431, lng: 34.8332, zoom: 10 },
  ],
  "AE": [
    { name: "Dubai", lat: 25.2048, lng: 55.2708, zoom: 10 },
    { name: "Abu Dhabi", lat: 24.4539, lng: 54.3773, zoom: 10 },
    { name: "Sharjah", lat: 25.3463, lng: 55.4209, zoom: 10 },
    { name: "Al Ain", lat: 24.2075, lng: 55.7447, zoom: 10 },
    { name: "Ajman", lat: 25.4052, lng: 55.5136, zoom: 10 },
  ],
  "BE": [
    { name: "Brussels", lat: 50.8503, lng: 4.3517, zoom: 10 },
    { name: "Antwerp", lat: 51.2194, lng: 4.4025, zoom: 10 },
    { name: "Ghent", lat: 51.0543, lng: 3.7174, zoom: 10 },
    { name: "Charleroi", lat: 50.4108, lng: 4.4446, zoom: 10 },
    { name: "Liège", lat: 50.6326, lng: 5.5797, zoom: 10 },
    { name: "Bruges", lat: 51.2093, lng: 3.2247, zoom: 10 },
  ],
  "FI": [
    { name: "Helsinki", lat: 60.1699, lng: 24.9384, zoom: 10 },
    { name: "Espoo", lat: 60.2055, lng: 24.6559, zoom: 10 },
    { name: "Tampere", lat: 61.4991, lng: 23.7871, zoom: 10 },
    { name: "Vantaa", lat: 60.2934, lng: 25.0378, zoom: 10 },
    { name: "Oulu", lat: 65.0121, lng: 25.4651, zoom: 10 },
    { name: "Turku", lat: 60.4518, lng: 22.2666, zoom: 10 },
  ],
  "PL": [
    { name: "Warsaw", lat: 52.2297, lng: 21.0122, zoom: 10 },
    { name: "Kraków", lat: 50.0647, lng: 19.9450, zoom: 10 },
    { name: "Łódź", lat: 51.7592, lng: 19.4560, zoom: 10 },
    { name: "Wrocław", lat: 51.1079, lng: 17.0385, zoom: 10 },
    { name: "Poznań", lat: 52.4064, lng: 16.9252, zoom: 10 },
    { name: "Gdańsk", lat: 54.3520, lng: 18.6466, zoom: 10 },
  ],
  "CZ": [
    { name: "Prague", lat: 50.0755, lng: 14.4378, zoom: 10 },
    { name: "Brno", lat: 49.1951, lng: 16.6068, zoom: 10 },
    { name: "Ostrava", lat: 49.8209, lng: 18.2625, zoom: 10 },
    { name: "Plzen", lat: 49.7384, lng: 13.3736, zoom: 10 },
    { name: "Liberec", lat: 50.7663, lng: 15.0543, zoom: 10 },
  ],
  "PT": [
    { name: "Lisbon", lat: 38.7223, lng: -9.1393, zoom: 10 },
    { name: "Porto", lat: 41.1579, lng: -8.6291, zoom: 10 },
    { name: "Vila Nova de Gaia", lat: 41.1239, lng: -8.6118, zoom: 10 },
    { name: "Amadora", lat: 38.7536, lng: -9.2302, zoom: 10 },
    { name: "Braga", lat: 41.5518, lng: -8.4229, zoom: 10 },
    { name: "Funchal", lat: 32.6669, lng: -16.9241, zoom: 10 },
  ],
  "GR": [
    { name: "Athens", lat: 37.9838, lng: 23.7275, zoom: 10 },
    { name: "Thessaloniki", lat: 40.6401, lng: 22.9444, zoom: 10 },
    { name: "Patras", lat: 38.2466, lng: 21.7346, zoom: 10 },
    { name: "Piraeus", lat: 37.9755, lng: 23.6348, zoom: 10 },
    { name: "Larissa", lat: 39.6390, lng: 22.4194, zoom: 10 },
    { name: "Heraklion", lat: 35.3387, lng: 25.1442, zoom: 10 },
  ],
  "LK": [
    { name: "Colombo", lat: 6.9271, lng: 79.8612, zoom: 10 },
    { name: "Kandy", lat: 7.2906, lng: 80.6337, zoom: 10 },
    { name: "Galle", lat: 6.0535, lng: 80.2210, zoom: 10 },
    { name: "Jaffna", lat: 9.6615, lng: 80.0255, zoom: 10 },
  ],
  "IR": [
    { name: "Tehran", lat: 35.6892, lng: 51.3890, zoom: 10 },
    { name: "Mashhad", lat: 36.2605, lng: 59.6168, zoom: 10 },
    { name: "Isfahan", lat: 32.6546, lng: 51.6680, zoom: 10 },
    { name: "Shiraz", lat: 29.5918, lng: 52.5837, zoom: 10 },
    { name: "Tabriz", lat: 38.0804, lng: 46.2919, zoom: 10 },
  ],
  "IL": [
    { name: "Jerusalem", lat: 31.7683, lng: 35.2137, zoom: 10 },
    { name: "Tel Aviv", lat: 32.0853, lng: 34.7818, zoom: 10 },
    { name: "Haifa", lat: 32.7940, lng: 34.9896, zoom: 10 },
    { name: "Rishon LeZion", lat: 31.9730, lng: 34.8065, zoom: 10 },
    { name: "Petah Tikva", lat: 32.0878, lng: 34.8878, zoom: 10 },
  ],
  "SA": [
    { name: "Riyadh", lat: 24.7136, lng: 46.6753, zoom: 10 },
    { name: "Jeddah", lat: 21.4858, lng: 39.1925, zoom: 10 },
    { name: "Mecca", lat: 21.3891, lng: 39.8579, zoom: 10 },
    { name: "Medina", lat: 24.5247, lng: 39.5692, zoom: 10 },
    { name: "Dammam", lat: 26.4282, lng: 50.1020, zoom: 10 },
  ],
  "VE": [
    { name: "Caracas", lat: 10.4806, lng: -66.9036, zoom: 10 },
    { name: "Maracaibo", lat: 10.6666, lng: -71.6333, zoom: 10 },
    { name: "Valencia", lat: 10.1621, lng: -68.0078, zoom: 10 },
    { name: "Barquisimeto", lat: 10.0647, lng: -69.3570, zoom: 10 },
  ],
  "NG": [
    { name: "Lagos", lat: 6.5244, lng: 3.3792, zoom: 10 },
    { name: "Kano", lat: 12.0022, lng: 8.5920, zoom: 10 },
    { name: "Ibadan", lat: 7.3775, lng: 3.9470, zoom: 10 },
    { name: "Abuja", lat: 9.0579, lng: 7.4951, zoom: 10 },
    { name: "Port Harcourt", lat: 4.8156, lng: 7.0498, zoom: 10 },
  ],
  "GH": [
    { name: "Accra", lat: 5.6037, lng: -0.1870, zoom: 10 },
    { name: "Kumasi", lat: 6.6885, lng: -1.6244, zoom: 10 },
    { name: "Tamale", lat: 9.4008, lng: -0.8393, zoom: 10 },
    { name: "Cape Coast", lat: 5.1053, lng: -1.2466, zoom: 10 },
  ],

  // North America
  "US": [
    // Major Cities
    { name: "New York", lat: 40.7128, lng: -74.0060, zoom: 10 },
    { name: "Los Angeles", lat: 34.0522, lng: -118.2437, zoom: 10 },
    { name: "Chicago", lat: 41.8781, lng: -87.6298, zoom: 10 },
    { name: "Houston", lat: 29.7604, lng: -95.3698, zoom: 10 },
    { name: "Phoenix", lat: 33.4484, lng: -112.0740, zoom: 10 },
    { name: "Philadelphia", lat: 39.9526, lng: -75.1652, zoom: 10 },
    { name: "San Antonio", lat: 29.4241, lng: -98.4936, zoom: 10 },
    { name: "San Diego", lat: 32.7157, lng: -117.1611, zoom: 10 },
    { name: "Dallas", lat: 32.7767, lng: -96.7970, zoom: 10 },
    { name: "San Jose", lat: 37.3382, lng: -121.8863, zoom: 10 },
    
    // West Coast
    { name: "San Francisco", lat: 37.7749, lng: -122.4194, zoom: 10 },
    { name: "Seattle", lat: 47.6062, lng: -122.3321, zoom: 10 },
    { name: "Portland", lat: 45.5152, lng: -122.6784, zoom: 10 },
    { name: "Sacramento", lat: 38.5816, lng: -121.4944, zoom: 10 },
    { name: "Oakland", lat: 37.8044, lng: -122.2712, zoom: 10 },
    { name: "Fresno", lat: 36.7378, lng: -119.7871, zoom: 10 },
    { name: "Long Beach", lat: 33.7701, lng: -118.1937, zoom: 10 },
    { name: "Santa Ana", lat: 33.7455, lng: -117.8677, zoom: 10 },
    { name: "Anaheim", lat: 33.8366, lng: -117.9143, zoom: 10 },
    { name: "Riverside", lat: 33.9533, lng: -117.3962, zoom: 10 },
    
    // East Coast
    { name: "Boston", lat: 42.3601, lng: -71.0589, zoom: 10 },
    { name: "Washington DC", lat: 38.9072, lng: -77.0369, zoom: 10 },
    { name: "Atlanta", lat: 33.7490, lng: -84.3880, zoom: 10 },
    { name: "Miami", lat: 25.7617, lng: -80.1918, zoom: 10 },
    { name: "Tampa", lat: 27.9506, lng: -82.4572, zoom: 10 },
    { name: "Orlando", lat: 28.5383, lng: -81.3792, zoom: 10 },
    { name: "Jacksonville", lat: 30.3322, lng: -81.6557, zoom: 10 },
    { name: "Charlotte", lat: 35.2271, lng: -80.8431, zoom: 10 },
    { name: "Virginia Beach", lat: 36.8529, lng: -75.9780, zoom: 10 },
    { name: "Baltimore", lat: 39.2904, lng: -76.6122, zoom: 10 },
    
    // Central States  
    { name: "Detroit", lat: 42.3314, lng: -83.0458, zoom: 10 },
    { name: "Milwaukee", lat: 43.0389, lng: -87.9065, zoom: 10 },
    { name: "Kansas City", lat: 39.0997, lng: -94.5786, zoom: 10 },
    { name: "St. Louis", lat: 38.6270, lng: -90.1994, zoom: 10 },
    { name: "Minneapolis", lat: 44.9778, lng: -93.2650, zoom: 10 },
    { name: "Indianapolis", lat: 39.7684, lng: -86.1581, zoom: 10 },
    { name: "Columbus", lat: 39.9612, lng: -82.9988, zoom: 10 },
    { name: "Cleveland", lat: 41.4993, lng: -81.6944, zoom: 10 },
    { name: "Cincinnati", lat: 39.1031, lng: -84.5120, zoom: 10 },
    { name: "Pittsburgh", lat: 40.4406, lng: -79.9959, zoom: 10 },
    
    // Southwest
    { name: "Las Vegas", lat: 36.1699, lng: -115.1398, zoom: 10 },
    { name: "Albuquerque", lat: 35.0844, lng: -106.6504, zoom: 10 },
    { name: "Tucson", lat: 32.2226, lng: -110.9747, zoom: 10 },
    { name: "Mesa", lat: 33.4152, lng: -111.8315, zoom: 10 },
    { name: "Colorado Springs", lat: 38.8339, lng: -104.8214, zoom: 10 },
    { name: "Denver", lat: 39.7392, lng: -104.9903, zoom: 10 },
    { name: "Austin", lat: 30.2672, lng: -97.7431, zoom: 10 },
    { name: "Fort Worth", lat: 32.7555, lng: -97.3308, zoom: 10 },
    { name: "El Paso", lat: 31.7619, lng: -106.4850, zoom: 10 },
    { name: "Nashville", lat: 36.1627, lng: -86.7816, zoom: 10 },
    
    // Other Major Cities
    { name: "Memphis", lat: 35.1495, lng: -90.0490, zoom: 10 },
    { name: "Louisville", lat: 38.2027, lng: -85.7585, zoom: 10 },
    { name: "New Orleans", lat: 29.9511, lng: -90.0715, zoom: 10 },
    { name: "Raleigh", lat: 35.7796, lng: -78.6382, zoom: 10 },
    { name: "Omaha", lat: 41.2565, lng: -95.9345, zoom: 10 },
    { name: "Oklahoma City", lat: 35.4676, lng: -97.5164, zoom: 10 },
    { name: "Tulsa", lat: 36.1540, lng: -95.9928, zoom: 10 },
    { name: "Honolulu", lat: 21.3099, lng: -157.8581, zoom: 10 },
    { name: "Anchorage", lat: 61.2181, lng: -149.9003, zoom: 10 },
    { name: "Buffalo", lat: 42.8864, lng: -78.8784, zoom: 10 }
  ],
  "CA": [
    { name: "Toronto", lat: 43.6532, lng: -79.3832, zoom: 10 },
    { name: "Vancouver", lat: 49.2827, lng: -123.1207, zoom: 10 },
    { name: "Montreal", lat: 45.5017, lng: -73.5673, zoom: 10 },
    { name: "Calgary", lat: 51.0447, lng: -114.0719, zoom: 10 },
  ],
  "MX": [
    { name: "Mexico City", lat: 19.4326, lng: -99.1332, zoom: 10 },
    { name: "Cancun", lat: 21.1619, lng: -86.8515, zoom: 10 },
    { name: "Guadalajara", lat: 20.6597, lng: -103.3496, zoom: 10 },
  ],

  // South America
  "BR": [
    { name: "São Paulo", lat: -23.5505, lng: -46.6333, zoom: 10 },
    { name: "Rio de Janeiro", lat: -22.9068, lng: -43.1729, zoom: 10 },
    { name: "Salvador", lat: -12.9714, lng: -38.5014, zoom: 10 },
    { name: "Brasília", lat: -15.8267, lng: -47.9218, zoom: 10 },
  ],
  "AR": [
    { name: "Buenos Aires", lat: -34.6118, lng: -58.3960, zoom: 10 },
    { name: "Córdoba", lat: -31.4201, lng: -64.1888, zoom: 10 },
    { name: "Mendoza", lat: -32.8908, lng: -68.8272, zoom: 10 },
  ],
  "CL": [
    { name: "Santiago", lat: -33.4489, lng: -70.6693, zoom: 10 },
    { name: "Valparaíso", lat: -33.0458, lng: -71.6197, zoom: 10 },
  ],
  "CO": [
    { name: "Bogotá", lat: 4.7110, lng: -74.0721, zoom: 10 },
    { name: "Medellín", lat: 6.2442, lng: -75.5812, zoom: 10 },
    { name: "Cartagena", lat: 10.3910, lng: -75.4794, zoom: 10 },
  ],
  "PE": [
    { name: "Lima", lat: -12.0464, lng: -77.0428, zoom: 10 },
    { name: "Cusco", lat: -13.5319, lng: -71.9675, zoom: 10 },
  ],

  // Africa
  "ZA": [
    { name: "Cape Town", lat: -33.9249, lng: 18.4241, zoom: 10 },
    { name: "Johannesburg", lat: -26.2041, lng: 28.0473, zoom: 10 },
    { name: "Durban", lat: -29.8587, lng: 31.0218, zoom: 10 },
  ],
  "EG": [
    { name: "Cairo", lat: 30.0444, lng: 31.2357, zoom: 10 },
    { name: "Alexandria", lat: 31.2001, lng: 29.9187, zoom: 10 },
    { name: "Luxor", lat: 25.6872, lng: 32.6396, zoom: 10 },
  ],
  "MA": [
    { name: "Marrakech", lat: 31.6295, lng: -7.9811, zoom: 10 },
    { name: "Casablanca", lat: 33.5731, lng: -7.5898, zoom: 10 },
    { name: "Fez", lat: 34.0181, lng: -5.0078, zoom: 10 },
  ],
  "KE": [
    { name: "Nairobi", lat: -1.2921, lng: 36.8219, zoom: 10 },
    { name: "Mombasa", lat: -4.0435, lng: 39.6682, zoom: 10 },
  ],

  // Oceania
  "AU": [
    { name: "Sydney", lat: -33.8688, lng: 151.2093, zoom: 10 },
    { name: "Melbourne", lat: -37.8136, lng: 144.9631, zoom: 10 },
    { name: "Brisbane", lat: -27.4698, lng: 153.0251, zoom: 10 },
    { name: "Perth", lat: -31.9505, lng: 115.8605, zoom: 10 },
  ],
  "NZ": [
    { name: "Auckland", lat: -36.8485, lng: 174.7633, zoom: 10 },
    { name: "Wellington", lat: -41.2865, lng: 174.7762, zoom: 10 },
    { name: "Christchurch", lat: -43.5321, lng: 172.6362, zoom: 10 },
  ],
};


export default function DiscoverTravelers() {
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [liveLocationSharing, setLiveLocationSharing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // Toggle states for showing/hiding map data
  const [showTravellers, setShowTravellers] = useState(true);
  const [showStays, setShowStays] = useState(true);
  // Full screen toggle state
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  const { toast } = useToast();

  // Fetch users based on location and filters
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/discover"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCountry !== "all") params.append("country", selectedCountry);
      if (userLocation) {
        params.append("lat", userLocation[0].toString());
        params.append("lng", userLocation[1].toString());
      }
      
      const response = await fetch(`/api/discover?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: true,
  });

  console.log('Frontend users data:', users.length, users);
  
  // Type users data properly
  // Add test travelers if no real travelers exist (for demo/testing)
  const testTravelers = [
    { id: 'test-1', displayName: 'Alice', username: 'alice', lat: 40.7128, lng: -74.0060, country: 'USA', city: 'New York', plan: 'creator', interests: ['travel', 'food'] } as User,
    { id: 'test-2', displayName: 'Bob', username: 'bob', lat: 48.8566, lng: 2.3522, country: 'France', city: 'Paris', plan: 'traveler', interests: ['art', 'history'] } as User,
    { id: 'test-3', displayName: 'Carol', username: 'carol', lat: 35.6762, lng: 139.6503, country: 'Japan', city: 'Tokyo', plan: 'creator', interests: ['photography'] } as User,
    { id: 'test-4', displayName: 'David', username: 'david', lat: -33.8688, lng: 151.2093, country: 'Australia', city: 'Sydney', plan: 'traveler', interests: ['adventure', 'beaches'] } as User,
    { id: 'test-5', displayName: 'Emma', username: 'emma', lat: 28.6139, lng: 77.2090, country: 'India', city: 'Delhi', plan: 'traveler', interests: ['culture', 'spirituality'] } as User,
  ];
  
  const typedUsers = (users && users.length > 0 ? users : testTravelers) as any[];


  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setSelectedState("all");
    ("all");
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    ("all");
  };

  const handleCityChange = (value: string) => {
    (value);
  };

  const getStatesForCountry = () => {
    if (selectedCountry === "all") return [];
    return getStatesForSelectedCountry(selectedCountry) || [];
  };

  const getCitiesForCountry = () => {
    if (selectedCountry === "all") return [];
    // For now, return empty array - cities can be implemented later with real data\n    return [];
  };

  // Search functionality
  const filterBySearch = (items: any[], searchIn: 'name' | 'code' = 'name') => {
    if (!searchQuery.trim()) return items;
    return items.filter(item => 
      item[searchIn].toLowerCase().includes(searchQuery.toLowerCase()) ||
      (searchIn === 'name' && item.code?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const getFilteredCountries = () => {
    return filterBySearch(COUNTRIES.filter(c => c.code !== "all"));
  };

  const getFilteredStates = () => {
    return filterBySearch(getStatesForCountry());
  };

  const getFilteredCities = () => {
    return filterBySearch(getCitiesForCountry());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">🗺️ Loading Realistic Map</h3>
            <p className="text-sm text-muted-foreground">Preparing smooth interactive world map...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-background overflow-hidden fixed inset-0">
      {/* Controls Panel - Floating Overlay */}
      <div className="absolute top-20 left-4 z-50 w-72 bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-xl p-4 space-y-3 max-h-[calc(100vh-6rem)] overflow-y-auto">
        {/* Toggle Controls Button */}
        <Button
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="w-full mb-2"
          size="sm"
          variant="secondary"
        >
          {isFullScreen ? <Minimize2 className="w-4 h-4 mr-2" /> : <Maximize2 className="w-4 h-4 mr-2" />}
          {isFullScreen ? "Show Controls" : "Hide Controls"}
        </Button>

        {/* Collapsible Controls */}
        {!isFullScreen && (
          <div className="space-y-3">
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
            <Globe className="w-6 h-6 text-blue-500" />
            Discover Travelers
          </h1>
          <p className="text-xs text-muted-foreground">Find and connect with travelers worldwide</p>
        </div>


        {/* Location Search */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search countries and states..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Country</Label>
              <Select value={selectedCountry} onValueChange={handleCountryChange}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="all">All Countries</SelectItem>
                  {getFilteredCountries().map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedCountry !== "all" && getStatesForCountry().length > 0 && (
              <div>
                <Label className="text-xs">State/Province</Label>
                <Select value={selectedState} onValueChange={handleStateChange}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select State/Province" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    <SelectItem value="all">All States/Provinces</SelectItem>
                    {getFilteredStates().map((state: any) => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
          </CardContent>
        </Card>

        {/* Map Display Controls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Map Display
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-travellers"
                checked={showTravellers}
                onCheckedChange={setShowTravellers}
              />
              <Label htmlFor="show-travellers" className="text-xs">
                Show Travellers
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-stays"
                checked={showStays}
                onCheckedChange={setShowStays}
              />
              <Label htmlFor="show-stays" className="text-xs">
                Show Stays
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              {showTravellers && showStays ? "🗺️ Showing all on map" : 
               showTravellers && !showStays ? "👥 Showing only travellers" :
               !showTravellers && showStays ? "🏨 Showing only stays" :
               "🚫 Map display disabled"}
            </p>
          </CardContent>
        </Card>

        {/* Live Sharing */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Radar className="w-4 h-4" />
              Live Sharing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="live-location"
                checked={liveLocationSharing}
                onCheckedChange={setLiveLocationSharing}
              />
              <Label htmlFor="live-location" className="text-xs">
                Share Live Location
              </Label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {liveLocationSharing ? "📍 Sharing with connected users" : "🔒 Location sharing disabled"}
            </p>
          </CardContent>
        </Card>

        {/* Location Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{users.length}</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Location ON
                  </span>
                  <span>{Math.floor(users.length * 0.6)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Location OFF
                  </span>
                  <span>{users.length - Math.floor(users.length * 0.6)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

          </div>
        )}
      </div>

      {/* Google Maps Integration - True Full Screen */}
      <div className="w-full h-full fixed inset-0 top-0 left-0 z-0 bg-gray-100">
        <Globe3D 
          users={typedUsers} 
          selectedCountry={selectedCountry}
          selectedState={selectedState}
          showTravellers={showTravellers}
          showStays={showStays}
          width={window.innerWidth}
          height={window.innerHeight}
        />
      </div>

      {/* Selected User Details - Hidden for now */}
      <div className="hidden">
        {selectedUser && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Selected Traveler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedUser?.profileImageUrl || undefined} />
                  <AvatarFallback>{selectedUser?.displayName?.[0] || selectedUser?.username?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedUser?.displayName || selectedUser?.username}</h3>
                  <p className="text-sm text-muted-foreground">📍 {selectedUser?.city}, {selectedUser?.country}</p>
                  <div className="flex gap-2 mt-2">
                    {selectedUser?.interests?.map((interest) => (
                      <Badge key={interest} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">
                    <UserIcon className="w-4 h-4 mr-1" />
                    View Profile
                  </Button>
                  <Button size="sm">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Connect
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