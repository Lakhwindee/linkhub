// Location utilities for real-world data with map coordinates
import { worldCountries, statesByCountry, getCitiesForState } from "@/data/locationData";

// Country coordinates for map display (major countries with approximate center coordinates)
const countryCoordinates: Record<string, { lat: number; lng: number; zoom: number }> = {
  // Major countries with coordinates
  "United States": { lat: 39.8283, lng: -98.5795, zoom: 4 },
  "Canada": { lat: 56.1304, lng: -106.3468, zoom: 4 },
  "United Kingdom": { lat: 54.7753, lng: -2.3508, zoom: 6 },
  "France": { lat: 46.6034, lng: 1.8883, zoom: 6 },
  "Germany": { lat: 51.1657, lng: 10.4515, zoom: 6 },
  "Italy": { lat: 41.8719, lng: 12.5674, zoom: 6 },
  "Spain": { lat: 40.4637, lng: -3.7492, zoom: 6 },
  "Netherlands": { lat: 52.1326, lng: 5.2913, zoom: 7 },
  "Switzerland": { lat: 46.8182, lng: 8.2275, zoom: 7 },
  "Austria": { lat: 47.5162, lng: 14.5501, zoom: 7 },
  "Belgium": { lat: 50.8503, lng: 4.3517, zoom: 7 },
  "Sweden": { lat: 60.1282, lng: 18.6435, zoom: 5 },
  "Norway": { lat: 60.4720, lng: 8.4689, zoom: 5 },
  "Denmark": { lat: 56.2639, lng: 9.5018, zoom: 7 },
  "Finland": { lat: 61.9241, lng: 25.7482, zoom: 5 },
  "Poland": { lat: 51.9194, lng: 19.1451, zoom: 6 },
  "Czech Republic": { lat: 49.8175, lng: 15.4730, zoom: 7 },
  "Portugal": { lat: 39.3999, lng: -8.2245, zoom: 7 },
  "Greece": { lat: 39.0742, lng: 21.8243, zoom: 6 },
  "Russia": { lat: 61.5240, lng: 105.3188, zoom: 3 },
  "India": { lat: 20.5937, lng: 78.9629, zoom: 5 },
  "China": { lat: 35.8617, lng: 104.1954, zoom: 4 },
  "Japan": { lat: 36.2048, lng: 138.2529, zoom: 6 },
  "South Korea": { lat: 35.9078, lng: 127.7669, zoom: 7 },
  "Thailand": { lat: 15.8700, lng: 100.9925, zoom: 6 },
  "Vietnam": { lat: 14.0583, lng: 108.2772, zoom: 6 },
  "Singapore": { lat: 1.3521, lng: 103.8198, zoom: 11 },
  "Malaysia": { lat: 4.2105, lng: 101.9758, zoom: 6 },
  "Indonesia": { lat: -0.7893, lng: 113.9213, zoom: 5 },
  "Philippines": { lat: 12.8797, lng: 121.7740, zoom: 6 },
  "Pakistan": { lat: 30.3753, lng: 69.3451, zoom: 6 },
  "Bangladesh": { lat: 23.6850, lng: 90.3563, zoom: 7 },
  "Sri Lanka": { lat: 7.8731, lng: 80.7718, zoom: 8 },
  "Iran": { lat: 32.4279, lng: 53.6880, zoom: 6 },
  "Turkey": { lat: 38.9637, lng: 35.2433, zoom: 6 },
  "Israel": { lat: 31.0461, lng: 34.8516, zoom: 8 },
  "United Arab Emirates": { lat: 23.4241, lng: 53.8478, zoom: 7 },
  "Saudi Arabia": { lat: 23.8859, lng: 45.0792, zoom: 6 },
  "Brazil": { lat: -14.2350, lng: -51.9253, zoom: 4 },
  "Argentina": { lat: -38.4161, lng: -63.6167, zoom: 4 },
  "Chile": { lat: -35.6751, lng: -71.5430, zoom: 4 },
  "Colombia": { lat: 4.5709, lng: -74.2973, zoom: 6 },
  "Peru": { lat: -9.1900, lng: -75.0152, zoom: 6 },
  "Venezuela": { lat: 6.4238, lng: -66.5897, zoom: 6 },
  "Mexico": { lat: 23.6345, lng: -102.5528, zoom: 5 },
  "South Africa": { lat: -30.5595, lng: 22.9375, zoom: 6 },
  "Egypt": { lat: 26.0975, lng: 30.0444, zoom: 6 },
  "Nigeria": { lat: 9.0820, lng: 8.6753, zoom: 6 },
  "Kenya": { lat: -0.0236, lng: 37.9062, zoom: 7 },
  "Morocco": { lat: 31.7917, lng: -7.0926, zoom: 6 },
  "Ghana": { lat: 7.9465, lng: -1.0232, zoom: 7 },
  "Australia": { lat: -25.2744, lng: 133.7751, zoom: 5 },
  "New Zealand": { lat: -40.9006, lng: 174.8860, zoom: 6 },
};

// Default coordinates for countries not in the mapping
const defaultCoordinates = { lat: 20, lng: 0, zoom: 4 };

// Generate countries for map display with coordinates
export const getCountriesForMap = () => {
  const allCountryOption = { 
    code: "all", 
    name: "All Countries", 
    lat: 20, 
    lng: 0, 
    zoom: 2 
  };

  const mappedCountries = worldCountries.map((country, index) => {
    const coords = countryCoordinates[country.name] || defaultCoordinates;
    return {
      code: `country-${index}`,
      name: country.name,
      lat: coords.lat,
      lng: coords.lng,
      zoom: coords.zoom,
      flag: country.flag
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  return [allCountryOption, ...mappedCountries];
};

// Get states for a specific country
export const getStatesForCountry = (countryName: string) => {
  const states = statesByCountry[countryName] || [];
  return states.map((state: string, index: number) => ({
    code: `state-${index}`,
    name: state,
    lat: 0, // Default coordinates - can be enhanced later
    lng: 0,
    zoom: 7
  }));
};

// Get cities for a specific state in a country
export const getCitiesForCountryState = (countryName: string, stateName: string) => {
  const cities = getCitiesForState(countryName, stateName) || [];
  return cities.map((city: string, index: number) => ({
    code: `city-${index}`,
    name: city,
    lat: 0, // Default coordinates - can be enhanced later
    lng: 0,
    zoom: 9
  }));
};

// Generate comprehensive location data for any component
export const getLocationData = () => ({
  countries: getCountriesForMap(),
  getStates: getStatesForCountry,
  getCities: getCitiesForCountryState
});