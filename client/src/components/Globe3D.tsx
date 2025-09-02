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
        
        // City coordinates for zoom functionality
        const cityCoords: Record<string, Record<string, { lat: number, lng: number, zoom: number }>> = {
          'GB': {
            'London': { lat: 51.5074, lng: -0.1278, zoom: 10 },
            'Manchester': { lat: 53.4808, lng: -2.2426, zoom: 10 },
            'Birmingham': { lat: 52.4862, lng: -1.8904, zoom: 10 },
            'Edinburgh': { lat: 55.9533, lng: -3.1883, zoom: 10 },
            'Liverpool': { lat: 53.4084, lng: -2.9916, zoom: 10 },
            'Bristol': { lat: 51.4545, lng: -2.5879, zoom: 10 }
          },
          'US': {
            'New York': { lat: 40.7128, lng: -74.0060, zoom: 10 },
            'Los Angeles': { lat: 34.0522, lng: -118.2437, zoom: 10 },
            'Chicago': { lat: 41.8781, lng: -87.6298, zoom: 10 },
            'San Francisco': { lat: 37.7749, lng: -122.4194, zoom: 10 },
            'Miami': { lat: 25.7617, lng: -80.1918, zoom: 10 },
            'Las Vegas': { lat: 36.1699, lng: -115.1398, zoom: 10 },
            'Seattle': { lat: 47.6062, lng: -122.3321, zoom: 10 },
            'Boston': { lat: 42.3601, lng: -71.0589, zoom: 10 }
          },
          'IN': {
            'Mumbai': { lat: 19.0760, lng: 72.8777, zoom: 10 },
            'Delhi': { lat: 28.7041, lng: 77.1025, zoom: 10 },
            'Bangalore': { lat: 12.9716, lng: 77.5946, zoom: 10 },
            'Chennai': { lat: 13.0827, lng: 80.2707, zoom: 10 },
            'Kolkata': { lat: 22.5726, lng: 88.3639, zoom: 10 },
            'Hyderabad': { lat: 17.3850, lng: 78.4867, zoom: 10 },
            'Pune': { lat: 18.5204, lng: 73.8567, zoom: 10 },
            'Ahmedabad': { lat: 23.0225, lng: 72.5714, zoom: 10 }
          },
          'FR': {
            'Paris': { lat: 48.8566, lng: 2.3522, zoom: 10 },
            'Lyon': { lat: 45.7640, lng: 4.8357, zoom: 10 },
            'Marseille': { lat: 43.2965, lng: 5.3698, zoom: 10 },
            'Nice': { lat: 43.7102, lng: 7.2620, zoom: 10 },
            'Toulouse': { lat: 43.6047, lng: 1.4442, zoom: 10 }
          },
          'DE': {
            'Berlin': { lat: 52.5200, lng: 13.4050, zoom: 10 },
            'Munich': { lat: 48.1351, lng: 11.5820, zoom: 10 },
            'Hamburg': { lat: 53.5511, lng: 9.9937, zoom: 10 },
            'Frankfurt': { lat: 50.1109, lng: 8.6821, zoom: 10 },
            'Cologne': { lat: 50.9375, lng: 6.9603, zoom: 10 }
          },
          'JP': {
            'Tokyo': { lat: 35.6762, lng: 139.6503, zoom: 10 },
            'Osaka': { lat: 34.6937, lng: 135.5023, zoom: 10 },
            'Kyoto': { lat: 35.0116, lng: 135.7681, zoom: 10 },
            'Nagoya': { lat: 35.1815, lng: 136.9066, zoom: 10 },
            'Yokohama': { lat: 35.4438, lng: 139.6380, zoom: 10 }
          }
        };
        
        if (selectedCity && selectedCity !== 'all') {
          // Zoom to specific city
          const cityCoord = cityCoords[selectedCountry]?.[selectedCity];
          if (cityCoord) {
            map.panTo({ lat: cityCoord.lat, lng: cityCoord.lng });
            map.setZoom(cityCoord.zoom);
            map.setTilt(45); // 3D view for cities
            return;
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