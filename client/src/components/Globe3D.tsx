import { useRef, useEffect, useState } from 'react';
import type { User } from '@shared/schema';

// Google Maps type definitions
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface Globe3DProps {
  users: User[];
  width?: number;
  height?: number;
  onUserClick?: (user: User) => void;
  selectedCountry?: string;
  selectedCity?: string;
}

export default function Globe3D({ 
  users, 
  width = 800, 
  height = 600, 
  onUserClick,
  selectedCountry,
  selectedCity 
}: Globe3DProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        console.log('Google Maps already loaded');
        setIsGoogleMapsLoaded(true);
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      console.log('Loading Google Maps API with key:', apiKey ? 'API key found' : 'NO API KEY');
      
      if (!apiKey) {
        setError('Google Maps API key not configured.');
        setIsLoading(false);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&map_ids=DEMO_MAP_ID&libraries=geometry,places&callback=initMap`;
      script.async = true;
      script.defer = true;

      window.initMap = () => {
        console.log('Google Maps API loaded successfully');
        setIsGoogleMapsLoaded(true);
      };

      script.onerror = (error) => {
        console.error('Failed to load Google Maps API:', error);
        setError('Failed to load Google Maps API.');
        setIsLoading(false);
      };

      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize high-quality Google Maps with 3D satellite view
  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapRef.current || mapInstanceRef.current) return;
    
    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Initializing Google Maps with', users.length, 'users');
        
        // Create advanced Google Maps with satellite imagery
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 3,
          center: { lat: 20, lng: 0 },
          mapTypeId: 'hybrid', // High-quality satellite + labels
          
          // Zoom restrictions to prevent multiple maps
          minZoom: 2,
          maxZoom: 18,
          
          // Enable 3D features
          tilt: 0, // Start flat
          heading: 0,
          
          // Enhanced controls for better UX
          gestureHandling: 'greedy',
          zoomControl: true,
          mapTypeControl: true,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: true,
          fullscreenControl: true,
          
          // Map type options
          mapTypeControlOptions: {
            mapTypeIds: ['satellite', 'hybrid', 'terrain'],
            position: window.google.maps.ControlPosition.TOP_RIGHT
          },
          
          // Styling for premium look
          styles: [
            {
              featureType: 'all',
              elementType: 'geometry',
              stylers: [{ saturation: 10 }, { lightness: -5 }]
            },
            {
              featureType: 'water',
              elementType: 'geometry.fill',
              stylers: [{ color: '#0077be' }]
            }
          ],
          
          // Strict bounds to prevent multiple maps
          restriction: {
            latLngBounds: {
              north: 85,
              south: -85,
              west: -180,
              east: 180
            },
            strictBounds: true
          }
        });
        
        // Enable 3D tilt when zooming in
        map.addListener('zoom_changed', () => {
          const zoom = map.getZoom();
          if (zoom && zoom > 16) {
            map.setTilt(45); // 3D view for close zoom
          } else if (zoom && zoom > 12) {
            map.setTilt(20); // Slight tilt for medium zoom
          } else {
            map.setTilt(0); // Flat for world view
          }
        });
        
        mapInstanceRef.current = map;
        
        // Add premium user markers
        addPremiumMarkers(map);
        
        console.log('High-quality Google Maps initialized');
        setIsLoading(false);
        
      } catch (err) {
        console.error('Google Maps initialization error:', err);
        setError('Failed to load Google Maps');
        setIsLoading(false);
      }
    };
    
    initMap();
    
    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => {
        if (marker.setMap) marker.setMap(null);
      });
      markersRef.current = [];
    };
  }, [isGoogleMapsLoaded]);

  // Function to add premium-looking user markers
  const addPremiumMarkers = (map: any) => {
    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (marker.setMap) marker.setMap(null);
    });
    markersRef.current = [];

    users
      .filter(user => user.lat && user.lng && user.showOnMap)
      .forEach(user => {
        const color = user.plan === 'creator' ? '#10b981' : user.plan === 'traveler' ? '#3b82f6' : '#6b7280';
        const planIcon = user.plan === 'creator' ? '⭐' : user.plan === 'traveler' ? '✈️' : '👤';
        
        // Create simple but effective marker
        const marker = new window.google.maps.Marker({
          position: { lat: user.lat!, lng: user.lng! },
          map: map,
          title: `${user.displayName || user.username} - ${user.plan}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: color,
            fillOpacity: 0.8,
            strokeColor: 'white',
            strokeWeight: 3,
            scale: 12
          },
          animation: window.google.maps.Animation.DROP
        });

        // Enhanced info window with better styling
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="
              padding: 15px; 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              min-width: 250px;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border-radius: 12px;
              box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            ">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                <img src="${user.profileImageUrl}" style="
                  width: 50px; 
                  height: 50px; 
                  border-radius: 50%; 
                  object-fit: cover;
                  border: 3px solid ${color};
                " />
                <div>
                  <div style="font-weight: 700; font-size: 16px; color: #1e293b;">${user.displayName || user.username}</div>
                  <div style="
                    color: ${color}; 
                    font-size: 12px; 
                    font-weight: 600;
                    text-transform: uppercase;
                    background: ${color}20;
                    padding: 2px 8px;
                    border-radius: 20px;
                    display: inline-block;
                    margin-top: 4px;
                  ">${planIcon} ${user.plan}</div>
                </div>
              </div>
              <div style="
                background: white;
                padding: 10px;
                border-radius: 8px;
                border-left: 4px solid ${color};
                font-size: 13px;
                color: #475569;
              ">
                📍 ${user.city || 'Unknown'}, ${user.country || 'Unknown'}<br>
                ${user.bio ? `💭 ${user.bio.substring(0, 100)}...` : ''}
              </div>
            </div>
          `,
          pixelOffset: new window.google.maps.Size(0, -10)
        });

        // Click handler
        marker.addListener('click', () => {
          if (onUserClick) {
            onUserClick(user);
          }
          infoWindow.open(map, marker);
        });

        markersRef.current.push(marker);
      });
  };

  // Update markers when users change
  useEffect(() => {
    if (mapInstanceRef.current && !isLoading) {
      addPremiumMarkers(mapInstanceRef.current);
    }
  }, [users, isLoading]);

  // Handle country/city focus with smooth animations
  useEffect(() => {
    if (mapInstanceRef.current && !isLoading) {
      const map = mapInstanceRef.current;
      
      console.log('🔍 Auto-zoom triggered:', { selectedCountry, selectedCity });
      
      if (selectedCountry && selectedCountry !== 'all') {
        // Comprehensive country coordinates
        const countryCoords: Record<string, { lat: number, lng: number, zoom: number }> = {
          'GB': { lat: 54.7753, lng: -2.3508, zoom: 6 },
          'US': { lat: 39.8283, lng: -98.5795, zoom: 4 },
          'IN': { lat: 20.5937, lng: 78.9629, zoom: 5 },
          'FR': { lat: 46.6034, lng: 1.8883, zoom: 6 },
          'DE': { lat: 51.1657, lng: 10.4515, zoom: 6 },
          'IT': { lat: 41.8719, lng: 12.5674, zoom: 6 },
          'ES': { lat: 40.4637, lng: -3.7492, zoom: 6 },
          'CN': { lat: 35.8617, lng: 104.1954, zoom: 4 },
          'JP': { lat: 36.2048, lng: 138.2529, zoom: 6 },
          'BR': { lat: -14.2350, lng: -51.9253, zoom: 4 },
          'CA': { lat: 56.1304, lng: -106.3468, zoom: 4 },
          'AU': { lat: -25.2744, lng: 133.7751, zoom: 5 },
          'RU': { lat: 61.5240, lng: 105.3188, zoom: 3 },
          'MX': { lat: 23.6345, lng: -102.5528, zoom: 5 },
          'AR': { lat: -38.4161, lng: -63.6167, zoom: 4 },
          'ZA': { lat: -30.5595, lng: 22.9375, zoom: 6 },
          'EG': { lat: 26.0975, lng: 30.0444, zoom: 6 },
          'TH': { lat: 15.8700, lng: 100.9925, zoom: 6 },
          'TR': { lat: 38.9637, lng: 35.2433, zoom: 6 },
          'KR': { lat: 35.9078, lng: 127.7669, zoom: 7 },
          'SG': { lat: 1.3521, lng: 103.8198, zoom: 11 },
          'MY': { lat: 4.2105, lng: 101.9758, zoom: 6 },
          'ID': { lat: -0.7893, lng: 113.9213, zoom: 5 },
          'PH': { lat: 12.8797, lng: 121.7740, zoom: 6 },
          'VN': { lat: 14.0583, lng: 108.2772, zoom: 6 },
          'NL': { lat: 52.1326, lng: 5.2913, zoom: 7 },
          'CH': { lat: 46.8182, lng: 8.2275, zoom: 7 },
          'AT': { lat: 47.5162, lng: 14.5501, zoom: 7 },
          'BE': { lat: 50.8503, lng: 4.3517, zoom: 7 },
          'SE': { lat: 60.1282, lng: 18.6435, zoom: 5 },
          'NO': { lat: 60.4720, lng: 8.4689, zoom: 5 },
          'DK': { lat: 56.2639, lng: 9.5018, zoom: 7 },
          'FI': { lat: 61.9241, lng: 25.7482, zoom: 5 },
          'PL': { lat: 51.9194, lng: 19.1451, zoom: 6 },
          'CZ': { lat: 49.8175, lng: 15.4730, zoom: 7 },
          'PT': { lat: 39.3999, lng: -8.2245, zoom: 7 },
          'GR': { lat: 39.0742, lng: 21.8243, zoom: 6 },
          'AE': { lat: 23.4241, lng: 53.8478, zoom: 7 },
          'SA': { lat: 23.8859, lng: 45.0792, zoom: 6 },
          'IL': { lat: 31.0461, lng: 34.8516, zoom: 8 },
          'PK': { lat: 30.3753, lng: 69.3451, zoom: 6 },
          'BD': { lat: 23.6850, lng: 90.3563, zoom: 7 },
          'LK': { lat: 7.8731, lng: 80.7718, zoom: 8 },
          'IR': { lat: 32.4279, lng: 53.6880, zoom: 6 },
          'CL': { lat: -35.6751, lng: -71.5430, zoom: 4 },
          'CO': { lat: 4.5709, lng: -74.2973, zoom: 6 },
          'PE': { lat: -9.1900, lng: -75.0152, zoom: 6 },
          'VE': { lat: 6.4238, lng: -66.5897, zoom: 6 },
          'NG': { lat: 9.0820, lng: 8.6753, zoom: 6 },
          'KE': { lat: -0.0236, lng: 37.9062, zoom: 7 },
          'MA': { lat: 31.7917, lng: -7.0926, zoom: 6 },
          'GH': { lat: 7.9465, lng: -1.0232, zoom: 7 },
          'NZ': { lat: -40.9006, lng: 174.8860, zoom: 6 }
        };
        
        // Comprehensive city coordinates for zoom functionality matching DiscoverTravelers CITIES data
        const cityCoords: Record<string, Record<string, { lat: number, lng: number, zoom: number }>> = {
          'GB': {
            'London': { lat: 51.5074, lng: -0.1278, zoom: 13 },
            'Manchester': { lat: 53.4808, lng: -2.2426, zoom: 13 },
            'Birmingham': { lat: 52.4862, lng: -1.8904, zoom: 13 },
            'Edinburgh': { lat: 55.9533, lng: -3.1883, zoom: 13 },
            'Liverpool': { lat: 53.4084, lng: -2.9916, zoom: 13 },
            'Bristol': { lat: 51.4545, lng: -2.5879, zoom: 13 },
            'Leeds': { lat: 53.8008, lng: -1.5491, zoom: 13 },
            'Sheffield': { lat: 53.3811, lng: -1.4701, zoom: 13 },
            'Newcastle': { lat: 54.9783, lng: -1.6178, zoom: 13 },
            'Cardiff': { lat: 51.4816, lng: -3.1791, zoom: 13 },
            'Glasgow': { lat: 55.8642, lng: -4.2518, zoom: 13 },
            'Brighton': { lat: 50.8225, lng: -0.1372, zoom: 13 },
            'Nottingham': { lat: 52.9548, lng: -1.1581, zoom: 13 },
            'Oxford': { lat: 51.7520, lng: -1.2577, zoom: 13 },
            'Cambridge': { lat: 52.2053, lng: 0.1218, zoom: 13 }
          },
          'US': {
            'New York': { lat: 40.7128, lng: -74.0060, zoom: 13 },
            'Los Angeles': { lat: 34.0522, lng: -118.2437, zoom: 13 },
            'Chicago': { lat: 41.8781, lng: -87.6298, zoom: 13 },
            'San Francisco': { lat: 37.7749, lng: -122.4194, zoom: 13 },
            'Miami': { lat: 25.7617, lng: -80.1918, zoom: 13 },
            'Las Vegas': { lat: 36.1699, lng: -115.1398, zoom: 13 },
            'Seattle': { lat: 47.6062, lng: -122.3321, zoom: 13 },
            'Boston': { lat: 42.3601, lng: -71.0589, zoom: 13 },
            'Houston': { lat: 29.7604, lng: -95.3698, zoom: 13 },
            'Phoenix': { lat: 33.4484, lng: -112.0740, zoom: 13 },
            'Philadelphia': { lat: 39.9526, lng: -75.1652, zoom: 13 },
            'San Antonio': { lat: 29.4241, lng: -98.4936, zoom: 13 },
            'San Diego': { lat: 32.7157, lng: -117.1611, zoom: 13 },
            'Dallas': { lat: 32.7767, lng: -96.7970, zoom: 13 },
            'San Jose': { lat: 37.3382, lng: -121.8863, zoom: 13 },
            'Austin': { lat: 30.2672, lng: -97.7431, zoom: 13 },
            'Denver': { lat: 39.7392, lng: -104.9903, zoom: 13 },
            'Washington DC': { lat: 38.9072, lng: -77.0369, zoom: 13 },
            'Nashville': { lat: 36.1627, lng: -86.7816, zoom: 13 },
            'Portland': { lat: 45.5152, lng: -122.6784, zoom: 13 }
          },
          'IN': {
            'Mumbai': { lat: 19.0760, lng: 72.8777, zoom: 13 },
            'Delhi': { lat: 28.7041, lng: 77.1025, zoom: 13 },
            'Bangalore': { lat: 12.9716, lng: 77.5946, zoom: 13 },
            'Chennai': { lat: 13.0827, lng: 80.2707, zoom: 13 },
            'Kolkata': { lat: 22.5726, lng: 88.3639, zoom: 13 },
            'Hyderabad': { lat: 17.3850, lng: 78.4867, zoom: 13 },
            'Pune': { lat: 18.5204, lng: 73.8567, zoom: 13 },
            'Ahmedabad': { lat: 23.0225, lng: 72.5714, zoom: 13 },
            'Jaipur': { lat: 26.9124, lng: 75.7873, zoom: 13 },
            'Lucknow': { lat: 26.8467, lng: 80.9462, zoom: 13 },
            'Kanpur': { lat: 26.4499, lng: 80.3319, zoom: 13 },
            'Nagpur': { lat: 21.1458, lng: 79.0882, zoom: 13 },
            'Indore': { lat: 22.7196, lng: 75.8577, zoom: 13 },
            'Bhopal': { lat: 23.2599, lng: 77.4126, zoom: 13 },
            'Visakhapatnam': { lat: 17.6868, lng: 83.2185, zoom: 13 },
            'Patna': { lat: 25.5941, lng: 85.1376, zoom: 13 },
            'Vadodara': { lat: 22.3072, lng: 73.1812, zoom: 13 },
            'Ludhiana': { lat: 30.9000, lng: 75.8573, zoom: 13 }
          },
          'FR': {
            'Paris': { lat: 48.8566, lng: 2.3522, zoom: 13 },
            'Lyon': { lat: 45.7640, lng: 4.8357, zoom: 13 },
            'Marseille': { lat: 43.2965, lng: 5.3698, zoom: 13 },
            'Nice': { lat: 43.7102, lng: 7.2620, zoom: 13 },
            'Toulouse': { lat: 43.6047, lng: 1.4442, zoom: 13 },
            'Nantes': { lat: 47.2184, lng: -1.5536, zoom: 13 },
            'Montpellier': { lat: 43.6119, lng: 3.8772, zoom: 13 },
            'Strasbourg': { lat: 48.5734, lng: 7.7521, zoom: 13 },
            'Bordeaux': { lat: 44.8378, lng: -0.5792, zoom: 13 },
            'Lille': { lat: 50.6292, lng: 3.0573, zoom: 13 }
          },
          'DE': {
            'Berlin': { lat: 52.5200, lng: 13.4050, zoom: 13 },
            'Munich': { lat: 48.1351, lng: 11.5820, zoom: 13 },
            'Hamburg': { lat: 53.5511, lng: 9.9937, zoom: 13 },
            'Frankfurt': { lat: 50.1109, lng: 8.6821, zoom: 13 },
            'Cologne': { lat: 50.9375, lng: 6.9603, zoom: 13 },
            'Stuttgart': { lat: 48.7758, lng: 9.1829, zoom: 13 },
            'Dusseldorf': { lat: 51.2277, lng: 6.7735, zoom: 13 },
            'Leipzig': { lat: 51.3397, lng: 12.3731, zoom: 13 },
            'Dortmund': { lat: 51.5136, lng: 7.4653, zoom: 13 },
            'Essen': { lat: 51.4556, lng: 7.0116, zoom: 13 },
            'Bremen': { lat: 53.0793, lng: 8.8017, zoom: 13 },
            'Dresden': { lat: 51.0504, lng: 13.7373, zoom: 13 },
            'Hanover': { lat: 52.3759, lng: 9.7320, zoom: 13 },
            'Nuremberg': { lat: 49.4521, lng: 11.0767, zoom: 13 },
            'Duisburg': { lat: 51.4344, lng: 6.7623, zoom: 13 }
          },
          'JP': {
            'Tokyo': { lat: 35.6762, lng: 139.6503, zoom: 13 },
            'Osaka': { lat: 34.6937, lng: 135.5023, zoom: 13 },
            'Kyoto': { lat: 35.0116, lng: 135.7681, zoom: 13 },
            'Nagoya': { lat: 35.1815, lng: 136.9066, zoom: 13 },
            'Yokohama': { lat: 35.4438, lng: 139.6380, zoom: 13 },
            'Sapporo': { lat: 43.0642, lng: 141.3469, zoom: 13 },
            'Fukuoka': { lat: 33.5904, lng: 130.4017, zoom: 13 },
            'Kobe': { lat: 34.6901, lng: 135.1956, zoom: 13 },
            'Kawasaki': { lat: 35.5308, lng: 139.7029, zoom: 13 },
            'Sendai': { lat: 38.2682, lng: 140.8694, zoom: 13 },
            'Hiroshima': { lat: 34.3853, lng: 132.4553, zoom: 13 },
            'Kitakyushu': { lat: 33.8834, lng: 130.8751, zoom: 13 },
            'Chiba': { lat: 35.6074, lng: 140.1065, zoom: 13 },
            'Sakai': { lat: 34.5732, lng: 135.4827, zoom: 13 },
            'Niigata': { lat: 37.9022, lng: 139.0232, zoom: 13 }
          },
          'ES': {
            'Madrid': { lat: 40.4168, lng: -3.7038, zoom: 13 },
            'Barcelona': { lat: 41.3851, lng: 2.1734, zoom: 13 },
            'Valencia': { lat: 39.4699, lng: -0.3763, zoom: 13 },
            'Seville': { lat: 37.3886, lng: -5.9823, zoom: 13 },
            'Zaragoza': { lat: 41.6488, lng: -0.8891, zoom: 13 },
            'Málaga': { lat: 36.7213, lng: -4.4214, zoom: 13 },
            'Murcia': { lat: 37.9922, lng: -1.1307, zoom: 13 },
            'Palma': { lat: 39.5696, lng: 2.6502, zoom: 13 },
            'Las Palmas': { lat: 28.1248, lng: -15.4300, zoom: 13 },
            'Bilbao': { lat: 43.2627, lng: -2.9253, zoom: 13 }
          },
          'IT': {
            'Rome': { lat: 41.9028, lng: 12.4964, zoom: 13 },
            'Milan': { lat: 45.4642, lng: 9.1900, zoom: 13 },
            'Naples': { lat: 40.8518, lng: 14.2681, zoom: 13 },
            'Turin': { lat: 45.0703, lng: 7.6869, zoom: 13 },
            'Palermo': { lat: 38.1157, lng: 13.3613, zoom: 13 },
            'Genoa': { lat: 44.4056, lng: 8.9463, zoom: 13 },
            'Bologna': { lat: 44.4949, lng: 11.3426, zoom: 13 },
            'Florence': { lat: 43.7696, lng: 11.2558, zoom: 13 },
            'Bari': { lat: 41.1171, lng: 16.8719, zoom: 13 },
            'Catania': { lat: 37.5079, lng: 15.0830, zoom: 13 }
          },
          'CA': {
            'Toronto': { lat: 43.6532, lng: -79.3832, zoom: 13 },
            'Vancouver': { lat: 49.2827, lng: -123.1207, zoom: 13 },
            'Montreal': { lat: 45.5017, lng: -73.5673, zoom: 13 },
            'Calgary': { lat: 51.0447, lng: -114.0719, zoom: 13 },
            'Edmonton': { lat: 53.5461, lng: -113.4938, zoom: 13 },
            'Ottawa': { lat: 45.4215, lng: -75.6972, zoom: 13 },
            'Winnipeg': { lat: 49.8951, lng: -97.1384, zoom: 13 },
            'Quebec City': { lat: 46.8139, lng: -71.2080, zoom: 13 },
            'Hamilton': { lat: 43.2557, lng: -79.8711, zoom: 13 },
            'Kitchener': { lat: 43.4516, lng: -80.4925, zoom: 13 }
          },
          'AU': {
            'Sydney': { lat: -33.8688, lng: 151.2093, zoom: 13 },
            'Melbourne': { lat: -37.8136, lng: 144.9631, zoom: 13 },
            'Brisbane': { lat: -27.4698, lng: 153.0251, zoom: 13 },
            'Perth': { lat: -31.9505, lng: 115.8605, zoom: 13 },
            'Adelaide': { lat: -34.9285, lng: 138.6007, zoom: 13 },
            'Gold Coast': { lat: -28.0167, lng: 153.4000, zoom: 13 },
            'Newcastle': { lat: -32.9283, lng: 151.7817, zoom: 13 },
            'Canberra': { lat: -35.2809, lng: 149.1300, zoom: 13 },
            'Sunshine Coast': { lat: -26.6500, lng: 153.0667, zoom: 13 },
            'Wollongong': { lat: -34.4278, lng: 150.8931, zoom: 13 }
          },
          'BR': {
            'São Paulo': { lat: -23.5505, lng: -46.6333, zoom: 13 },
            'Rio de Janeiro': { lat: -22.9068, lng: -43.1729, zoom: 13 },
            'Brasília': { lat: -15.7975, lng: -47.8919, zoom: 13 },
            'Salvador': { lat: -12.9714, lng: -38.5014, zoom: 13 },
            'Fortaleza': { lat: -3.7172, lng: -38.5434, zoom: 13 },
            'Belo Horizonte': { lat: -19.9191, lng: -43.9386, zoom: 13 },
            'Manaus': { lat: -3.1190, lng: -60.0217, zoom: 13 },
            'Curitiba': { lat: -25.4244, lng: -49.2654, zoom: 13 },
            'Recife': { lat: -8.0476, lng: -34.8770, zoom: 13 },
            'Porto Alegre': { lat: -30.0346, lng: -51.2177, zoom: 13 }
          },
          'MX': {
            'Mexico City': { lat: 19.4326, lng: -99.1332, zoom: 13 },
            'Guadalajara': { lat: 20.6597, lng: -103.3496, zoom: 13 },
            'Monterrey': { lat: 25.6866, lng: -100.3161, zoom: 13 },
            'Puebla': { lat: 19.0413, lng: -98.2062, zoom: 13 },
            'Tijuana': { lat: 32.5149, lng: -117.0382, zoom: 13 },
            'León': { lat: 21.1619, lng: -101.6921, zoom: 13 },
            'Juárez': { lat: 31.6904, lng: -106.4245, zoom: 13 },
            'Zapopan': { lat: 20.7221, lng: -103.3631, zoom: 13 },
            'Nezahualcóyotl': { lat: 19.4007, lng: -99.0146, zoom: 13 },
            'Chihuahua': { lat: 28.6353, lng: -106.0889, zoom: 13 }
          },
          'CN': {
            'Beijing': { lat: 39.9042, lng: 116.4074, zoom: 13 },
            'Shanghai': { lat: 31.2304, lng: 121.4737, zoom: 13 },
            'Guangzhou': { lat: 23.1291, lng: 113.2644, zoom: 13 },
            'Shenzhen': { lat: 22.5431, lng: 114.0579, zoom: 13 },
            'Chongqing': { lat: 29.5630, lng: 106.5516, zoom: 13 },
            'Tianjin': { lat: 39.3434, lng: 117.3616, zoom: 13 },
            'Wuhan': { lat: 30.5928, lng: 114.3055, zoom: 13 },
            'Xi\'an': { lat: 34.3416, lng: 108.9398, zoom: 13 },
            'Hangzhou': { lat: 30.2741, lng: 120.1551, zoom: 13 },
            'Chengdu': { lat: 30.5728, lng: 104.0668, zoom: 13 }
          },
          'RU': {
            'Moscow': { lat: 55.7558, lng: 37.6176, zoom: 13 },
            'Saint Petersburg': { lat: 59.9311, lng: 30.3609, zoom: 13 },
            'Novosibirsk': { lat: 55.0084, lng: 82.9357, zoom: 13 },
            'Yekaterinburg': { lat: 56.8431, lng: 60.6454, zoom: 13 },
            'Nizhny Novgorod': { lat: 56.2965, lng: 43.9361, zoom: 13 },
            'Kazan': { lat: 55.8304, lng: 49.0661, zoom: 13 },
            'Chelyabinsk': { lat: 55.1644, lng: 61.4368, zoom: 13 },
            'Omsk': { lat: 54.9885, lng: 73.3242, zoom: 13 },
            'Samara': { lat: 53.2001, lng: 50.1500, zoom: 13 },
            'Rostov-on-Don': { lat: 47.2357, lng: 39.7015, zoom: 13 }
          },
          'KR': {
            'Seoul': { lat: 37.5665, lng: 126.9780, zoom: 13 },
            'Busan': { lat: 35.1796, lng: 129.0756, zoom: 13 },
            'Incheon': { lat: 37.4563, lng: 126.7052, zoom: 13 },
            'Daegu': { lat: 35.8714, lng: 128.6014, zoom: 13 },
            'Daejeon': { lat: 36.3504, lng: 127.3845, zoom: 13 },
            'Gwangju': { lat: 35.1595, lng: 126.8526, zoom: 13 },
            'Suwon': { lat: 37.2636, lng: 127.0286, zoom: 13 },
            'Ulsan': { lat: 35.5384, lng: 129.3114, zoom: 13 },
            'Changwon': { lat: 35.2281, lng: 128.6811, zoom: 13 },
            'Goyang': { lat: 37.6564, lng: 126.8349, zoom: 13 }
          },
          'TH': {
            'Bangkok': { lat: 13.7563, lng: 100.5018, zoom: 13 },
            'Chiang Mai': { lat: 18.7883, lng: 98.9853, zoom: 13 },
            'Pattaya': { lat: 12.9236, lng: 100.8825, zoom: 13 },
            'Phuket': { lat: 7.8804, lng: 98.3923, zoom: 13 },
            'Hat Yai': { lat: 7.0061, lng: 100.4681, zoom: 13 },
            'Udon Thani': { lat: 17.4138, lng: 102.7875, zoom: 13 },
            'Nakhon Ratchasima': { lat: 14.9799, lng: 102.0977, zoom: 13 },
            'Khon Kaen': { lat: 16.4419, lng: 102.8360, zoom: 13 },
            'Chiang Rai': { lat: 19.9105, lng: 99.8406, zoom: 13 },
            'Rayong': { lat: 12.6807, lng: 101.2539, zoom: 13 }
          },
          'TR': {
            'Istanbul': { lat: 41.0082, lng: 28.9784, zoom: 13 },
            'Ankara': { lat: 39.9334, lng: 32.8597, zoom: 13 },
            'Izmir': { lat: 38.4237, lng: 27.1428, zoom: 13 },
            'Bursa': { lat: 40.1826, lng: 29.0665, zoom: 13 },
            'Adana': { lat: 37.0000, lng: 35.3213, zoom: 13 },
            'Gaziantep': { lat: 37.0662, lng: 37.3833, zoom: 13 },
            'Konya': { lat: 37.8667, lng: 32.4833, zoom: 13 },
            'Antalya': { lat: 36.8969, lng: 30.7133, zoom: 13 },
            'Kayseri': { lat: 38.7312, lng: 35.4787, zoom: 13 },
            'Mersin': { lat: 36.8000, lng: 34.6333, zoom: 13 }
          },
          'AE': {
            'Dubai': { lat: 25.2048, lng: 55.2708, zoom: 13 },
            'Abu Dhabi': { lat: 24.4539, lng: 54.3773, zoom: 13 },
            'Sharjah': { lat: 25.3463, lng: 55.4209, zoom: 13 },
            'Al Ain': { lat: 24.2075, lng: 55.7447, zoom: 13 },
            'Ajman': { lat: 25.4052, lng: 55.5136, zoom: 13 },
            'Ras Al Khaimah': { lat: 25.7889, lng: 55.9598, zoom: 13 },
            'Fujairah': { lat: 25.1164, lng: 56.3398, zoom: 13 },
            'Umm Al Quwain': { lat: 25.5644, lng: 55.5533, zoom: 13 }
          }
        };
        
        if (selectedCity && selectedCity !== 'all') {
          console.log('🏙️ Searching for city:', selectedCity, 'in country:', selectedCountry);
          console.log('🗺️ Available cityCoords for country:', cityCoords[selectedCountry]);
          
          // Zoom to specific city
          const cityCoord = cityCoords[selectedCountry]?.[selectedCity];
          
          console.log('🎯 Found city coordinate:', cityCoord);
          
          if (cityCoord) {
            console.log('✅ Zooming to city:', selectedCity, cityCoord);
            map.panTo({ lat: cityCoord.lat, lng: cityCoord.lng });
            map.setZoom(cityCoord.zoom);
            map.setTilt(45); // 3D view for cities
            return;
          } else {
            console.log('❌ City coordinate not found for:', selectedCity);
          }
        }
        
        // Zoom to country
        const coords = countryCoords[selectedCountry];
        if (coords) {
          map.panTo({ lat: coords.lat, lng: coords.lng });
          map.setZoom(coords.zoom);
          map.setTilt(20); // Slight 3D effect for country view
        }
      } else {
        // Reset to global satellite view
        map.panTo({ lat: 20, lng: 0 });
        map.setZoom(3);
        map.setTilt(0);
      }
    }
  }, [selectedCountry, selectedCity, isLoading]);


  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 rounded-lg">
        <div className="text-red-400 mb-4">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Globe</h3>
        <p className="text-gray-400 text-sm text-center max-w-md">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-white/10">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-sm z-10">
          <div className="animate-spin w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full mb-4"></div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading Google Maps</h3>
          <p className="text-gray-300 text-sm">High-quality satellite imagery loading...</p>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ 
          minHeight: '500px',
          opacity: isLoading ? 0.3 : 1,
          transition: 'opacity 0.5s ease-in-out'
        }}
      />
      
    </div>
  );
}