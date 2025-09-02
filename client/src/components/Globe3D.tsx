import { useRef, useEffect, useState } from 'react';
import type { User } from '@shared/schema';

// Google Maps type definitions
declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
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
        setError('Google Maps API key not found. Please check environment variables.');
        setIsLoading(false);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;

      window.initGoogleMaps = () => {
        console.log('Google Maps API loaded successfully');
        setIsGoogleMapsLoaded(true);
      };

      script.onerror = (error) => {
        console.error('Failed to load Google Maps API:', error);
        setError('Failed to load Google Maps API. Please check your internet connection.');
        setIsLoading(false);
      };

      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize Google Earth-style 3D map
  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapRef.current || mapInstanceRef.current) return;
    
    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Initialize Google Maps with satellite view
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 2,
          center: { lat: 20, lng: 0 },
          mapTypeId: 'hybrid', // Hybrid mode shows satellite + labels
          
          // Enhanced controls
          gestureHandling: 'greedy',
          zoomControl: true,
          mapTypeControl: true,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: true,
          fullscreenControl: true,
          
          // Better map options
          mapTypeControlOptions: {
            mapTypeIds: ['satellite', 'hybrid', 'terrain', 'roadmap']
          },
          
          // Enable tilt and rotation for 3D effect
          tilt: 0, // Start flat, user can tilt
          restriction: {
            latLngBounds: {
              north: 85,
              south: -85,
              west: -180,
              east: 180
            }
          }
        });
        
        // Enable 3D tilt on zoom
        map.addListener('zoom_changed', () => {
          const zoom = map.getZoom();
          if (zoom && zoom > 15) {
            map.setTilt(45); // Enable 3D view at high zoom
          } else {
            map.setTilt(0);
          }
        });
        
        mapInstanceRef.current = map;
        
        // Add user markers
        addUserMarkers(map);
        
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

  // Function to add user markers
  const addUserMarkers = (map: any) => {
    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (marker.setMap) marker.setMap(null);
    });
    markersRef.current = [];

    users
      .filter(user => user.lat && user.lng && user.showOnMap)
      .forEach(user => {
        const color = user.plan === 'creator' ? '#10b981' : user.plan === 'traveler' ? '#3b82f6' : '#6b7280';
        
        // Create custom marker with user avatar
        const marker = new window.google.maps.Marker({
          position: { lat: user.lat!, lng: user.lng! },
          map: map,
          title: user.displayName,
          icon: {
            url: `data:image/svg+xml;base64,${btoa(`
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="3"/>
                <circle cx="20" cy="20" r="12" fill="white"/>
                <text x="20" y="26" text-anchor="middle" fill="${color}" font-size="12" font-weight="bold">
                  ${(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                </text>
              </svg>
            `)}`,
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 20)
          },
          animation: window.google.maps.Animation.DROP
        });

        // Add click listener
        marker.addListener('click', () => {
          if (onUserClick) {
            onUserClick(user);
          }
          
          // Show info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 10px; font-family: system-ui;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <img src="${user.profileImageUrl}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />
                  <div>
                    <div style="font-weight: bold; font-size: 14px;">${user.displayName}</div>
                    <div style="color: ${color}; font-size: 12px; text-transform: capitalize;">${user.plan} • ${user.city || 'Unknown'}</div>
                  </div>
                </div>
              </div>
            `
          });
          
          infoWindow.open(map, marker);
        });

        markersRef.current.push(marker);
      });
  };

  // Update markers when users change
  useEffect(() => {
    if (mapInstanceRef.current && !isLoading) {
      addUserMarkers(mapInstanceRef.current);
    }
  }, [users, isLoading]);

  // Handle country/city focus
  useEffect(() => {
    if (mapInstanceRef.current && !isLoading) {
      const map = mapInstanceRef.current;
      
      if (selectedCountry && selectedCountry !== 'all') {
        // Country coordinates mapping
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
          map.setTilt(45); // Maintain 3D view
        }
      } else {
        // Reset to global view
        map.panTo({ lat: 20, lng: 0 });
        map.setZoom(2);
        map.setTilt(0); // Flat view for global perspective
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
        <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Map</h3>
        <p className="text-gray-400 text-sm text-center max-w-md">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="relative bg-slate-900 rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <h3 className="text-lg font-semibold text-white mb-2">Loading Google Earth</h3>
          <p className="text-gray-400 text-sm">Loading satellite imagery and 3D buildings...</p>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          opacity: isLoading ? 0.3 : 1,
          transition: 'opacity 0.5s ease-in-out'
        }}
      />
      
      {/* Controls Info */}
      {!isLoading && (
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-xs space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Creators</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Travelers</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span>Free Users</span>
          </div>
          <div className="text-gray-300 mt-2">
            Pan • Zoom • Tilt • Rotate for 3D view
          </div>
        </div>
      )}
    </div>
  );
}