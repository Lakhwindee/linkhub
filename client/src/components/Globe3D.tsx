import { useRef, useEffect, useState } from 'react';
import type { User, Stay } from '@shared/schema';

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
  onStayClick?: (stay: Stay) => void;
  selectedCountry?: string;
  selectedState?: string;
  showTravellers?: boolean;
  showStays?: boolean;
}

export default function Globe3D({ 
  users, 
  width = 800, 
  height = 600, 
  onUserClick,
  onStayClick,
  selectedCountry,
  selectedState,
  showTravellers = true,
  showStays = true
}: Globe3DProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [stays, setStays] = useState<Stay[]>([]);

  // Fetch stays data
  useEffect(() => {
    const fetchStays = async () => {
      try {
        const response = await fetch('/api/stays');
        if (response.ok) {
          const staysData = await response.json();
          console.log('Fetched stays:', staysData);
          setStays(staysData);
        }
      } catch (error) {
        console.error('Error fetching stays:', error);
      }
    };

    fetchStays();
  }, []);

  // Load Google Maps API
  // Setup global connection request handler
  useEffect(() => {
    const handleConnectionRequest = async (userId: string) => {
      try {
        console.log('Sending connection request to user:', userId);
        
        const response = await fetch('/api/connect-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientId: userId,
            message: 'Hi! I found you on HubLink and would love to connect!'
          }),
        });

        if (response.ok) {
          // Show success notification
          const button = document.querySelector(`[onclick="window.sendConnectionRequest('${userId}')"]`) as HTMLElement;
          if (button) {
            button.innerHTML = '✅ Request Sent!';
            button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            button.style.cursor = 'default';
            button.onclick = null;
            
            setTimeout(() => {
              // Close any open InfoWindows
              document.querySelectorAll('.gm-ui-hover-effect').forEach(el => {
                (el as HTMLElement).click();
              });
            }, 1500);
          }
          
          console.log('Connection request sent successfully!');
        } else {
          throw new Error('Failed to send connection request');
        }
      } catch (error) {
        console.error('Connection request error:', error);
        
        const button = document.querySelector(`[onclick="window.sendConnectionRequest('${userId}')"]`) as HTMLElement;
        if (button) {
          button.innerHTML = '❌ Request Failed';
          button.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
          setTimeout(() => {
            button.innerHTML = '🤝 Send Connection Request';
            button.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
          }, 2000);
        }
      }
    };

    // Make function globally available
    (window as any).sendConnectionRequest = handleConnectionRequest;

    return () => {
      // Cleanup
      delete (window as any).sendConnectionRequest;
    };
  }, []);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      if (window.google && window.google.maps) {
        console.log('Google Maps already loaded');
        setIsGoogleMapsLoaded(true);
        return;
      }

      try {
        // Fetch API key from server
        const response = await fetch('/api/config/maps-key');
        const data = await response.json();
        
        if (!response.ok || !data.apiKey) {
          console.log('Loading Google Maps API with key:', 'NO API KEY');
          setError('Google Maps API key not configured.');
          setIsLoading(false);
          return;
        }

        const apiKey = data.apiKey;
        console.log('Loading Google Maps API with key:', apiKey ? 'API key found' : 'NO API KEY');

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&map_ids=DEMO_MAP_ID&libraries=geometry,places&callback=initMap`;
        script.async = true;
        script.defer = true;

        window.initMap = () => {
          console.log('Google Maps API loaded successfully');
          setIsGoogleMapsLoaded(true);
        };

        // Set a shorter timeout to detect API key errors faster
        const errorTimeout = setTimeout(() => {
          console.log('Google Maps API timeout - switching to fallback');
          setError('Using fallback display - Google Maps unavailable in development.');
          setIsLoading(false);
        }, 1500);

        // Listen for Google Maps errors
        const errorHandler = (event: any) => {
          if (event.message && event.message.includes('Google Maps')) {
            console.error('Google Maps error detected:', event.message);
            clearTimeout(errorTimeout);
            setError('Using fallback display - Google Maps unavailable in development.');
            setIsLoading(false);
          }
        };
        window.addEventListener('error', errorHandler);

        script.onerror = (error) => {
          console.error('Failed to load Google Maps API:', error);
          clearTimeout(errorTimeout);
          window.removeEventListener('error', errorHandler);
          setError('Using fallback display - Google Maps unavailable in development.');
          setIsLoading(false);
        };

        document.head.appendChild(script);
        
        // Return cleanup function
        return () => {
          clearTimeout(errorTimeout);
          window.removeEventListener('error', errorHandler);
        };
      } catch (error) {
        console.error('Failed to fetch API key:', error);
        setError('Failed to fetch Google Maps API configuration.');
        setIsLoading(false);
      }
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
        
        // Check if Google Maps API is properly loaded
        if (!window.google || !window.google.maps) {
          console.error('Google Maps API not properly loaded');
          setError('Using fallback display - Google Maps unavailable in development.');
          setIsLoading(false);
          return;
        }
        
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
          
          // Clean styling - only countries and cities
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
            },
            // Hide all POI (points of interest) - shops, restaurants, etc
            {
              featureType: 'poi',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'poi.business',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'poi.park',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'poi.school',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'poi.medical',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'poi.government',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'poi.attraction',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'poi.place_of_worship',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'poi.sports_complex',
              stylers: [{ visibility: 'off' }]
            },
            // Hide detailed road labels
            {
              featureType: 'road',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            },
            // Show highways only simplified
            {
              featureType: 'road.highway',
              stylers: [{ visibility: 'simplified' }]
            },
            // Hide local roads  
            {
              featureType: 'road.arterial',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'road.local',
              stylers: [{ visibility: 'off' }]
            },
            // Hide transit systems
            {
              featureType: 'transit',
              stylers: [{ visibility: 'off' }]
            },
            // Keep country labels visible
            {
              featureType: 'administrative.country',
              elementType: 'labels.text',
              stylers: [{ visibility: 'on' }]
            },
            // Keep city labels visible
            {
              featureType: 'administrative.locality',
              elementType: 'labels.text',
              stylers: [{ visibility: 'on' }]
            },
            // Simplify province/state borders
            {
              featureType: 'administrative.province',
              stylers: [{ visibility: 'simplified' }]
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
      // Cleanup markers and their animations
      markersRef.current.forEach(marker => {
        if ((marker as any).cleanup) {
          (marker as any).cleanup(); // Clean up pulse intervals
        }
        if (marker.setMap) marker.setMap(null);
      });
      markersRef.current = [];
    };
  }, [isGoogleMapsLoaded]);

  // Function to add premium-looking user markers
  const addPremiumMarkers = (map: any) => {
    // Clear existing markers and their animations
    markersRef.current.forEach(marker => {
      if ((marker as any).cleanup) {
        (marker as any).cleanup(); // Clean up pulse intervals
      }
      if (marker.setMap) marker.setMap(null);
    });
    markersRef.current = [];

    // Only show travellers if toggle is enabled
    if (showTravellers) {
      users
        .filter(user => user.lat && user.lng && user.showOnMap)
        .forEach(user => {
        const color = user.plan === 'creator' ? '#10b981' : user.plan === 'traveler' ? '#3b82f6' : '#6b7280';
        const planIcon = user.plan === 'creator' ? '⭐' : user.plan === 'traveler' ? '✈️' : '👤';
        
        // Determine location sharing status (simulate for demo - 60% have location ON)
        const isLocationOn = Math.random() > 0.4; // 60% have location sharing ON
        const locationColor = isLocationOn ? '#22c55e' : '#ef4444'; // Green for ON, Red for OFF
        const locationStatus = isLocationOn ? 'Location ON' : 'Last known location';
        
        // Create location pin/needle style marker
        const marker = new window.google.maps.Marker({
          position: { lat: user.lat!, lng: user.lng! },
          map: map,
          title: `${user.displayName || user.username} - ${locationStatus}`,
          icon: {
            // Custom pin/needle shape using SVG path
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: locationColor,
            fillOpacity: 0.9,
            strokeColor: 'white',
            strokeWeight: 2,
            scale: 1.5,
            anchor: new window.google.maps.Point(12, 22) // Anchor at the bottom tip of the pin
          },
          // No animation - pins stay static
          animation: window.google.maps.Animation.DROP
        });

        // Enhanced info window with detailed traveler info and connection request
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="
              padding: 20px; 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              min-width: 300px;
              max-width: 350px;
              background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
              border-radius: 16px;
              box-shadow: 0 12px 35px rgba(0,0,0,0.2);
              border: 1px solid rgba(255,255,255,0.2);
            ">
              <!-- Header Section -->
              <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                <div style="position: relative;">
                  <img src="${user.profileImageUrl}" style="
                    width: 60px; 
                    height: 60px; 
                    border-radius: 50%; 
                    object-fit: cover;
                    border: 4px solid ${color};
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                  " />
                  <div style="
                    position: absolute;
                    bottom: -2px;
                    right: -2px;
                    background: ${locationColor};
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    border: 3px solid white;
                  "></div>
                </div>
                <div style="flex: 1;">
                  <div style="font-weight: 700; font-size: 18px; color: #1e293b; margin-bottom: 4px;">
                    ${user.displayName || user.username}
                  </div>
                  <div style="
                    color: ${locationColor}; 
                    font-size: 12px; 
                    font-weight: 600;
                    text-transform: uppercase;
                    background: ${locationColor}20;
                    padding: 4px 10px;
                    border-radius: 20px;
                    display: inline-block;
                    margin-bottom: 4px;
                  ">${isLocationOn ? '🟢 ONLINE' : '🔴 OFFLINE'}</div>
                  <div style="
                    color: ${color}; 
                    font-size: 12px; 
                    font-weight: 600;
                    background: ${color}20;
                    padding: 3px 8px;
                    border-radius: 15px;
                    display: inline-block;
                  ">${planIcon} ${user.plan?.toUpperCase() || 'FREE'}</div>
                </div>
              </div>
              
              <!-- Location & Details -->
              <div style="
                background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                padding: 12px;
                border-radius: 12px;
                margin-bottom: 15px;
                border-left: 4px solid ${color};
              ">
                <div style="font-size: 14px; color: #334155; margin-bottom: 8px;">
                  <strong>📍 ${user.city || 'Unknown'}, ${user.country || 'Unknown'}</strong>
                </div>
                ${user.interests && user.interests.length > 0 ? `
                  <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">
                    <strong>🎯 Interests:</strong> ${user.interests.join(', ')}
                  </div>
                ` : ''}
                <div style="font-size: 12px; color: #64748b;">
                  <strong>📅 Joined:</strong> ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                </div>
              </div>
              
              <!-- Action Button -->
              <button 
                onclick="window.sendConnectionRequest('${user.id}')" 
                style="
                  width: 100%;
                  background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
                  color: white;
                  border: none;
                  padding: 12px 16px;
                  border-radius: 10px;
                  font-size: 14px;
                  font-weight: 600;
                  cursor: pointer;
                  box-shadow: 0 4px 12px ${color}40;
                  transition: all 0.2s ease;
                "
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px ${color}50';"
                onmouseout="this.style.transform='translateY(0px)'; this.style.boxShadow='0 4px 12px ${color}40';"
              >
                🤝 Send Connection Request
              </button>
              
              <div style="text-align: center; margin-top: 10px; font-size: 11px; color: #94a3b8;">
                Connect with ${user.firstName || user.displayName || user.username} to start your journey together!
              </div>
            </div>
          `,
          pixelOffset: new window.google.maps.Size(0, -15)
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
    } // End of showTravellers condition
  };

  // Add stay markers to the map
  const addStayMarkers = (map: any) => {
    // Clear existing markers first
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add user markers
    addPremiumMarkers(map);

    // Only show stays if toggle is enabled
    if (showStays) {
      stays.forEach((stay) => {
        if (!stay.lat || !stay.lng) return;

        // Create custom bed icon marker with better visibility
      const bedIcon = {
        path: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm2 6h12v6H6v-6zm2-3h8v2H8V7z', // Better bed icon
        fillColor: '#EC4899', // Bright pink color for stays  
        fillOpacity: 1,
        strokeWeight: 3,
        strokeColor: '#FFFFFF',
        scale: 1.8, // Larger size
        anchor: new window.google.maps.Point(12, 12)
      };

      const marker = new window.google.maps.Marker({
        position: { lat: stay.lat, lng: stay.lng },
        map: map,
        icon: bedIcon,
        title: `🛏️ ${stay.title}`,
        zIndex: 999 // Higher z-index to appear above user markers
      });

      // Create info window for stay
      const stayTypeIcon = stay.type === 'hostel' ? '🏠' : 
                           stay.type === 'hotel' ? '🏨' : 
                           stay.type === 'apartment' ? '🏢' : 
                           stay.type === 'house' ? '🏡' : '🛏️';
      
      const currencySymbol = stay.currency === 'GBP' ? '£' : 
                             stay.currency === 'USD' ? '$' : 
                             stay.currency === 'EUR' ? '€' : '₹';

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            max-width: 280px;
            padding: 0;
            margin: 0;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          ">
            <!-- Header -->
            <div style="
              background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%);
              padding: 16px;
              text-align: center;
              position: relative;
            ">
              <div style="
                background: rgba(255, 255, 255, 0.2);
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 8px;
                font-size: 16px;
              ">🛏️</div>
              <div style="color: white; font-weight: 700; font-size: 16px; margin-bottom: 4px;">
                ${stay.title}
              </div>
              <div style="
                color: rgba(255, 255, 255, 0.9); 
                font-size: 12px; 
                background: rgba(255, 255, 255, 0.2);
                padding: 4px 12px;
                border-radius: 20px;
                display: inline-block;
              ">${stayTypeIcon} ${stay.type?.toUpperCase()}</div>
            </div>
            
            <!-- Content -->
            <div style="padding: 16px;">
              <!-- Location -->
              <div style="
                background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                padding: 12px;
                border-radius: 12px;
                margin-bottom: 12px;
                border-left: 4px solid #EC4899;
              ">
                <div style="font-size: 14px; color: #334155; margin-bottom: 6px;">
                  <strong>📍 ${stay.city}, ${stay.country}</strong>
                </div>
                ${stay.pricePerNight ? `
                  <div style="font-size: 16px; color: #EC4899; font-weight: 700;">
                    ${currencySymbol}${stay.pricePerNight}/night
                  </div>
                ` : `
                  <div style="font-size: 14px; color: #059669; font-weight: 600;">
                    Free Stay Available
                  </div>
                `}
              </div>
              
              <!-- Details -->
              <div style="font-size: 12px; color: #64748b; margin-bottom: 12px;">
                ${stay.maxGuests ? `<div>👥 Max ${stay.maxGuests} guests</div>` : ''}
                ${stay.bedrooms ? `<div>🛏️ ${stay.bedrooms} bedroom(s)</div>` : ''}
                ${stay.bathrooms ? `<div>🚿 ${stay.bathrooms} bathroom(s)</div>` : ''}
              </div>
              
              <!-- Action Button -->
              <button 
                onclick="window.viewStayDetails && window.viewStayDetails('${stay.id}')" 
                style="
                  width: 100%;
                  background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%);
                  color: white;
                  border: none;
                  padding: 12px 16px;
                  border-radius: 10px;
                  font-size: 14px;
                  font-weight: 600;
                  cursor: pointer;
                  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
                  transition: all 0.2s ease;
                "
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(236, 72, 153, 0.4)';"
                onmouseout="this.style.transform='translateY(0px)'; this.style.boxShadow='0 4px 12px rgba(236, 72, 153, 0.3)';"
              >
                🏠 View Stay Details
              </button>
              
              <div style="text-align: center; margin-top: 8px; font-size: 11px; color: #94a3b8;">
                Book your stay with ${stay.title}
              </div>
            </div>
          </div>
        `,
        pixelOffset: new window.google.maps.Size(0, -15)
      });

      // Click handler for stays
      marker.addListener('click', () => {
        if (onStayClick) {
          onStayClick(stay);
        }
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
      });
    } // End of showStays condition
  };

  // Update markers when users, stays, or toggle states change
  useEffect(() => {
    if (mapInstanceRef.current && !isLoading) {
      addStayMarkers(mapInstanceRef.current);
    }
  }, [users, stays, isLoading, showTravellers, showStays]);

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
        
        // States/provinces coordinates for hierarchical zoom
        const stateCoords: Record<string, Record<string, { lat: number, lng: number, zoom: number }>> = {
          "US": {
            "CA": { lat: 36.7783, lng: -119.4179, zoom: 7 },
            "TX": { lat: 31.9686, lng: -99.9018, zoom: 6 },
            "FL": { lat: 27.7663, lng: -81.6868, zoom: 7 },
            "NY": { lat: 42.1657, lng: -74.9481, zoom: 7 },
            "PA": { lat: 41.2033, lng: -77.1945, zoom: 7 },
            "IL": { lat: 40.3363, lng: -89.0022, zoom: 7 },
            "OH": { lat: 40.3888, lng: -82.7649, zoom: 7 },
            "GA": { lat: 33.0406, lng: -83.6431, zoom: 7 },
            "NC": { lat: 35.6301, lng: -79.8064, zoom: 7 },
            "MI": { lat: 43.3266, lng: -84.5361, zoom: 7 },
            "WA": { lat: 47.0379, lng: -121.0187, zoom: 7 },
            "CO": { lat: 39.0598, lng: -105.3111, zoom: 7 },
            "AZ": { lat: 33.7712, lng: -111.3877, zoom: 7 },
            "NV": { lat: 38.9517, lng: -117.0542, zoom: 7 },
            "OR": { lat: 44.5720, lng: -122.0709, zoom: 7 }
          },
          "IN": {
            "MH": { lat: 19.7515, lng: 75.7139, zoom: 7 },
            "DL": { lat: 28.7041, lng: 77.1025, zoom: 9 },
            "KA": { lat: 15.3173, lng: 75.7139, zoom: 7 },
            "TN": { lat: 11.1271, lng: 78.6569, zoom: 7 },
            "WB": { lat: 22.9868, lng: 87.8550, zoom: 7 },
            "TS": { lat: 18.1124, lng: 79.0193, zoom: 8 },
            "GJ": { lat: 22.2587, lng: 71.1924, zoom: 7 },
            "RJ": { lat: 27.0238, lng: 74.2179, zoom: 6 },
            "UP": { lat: 26.8467, lng: 80.9462, zoom: 6 },
            "MP": { lat: 22.9734, lng: 78.6569, zoom: 6 },
            "BR": { lat: 25.0961, lng: 85.3131, zoom: 7 },
            "OR": { lat: 20.9517, lng: 85.0985, zoom: 7 },
            "PB": { lat: 31.1471, lng: 75.3412, zoom: 8 },
            "HR": { lat: 29.0588, lng: 76.0856, zoom: 8 },
            "JH": { lat: 23.6102, lng: 85.2799, zoom: 7 },
            "AS": { lat: 26.2006, lng: 92.9376, zoom: 7 },
            "KL": { lat: 10.8505, lng: 76.2711, zoom: 8 },
            "AP": { lat: 15.9129, lng: 79.7400, zoom: 7 },
            "UK": { lat: 30.0668, lng: 79.0193, zoom: 8 },
            "HP": { lat: 31.1048, lng: 77.1734, zoom: 8 },
            "JK": { lat: 34.0837, lng: 74.7973, zoom: 8 },
            "GA": { lat: 15.2993, lng: 74.1240, zoom: 10 }
          },
          "CA": {
            "ON": { lat: 51.2538, lng: -85.3232, zoom: 5 },
            "QC": { lat: 53.9214, lng: -72.7665, zoom: 5 },
            "BC": { lat: 53.7267, lng: -127.6476, zoom: 5 },
            "AB": { lat: 53.9333, lng: -116.5765, zoom: 6 },
            "MB": { lat: 53.7609, lng: -98.8139, zoom: 6 },
            "SK": { lat: 52.9399, lng: -106.4509, zoom: 6 },
            "NS": { lat: 44.6820, lng: -63.7443, zoom: 8 },
            "NB": { lat: 46.5653, lng: -66.4619, zoom: 8 },
            "NL": { lat: 53.1355, lng: -57.6604, zoom: 6 }
          },
          "AU": {
            "NSW": { lat: -31.2532, lng: 146.9211, zoom: 6 },
            "VIC": { lat: -37.4713, lng: 144.7852, zoom: 7 },
            "QLD": { lat: -20.9176, lng: 142.7028, zoom: 5 },
            "WA": { lat: -25.2744, lng: 133.7751, zoom: 5 },
            "SA": { lat: -30.0002, lng: 136.2092, zoom: 6 },
            "TAS": { lat: -41.4545, lng: 145.9707, zoom: 8 },
            "NT": { lat: -19.4914, lng: 132.5510, zoom: 6 },
            "ACT": { lat: -35.4735, lng: 149.0124, zoom: 10 }
          },
          "BR": {
            "SP": { lat: -23.5489, lng: -46.6388, zoom: 7 },
            "RJ": { lat: -22.9068, lng: -43.1729, zoom: 8 },
            "MG": { lat: -18.5122, lng: -44.5550, zoom: 6 },
            "BA": { lat: -12.5797, lng: -41.7007, zoom: 6 },
            "PR": { lat: -24.8341, lng: -51.9253, zoom: 7 },
            "RS": { lat: -30.0346, lng: -51.2177, zoom: 6 },
            "PE": { lat: -8.8137, lng: -36.9541, zoom: 7 },
            "CE": { lat: -5.4984, lng: -39.3206, zoom: 7 },
            "SC": { lat: -27.2423, lng: -50.2189, zoom: 7 }
          },
          "GB": {
            "ENG": { lat: 52.3555, lng: -1.1743, zoom: 7 },
            "SCT": { lat: 56.4907, lng: -4.2026, zoom: 7 },
            "WLS": { lat: 52.1307, lng: -3.7837, zoom: 8 },
            "NIR": { lat: 54.7877, lng: -6.4923, zoom: 8 }
          }
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
            'Surat': { lat: 21.1702, lng: 72.8311, zoom: 13 },
            'Lucknow': { lat: 26.8467, lng: 80.9462, zoom: 13 },
            'Kanpur': { lat: 26.4499, lng: 80.3319, zoom: 13 },
            'Nagpur': { lat: 21.1458, lng: 79.0882, zoom: 13 },
            'Indore': { lat: 22.7196, lng: 75.8577, zoom: 13 },
            'Thane': { lat: 19.2183, lng: 72.9781, zoom: 13 },
            'Bhopal': { lat: 23.2599, lng: 77.4126, zoom: 13 },
            'Visakhapatnam': { lat: 17.6868, lng: 83.2185, zoom: 13 },
            'Pimpri-Chinchwad': { lat: 18.6298, lng: 73.7997, zoom: 13 },
            'Patna': { lat: 25.5941, lng: 85.1376, zoom: 13 },
            'Vadodara': { lat: 22.3072, lng: 73.1812, zoom: 13 },
            'Ghaziabad': { lat: 28.6692, lng: 77.4538, zoom: 13 },
            'Ludhiana': { lat: 30.9001, lng: 75.8573, zoom: 13 },
            'Agra': { lat: 27.1767, lng: 78.0081, zoom: 13 },
            'Nashik': { lat: 19.9975, lng: 73.7898, zoom: 13 },
            'Faridabad': { lat: 28.4089, lng: 77.3178, zoom: 13 },
            'Meerut': { lat: 28.9845, lng: 77.7064, zoom: 13 },
            'Rajkot': { lat: 22.3039, lng: 70.8022, zoom: 13 },
            'Kalyan-Dombivali': { lat: 19.2403, lng: 73.1305, zoom: 13 },
            'Vasai-Virar': { lat: 19.4919, lng: 72.8197, zoom: 13 },
            'Varanasi': { lat: 25.3176, lng: 82.9739, zoom: 13 },
            'Srinagar': { lat: 34.0837, lng: 74.7973, zoom: 13 },
            'Aurangabad': { lat: 19.8762, lng: 75.3433, zoom: 13 },
            'Dhanbad': { lat: 23.7957, lng: 86.4304, zoom: 13 },
            'Amritsar': { lat: 31.6340, lng: 74.8723, zoom: 13 },
            'Navi Mumbai': { lat: 19.0330, lng: 73.0297, zoom: 13 },
            'Allahabad': { lat: 25.4358, lng: 81.8463, zoom: 13 },
            'Ranchi': { lat: 23.3441, lng: 85.3096, zoom: 13 },
            'Howrah': { lat: 22.5958, lng: 88.2636, zoom: 13 },
            'Coimbatore': { lat: 11.0168, lng: 76.9558, zoom: 13 },
            'Jabalpur': { lat: 23.1815, lng: 79.9864, zoom: 13 },
            'Gwalior': { lat: 26.2183, lng: 78.1828, zoom: 13 },
            'Vijayawada': { lat: 16.5062, lng: 80.6480, zoom: 13 },
            'Jodhpur': { lat: 26.2389, lng: 73.0243, zoom: 13 },
            'Madurai': { lat: 9.9252, lng: 78.1198, zoom: 13 },
            'Raipur': { lat: 21.2514, lng: 81.6296, zoom: 13 },
            'Kota': { lat: 25.2138, lng: 75.8648, zoom: 13 },
            'Chandigarh': { lat: 30.7333, lng: 76.7794, zoom: 13 },
            'Guwahati': { lat: 26.1445, lng: 91.7362, zoom: 13 },
            'Solapur': { lat: 17.6599, lng: 75.9064, zoom: 13 },
            'Hubli-Dharwad': { lat: 15.3647, lng: 75.1240, zoom: 13 },
            'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366, zoom: 13 },
            'Bareilly': { lat: 28.3670, lng: 79.4304, zoom: 13 },
            'Mysore': { lat: 12.2958, lng: 76.6394, zoom: 13 },
            'Tiruppur': { lat: 11.1085, lng: 77.3411, zoom: 13 },
            'Gurgaon': { lat: 28.4595, lng: 77.0266, zoom: 13 },
            'Salem': { lat: 11.6643, lng: 78.1460, zoom: 13 },
            'Aligarh': { lat: 27.8974, lng: 78.0880, zoom: 13 },
            'Bhiwandi': { lat: 19.3002, lng: 73.0635, zoom: 13 },
            'Moradabad': { lat: 28.8386, lng: 78.7733, zoom: 13 },
            'Gorakhpur': { lat: 26.7606, lng: 83.3732, zoom: 13 },
            'Bikaner': { lat: 28.0229, lng: 73.3119, zoom: 13 },
            'Saharanpur': { lat: 29.9680, lng: 77.5552, zoom: 13 },
            'Guntur': { lat: 16.3067, lng: 80.4365, zoom: 13 },
            'Warangal': { lat: 17.9784, lng: 79.6000, zoom: 13 },
            'Bhilai': { lat: 21.1938, lng: 81.3509, zoom: 13 },
            'Firozabad': { lat: 27.1592, lng: 78.3957, zoom: 13 },
            'Noida': { lat: 28.5355, lng: 77.3910, zoom: 13 },
            'Dehradun': { lat: 30.3165, lng: 78.0322, zoom: 13 },
            'Kochi': { lat: 9.9312, lng: 76.2673, zoom: 13 },
            'Bhubaneswar': { lat: 20.2961, lng: 85.8245, zoom: 13 },
            'Goa': { lat: 15.2993, lng: 74.1240, zoom: 13 },
            'Jammu': { lat: 32.7266, lng: 74.8570, zoom: 13 },
            'Shimla': { lat: 31.1048, lng: 77.1734, zoom: 13 },
            'Manali': { lat: 32.2396, lng: 77.1887, zoom: 13 },
            'Rishikesh': { lat: 30.0869, lng: 78.2676, zoom: 13 },
            'Haridwar': { lat: 29.9457, lng: 78.1642, zoom: 13 },
            'Udaipur': { lat: 24.5854, lng: 73.7125, zoom: 13 },
            'Pushkar': { lat: 26.4900, lng: 74.5511, zoom: 13 },
            'Darjeeling': { lat: 27.0360, lng: 88.2627, zoom: 13 },
            'Gangtok': { lat: 27.3389, lng: 88.6065, zoom: 13 }
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
          },
          'BE': {
            'Brussels': { lat: 50.8503, lng: 4.3517, zoom: 13 },
            'Antwerp': { lat: 51.2194, lng: 4.4025, zoom: 13 },
            'Ghent': { lat: 51.0543, lng: 3.7174, zoom: 13 },
            'Charleroi': { lat: 50.4108, lng: 4.4446, zoom: 13 },
            'Liège': { lat: 50.6326, lng: 5.5797, zoom: 13 },
            'Bruges': { lat: 51.2093, lng: 3.2247, zoom: 13 }
          },
          'FI': {
            'Helsinki': { lat: 60.1699, lng: 24.9384, zoom: 13 },
            'Espoo': { lat: 60.2055, lng: 24.6559, zoom: 13 },
            'Tampere': { lat: 61.4991, lng: 23.7871, zoom: 13 },
            'Vantaa': { lat: 60.2934, lng: 25.0378, zoom: 13 },
            'Oulu': { lat: 65.0121, lng: 25.4651, zoom: 13 },
            'Turku': { lat: 60.4518, lng: 22.2666, zoom: 13 }
          },
          'PL': {
            'Warsaw': { lat: 52.2297, lng: 21.0122, zoom: 13 },
            'Kraków': { lat: 50.0647, lng: 19.9450, zoom: 13 },
            'Łódź': { lat: 51.7592, lng: 19.4560, zoom: 13 },
            'Wrocław': { lat: 51.1079, lng: 17.0385, zoom: 13 },
            'Poznań': { lat: 52.4064, lng: 16.9252, zoom: 13 },
            'Gdańsk': { lat: 54.3520, lng: 18.6466, zoom: 13 }
          },
          'CZ': {
            'Prague': { lat: 50.0755, lng: 14.4378, zoom: 13 },
            'Brno': { lat: 49.1951, lng: 16.6068, zoom: 13 },
            'Ostrava': { lat: 49.8209, lng: 18.2625, zoom: 13 },
            'Plzen': { lat: 49.7384, lng: 13.3736, zoom: 13 },
            'Liberec': { lat: 50.7663, lng: 15.0543, zoom: 13 }
          },
          'PT': {
            'Lisbon': { lat: 38.7223, lng: -9.1393, zoom: 13 },
            'Porto': { lat: 41.1579, lng: -8.6291, zoom: 13 },
            'Vila Nova de Gaia': { lat: 41.1239, lng: -8.6118, zoom: 13 },
            'Amadora': { lat: 38.7536, lng: -9.2302, zoom: 13 },
            'Braga': { lat: 41.5518, lng: -8.4229, zoom: 13 },
            'Funchal': { lat: 32.6669, lng: -16.9241, zoom: 13 }
          },
          'GR': {
            'Athens': { lat: 37.9838, lng: 23.7275, zoom: 13 },
            'Thessaloniki': { lat: 40.6401, lng: 22.9444, zoom: 13 },
            'Patras': { lat: 38.2466, lng: 21.7346, zoom: 13 },
            'Piraeus': { lat: 37.9755, lng: 23.6348, zoom: 13 },
            'Larissa': { lat: 39.6390, lng: 22.4194, zoom: 13 },
            'Heraklion': { lat: 35.3387, lng: 25.1442, zoom: 13 }
          },
          'LK': {
            'Colombo': { lat: 6.9271, lng: 79.8612, zoom: 13 },
            'Kandy': { lat: 7.2906, lng: 80.6337, zoom: 13 },
            'Galle': { lat: 6.0535, lng: 80.2210, zoom: 13 },
            'Jaffna': { lat: 9.6615, lng: 80.0255, zoom: 13 }
          },
          'IR': {
            'Tehran': { lat: 35.6892, lng: 51.3890, zoom: 13 },
            'Mashhad': { lat: 36.2605, lng: 59.6168, zoom: 13 },
            'Isfahan': { lat: 32.6546, lng: 51.6680, zoom: 13 },
            'Shiraz': { lat: 29.5918, lng: 52.5837, zoom: 13 },
            'Tabriz': { lat: 38.0804, lng: 46.2919, zoom: 13 }
          },
          'IL': {
            'Jerusalem': { lat: 31.7683, lng: 35.2137, zoom: 13 },
            'Tel Aviv': { lat: 32.0853, lng: 34.7818, zoom: 13 },
            'Haifa': { lat: 32.7940, lng: 34.9896, zoom: 13 },
            'Rishon LeZion': { lat: 31.9730, lng: 34.8065, zoom: 13 },
            'Petah Tikva': { lat: 32.0878, lng: 34.8878, zoom: 13 }
          },
          'SA': {
            'Riyadh': { lat: 24.7136, lng: 46.6753, zoom: 13 },
            'Jeddah': { lat: 21.4858, lng: 39.1925, zoom: 13 },
            'Mecca': { lat: 21.3891, lng: 39.8579, zoom: 13 },
            'Medina': { lat: 24.5247, lng: 39.5692, zoom: 13 },
            'Dammam': { lat: 26.4282, lng: 50.1020, zoom: 13 }
          },
          'VE': {
            'Caracas': { lat: 10.4806, lng: -66.9036, zoom: 13 },
            'Maracaibo': { lat: 10.6666, lng: -71.6333, zoom: 13 },
            'Valencia': { lat: 10.1621, lng: -68.0078, zoom: 13 },
            'Barquisimeto': { lat: 10.0647, lng: -69.3570, zoom: 13 }
          },
          'NG': {
            'Lagos': { lat: 6.5244, lng: 3.3792, zoom: 13 },
            'Kano': { lat: 12.0022, lng: 8.5920, zoom: 13 },
            'Ibadan': { lat: 7.3775, lng: 3.9470, zoom: 13 },
            'Abuja': { lat: 9.0579, lng: 7.4951, zoom: 13 },
            'Port Harcourt': { lat: 4.8156, lng: 7.0498, zoom: 13 }
          },
          'GH': {
            'Accra': { lat: 5.6037, lng: -0.1870, zoom: 13 },
            'Kumasi': { lat: 6.6885, lng: -1.6244, zoom: 13 },
            'Tamale': { lat: 9.4008, lng: -0.8393, zoom: 13 },
            'Cape Coast': { lat: 5.1053, lng: -1.2466, zoom: 13 }
          },
          'NL': {
            'Amsterdam': { lat: 52.3676, lng: 4.9041, zoom: 13 },
            'Rotterdam': { lat: 51.9225, lng: 4.4792, zoom: 13 },
            'The Hague': { lat: 52.0705, lng: 4.3007, zoom: 13 },
            'Utrecht': { lat: 52.0907, lng: 5.1214, zoom: 13 },
            'Eindhoven': { lat: 51.4416, lng: 5.4697, zoom: 13 },
            'Tilburg': { lat: 51.5555, lng: 5.0913, zoom: 13 }
          },
          'CH': {
            'Zurich': { lat: 47.3769, lng: 8.5417, zoom: 13 },
            'Geneva': { lat: 46.2044, lng: 6.1432, zoom: 13 },
            'Basel': { lat: 47.5596, lng: 7.5886, zoom: 13 },
            'Lausanne': { lat: 46.5197, lng: 6.6323, zoom: 13 },
            'Bern': { lat: 46.9481, lng: 7.4474, zoom: 13 },
            'Winterthur': { lat: 47.4979, lng: 8.7240, zoom: 13 }
          },
          'AT': {
            'Vienna': { lat: 48.2082, lng: 16.3738, zoom: 13 },
            'Graz': { lat: 47.0707, lng: 15.4395, zoom: 13 },
            'Linz': { lat: 48.3069, lng: 14.2858, zoom: 13 },
            'Salzburg': { lat: 47.8095, lng: 13.0550, zoom: 13 },
            'Innsbruck': { lat: 47.2692, lng: 11.4041, zoom: 13 },
            'Klagenfurt': { lat: 46.6247, lng: 14.3055, zoom: 13 }
          },
          'SE': {
            'Stockholm': { lat: 59.3293, lng: 18.0686, zoom: 13 },
            'Gothenburg': { lat: 57.7089, lng: 11.9746, zoom: 13 },
            'Malmö': { lat: 55.6050, lng: 13.0038, zoom: 13 },
            'Uppsala': { lat: 59.8586, lng: 17.6389, zoom: 13 },
            'Västerås': { lat: 59.6162, lng: 16.5528, zoom: 13 },
            'Örebro': { lat: 59.2741, lng: 15.2066, zoom: 13 }
          },
          'NO': {
            'Oslo': { lat: 59.9139, lng: 10.7522, zoom: 13 },
            'Bergen': { lat: 60.3913, lng: 5.3221, zoom: 13 },
            'Trondheim': { lat: 63.4305, lng: 10.3951, zoom: 13 },
            'Stavanger': { lat: 58.9700, lng: 5.7331, zoom: 13 },
            'Kristiansand': { lat: 58.1599, lng: 7.9956, zoom: 13 },
            'Tromsø': { lat: 69.6492, lng: 18.9553, zoom: 13 }
          },
          'DK': {
            'Copenhagen': { lat: 55.6761, lng: 12.5683, zoom: 13 },
            'Aarhus': { lat: 56.1629, lng: 10.2039, zoom: 13 },
            'Odense': { lat: 55.4038, lng: 10.4024, zoom: 13 },
            'Aalborg': { lat: 57.0488, lng: 9.9217, zoom: 13 },
            'Esbjerg': { lat: 55.4669, lng: 8.4520, zoom: 13 },
            'Randers': { lat: 56.4607, lng: 10.0369, zoom: 13 }
          },
          'VN': {
            'Ho Chi Minh City': { lat: 10.8231, lng: 106.6297, zoom: 13 },
            'Hanoi': { lat: 21.0285, lng: 105.8542, zoom: 13 },
            'Da Nang': { lat: 16.0471, lng: 108.2068, zoom: 13 },
            'Hai Phong': { lat: 20.8449, lng: 106.6881, zoom: 13 },
            'Can Tho': { lat: 10.0452, lng: 105.7469, zoom: 13 },
            'Hue': { lat: 16.4637, lng: 107.5909, zoom: 13 }
          },
          'SG': {
            'Singapore': { lat: 1.3521, lng: 103.8198, zoom: 13 }
          },
          'MY': {
            'Kuala Lumpur': { lat: 3.1390, lng: 101.6869, zoom: 13 },
            'George Town': { lat: 5.4164, lng: 100.3327, zoom: 13 },
            'Johor Bahru': { lat: 1.4927, lng: 103.7414, zoom: 13 },
            'Ipoh': { lat: 4.5975, lng: 101.0901, zoom: 13 },
            'Shah Alam': { lat: 3.0733, lng: 101.5185, zoom: 13 },
            'Petaling Jaya': { lat: 3.1073, lng: 101.6067, zoom: 13 }
          },
          'ID': {
            'Jakarta': { lat: -6.2088, lng: 106.8456, zoom: 13 },
            'Surabaya': { lat: -7.2575, lng: 112.7521, zoom: 13 },
            'Medan': { lat: 3.5952, lng: 98.6722, zoom: 13 },
            'Bandung': { lat: -6.9175, lng: 107.6191, zoom: 13 },
            'Bekasi': { lat: -6.2383, lng: 106.9756, zoom: 13 },
            'Tangerang': { lat: -6.1783, lng: 106.6319, zoom: 13 }
          },
          'PH': {
            'Manila': { lat: 14.5995, lng: 120.9842, zoom: 13 },
            'Quezon City': { lat: 14.6760, lng: 121.0437, zoom: 13 },
            'Caloocan': { lat: 14.6507, lng: 120.9668, zoom: 13 },
            'Davao': { lat: 7.1907, lng: 125.4553, zoom: 13 },
            'Cebu City': { lat: 10.3157, lng: 123.8854, zoom: 13 },
            'Zamboanga': { lat: 6.9214, lng: 122.0790, zoom: 13 }
          },
          'PK': {
            'Karachi': { lat: 24.8607, lng: 67.0011, zoom: 13 },
            'Lahore': { lat: 31.5204, lng: 74.3587, zoom: 13 },
            'Faisalabad': { lat: 31.4504, lng: 73.1350, zoom: 13 },
            'Rawalpindi': { lat: 33.5651, lng: 73.0169, zoom: 13 },
            'Gujranwala': { lat: 32.1877, lng: 74.1945, zoom: 13 },
            'Peshawar': { lat: 34.0151, lng: 71.5249, zoom: 13 }
          },
          'BD': {
            'Dhaka': { lat: 23.8103, lng: 90.4125, zoom: 13 },
            'Chittagong': { lat: 22.3569, lng: 91.7832, zoom: 13 },
            'Khulna': { lat: 22.8456, lng: 89.5403, zoom: 13 },
            'Rajshahi': { lat: 24.3745, lng: 88.6042, zoom: 13 },
            'Sylhet': { lat: 24.8949, lng: 91.8687, zoom: 13 },
            'Barisal': { lat: 22.7010, lng: 90.3535, zoom: 13 }
          }
        };
        
        // Hierarchical zoom: State > Country
        
        if (selectedState && selectedState !== 'all') {
          // Priority 1: Zoom to specific state/province
          const stateCoord = stateCoords[selectedCountry]?.[selectedState];
          
          if (stateCoord) {
            map.panTo({ lat: stateCoord.lat, lng: stateCoord.lng });
            map.setZoom(stateCoord.zoom);
            map.setTilt(30); // Medium 3D effect for state view
            return;
          }
        }
        
        // Priority 2: Zoom to country when country is selected
        const coords = countryCoords[selectedCountry];
        if (coords) {
          map.panTo({ lat: coords.lat, lng: coords.lng });
          map.setZoom(coords.zoom);
          map.setTilt(20); // Slight 3D effect for country view
        }
      } else {
        // Default: Global satellite view when no country selected
        map.panTo({ lat: 20, lng: 0 });
        map.setZoom(3);
        map.setTilt(0);
      }
    }
  }, [selectedCountry, selectedState, isLoading]);


  if (error) {
    return (
      <div className="w-full h-full bg-slate-900 rounded-lg p-6 overflow-auto">
        <div className="mb-6 text-center">
          <div className="text-blue-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Traveler Locations</h3>
          <p className="text-gray-400 text-sm">
            Development mode - {users.length} travelers discovered
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <div 
              key={user.id} 
              className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 transition-colors cursor-pointer border border-slate-700"
              onClick={() => onUserClick?.(user)}
            >
              <div className="flex items-center space-x-3">
                <img 
                  src={user.profileImageUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'} 
                  alt={user.displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">{user.displayName}</h4>
                  <p className="text-gray-400 text-sm truncate">@{user.username}</p>
                  <div className="flex items-center text-gray-500 text-xs mt-1">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {user.city}, {user.country}
                  </div>
                </div>
              </div>
              {user.interests && user.interests.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {user.interests.slice(0, 2).map((interest) => (
                    <span 
                      key={interest} 
                      className="bg-blue-900/50 text-blue-300 text-xs px-2 py-1 rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                  {user.interests.length > 2 && (
                    <span className="text-gray-400 text-xs px-2 py-1">
                      +{user.interests.length - 2} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-slate-900">
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