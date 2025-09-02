import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Globe, Radar, User as UserIcon, MessageCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Globe3D from "@/components/Globe3D";
import type { User } from "@shared/schema";

// Define comprehensive world countries and cities
const COUNTRIES = [
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
];

const CITIES = {
  // Europe
  "GB": [
    { name: "London", lat: 51.5074, lng: -0.1278, zoom: 10 },
    { name: "Manchester", lat: 53.4808, lng: -2.2426, zoom: 10 },
    { name: "Birmingham", lat: 52.4862, lng: -1.8904, zoom: 10 },
    { name: "Edinburgh", lat: 55.9533, lng: -3.1883, zoom: 10 },
    { name: "Liverpool", lat: 53.4084, lng: -2.9916, zoom: 10 },
    { name: "Bristol", lat: 51.4545, lng: -2.5879, zoom: 10 },
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
    { name: "New York", lat: 40.7128, lng: -74.0060, zoom: 10 },
    { name: "Los Angeles", lat: 34.0522, lng: -118.2437, zoom: 10 },
    { name: "Chicago", lat: 41.8781, lng: -87.6298, zoom: 10 },
    { name: "San Francisco", lat: 37.7749, lng: -122.4194, zoom: 10 },
    { name: "Miami", lat: 25.7617, lng: -80.1918, zoom: 10 },
    { name: "Las Vegas", lat: 36.1699, lng: -115.1398, zoom: 10 },
    { name: "Seattle", lat: 47.6062, lng: -122.3321, zoom: 10 },
    { name: "Boston", lat: 42.3601, lng: -71.0589, zoom: 10 },
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
  const [selectedCity, setSelectedCity] = useState("all");
  const [liveLocationSharing, setLiveLocationSharing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  const { toast } = useToast();

  // Fetch users based on location and filters
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/discover"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCountry !== "all") params.append("country", selectedCountry);
      if (selectedCity !== "all") params.append("city", selectedCity);
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
  const typedUsers = users as any[];


  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setSelectedCity("all");
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
  };

  const getCitiesForCountry = () => {
    if (selectedCountry === "all") return [];
    return CITIES[selectedCountry as keyof typeof CITIES] || [];
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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar with Controls */}
      <div className="w-80 bg-card border-r border-border p-4 space-y-4 overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
            <Globe className="w-6 h-6 text-blue-500" />
            Discover Travelers
          </h1>
          <p className="text-xs text-muted-foreground">Find and connect with travelers worldwide</p>
        </div>

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
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs">City</Label>
              <Select value={selectedCity} onValueChange={handleCityChange} disabled={selectedCountry === "all"}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="all">All Cities</SelectItem>
                  {getCitiesForCountry().map((city: any) => (
                    <SelectItem key={city.name} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

        {/* Travelers Found */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Travelers Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{users.length}</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Travelers
                  </span>
                  <span>{users.filter((u: any) => u.plan === 'traveler').length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Creators
                  </span>
                  <span>{users.filter((u: any) => u.plan === 'creator').length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Countries</span>
                <Badge variant="secondary">{COUNTRIES.length - 1}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Cities</span>
                <Badge variant="secondary">
                  {Object.values(CITIES).reduce((acc, cities) => acc + cities.length, 0)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Online</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {Math.floor(users.length * 0.7)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Google Maps Integration */}
      <div className="flex-1 relative bg-background overflow-hidden">
        <Globe3D 
          users={typedUsers} 
          selectedCountry={selectedCountry}
          selectedCity={selectedCity}
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