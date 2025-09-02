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
          
          // Restrict bounds for better performance
          restriction: {
            latLngBounds: {
              north: 85,
              south: -85,
              west: -180,
              east: 180
            }
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
        
        // Create premium marker design
        const marker = new window.google.maps.Marker({
          position: { lat: user.lat!, lng: user.lng! },
          map: map,
          title: `${user.displayName || user.username} - ${user.plan}`,
          icon: {
            url: `data:image/svg+xml;base64,${btoa(`
              <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <dropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
                  </filter>
                </defs>
                <circle cx="25" cy="25" r="22" fill="white" stroke="${color}" stroke-width="3" filter="url(#shadow)"/>
                <circle cx="25" cy="25" r="16" fill="${color}" opacity="0.1"/>
                <text x="25" y="30" text-anchor="middle" fill="${color}" font-size="16" font-weight="bold">
                  ${planIcon}
                </text>
              </svg>
            `)}`,
            scaledSize: new window.google.maps.Size(50, 50),
            anchor: new window.google.maps.Point(25, 25)
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
        // Country coordinates with optimal zoom levels
        const countryCoords: Record<string, { lat: number, lng: number, zoom: number }> = {
          'GB': { lat: 54.7753, lng: -2.3508, zoom: 6 },
          'US': { lat: 39.8283, lng: -98.5795, zoom: 4 },
          'IN': { lat: 20.5937, lng: 78.9629, zoom: 5 },
          'FR': { lat: 46.6034, lng: 1.8883, zoom: 6 },
          'DE': { lat: 51.1657, lng: 10.4515, zoom: 6 },
          'JP': { lat: 36.2048, lng: 138.2529, zoom: 6 },
          'AU': { lat: -25.2744, lng: 133.7751, zoom: 5 },
        };
        
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
    <div className="relative bg-slate-900 rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-10">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading Google Maps</h3>
          <p className="text-gray-300 text-sm">High-quality satellite imagery loading...</p>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          opacity: isLoading ? 0.3 : 1,
          transition: 'opacity 0.5s ease-in-out',
          borderRadius: '12px'
        }}
      />
      
      {/* Premium Controls Info */}
      {!isLoading && (
        <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md rounded-xl p-4 text-white text-xs space-y-2 border border-white/10">
          <div className="text-sm font-semibold text-blue-300 mb-2">🗺️ Live Users</div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span>⭐ Creators</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span>✈️ Travelers</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse"></div>
            <span>👤 Free Users</span>
          </div>
          <div className="text-gray-300 mt-3 pt-2 border-t border-white/10">
            🌍 Google Maps • Satellite View • 3D Buildings
          </div>
        </div>
      )}
      
      {/* Premium Branding */}
      {!isLoading && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs font-semibold text-gray-800">
          🚀 Powered by Google Maps
        </div>
      )}
    </div>
  );
}