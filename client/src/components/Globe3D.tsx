import { useRef, useEffect, useState } from 'react';
import Globe from 'globe.gl';
import type { User } from '@shared/schema';

interface GlobeMarker {
  lat: number;
  lng: number;
  user: User;
  color: string;
  size: number;
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
  const globeRef = useRef<HTMLDivElement>(null);
  const globeInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prepare markers
  const markers: GlobeMarker[] = users
    .filter(user => user.lat && user.lng && user.showOnMap)
    .map(user => ({
      lat: user.lat!,
      lng: user.lng!,
      user,
      color: user.plan === 'creator' ? '#10b981' : user.plan === 'traveler' ? '#3b82f6' : '#6b7280',
      size: user.plan === 'creator' ? 0.8 : 0.6
    }));

  // Initialize 3D Globe with error handling
  useEffect(() => {
    if (!globeRef.current || globeInstanceRef.current) return;
    
    const initGlobe = () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if Globe is available
        if (typeof Globe === 'undefined' || !Globe) {
          throw new Error('Globe.gl library not loaded');
        }
        
        console.log('Initializing globe with markers:', markers.length);
        
        const globe = Globe()
          // Use reliable satellite imagery
          .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
          .showAtmosphere(true)
          .atmosphereColor('#4FC3F7')
          .atmosphereAltitude(0.1)
          .backgroundColor('rgba(0, 0, 20, 0.9)')
          .width(width)
          .height(height)
          .enablePointerInteraction(true)
          
          // Add user markers
          .pointsData(markers)
          .pointAltitude(0.01)
          .pointColor('color')
          .pointRadius('size')
          .pointResolution(6)
          .pointsMerge(false)
          
          // Event handlers
          .onPointClick((point: any) => {
            if (onUserClick && point.user) {
              onUserClick(point.user);
            }
          })
          .onPointHover((point: any) => {
            if (point) {
              document.body.style.cursor = 'pointer';
            } else {
              document.body.style.cursor = 'auto';
            }
          });
        
        globeInstanceRef.current = globe;
        
        // Mount the globe
        if (globeRef.current) {
          globe(globeRef.current);
        }
        
        // Setup controls after a delay
        setTimeout(() => {
          try {
            if (globeInstanceRef.current) {
              const controls = globe.controls();
              if (controls) {
                controls.autoRotate = true;
                controls.autoRotateSpeed = 0.3;
                controls.enableZoom = true;
                controls.enablePan = true;
                controls.enableDamping = true;
                controls.dampingFactor = 0.1;
                controls.minDistance = 150;
                controls.maxDistance = 800;
              }
              
              // Set initial view
              globe.pointOfView({ lat: 0, lng: 0, altitude: 3 }, 1000);
              
              console.log('Globe initialized successfully');
              setIsLoading(false);
            }
          } catch (controlsErr) {
            console.warn('Controls setup failed:', controlsErr);
            setIsLoading(false); // Still show the globe even if controls fail
          }
        }, 2000);
        
      } catch (err) {
        console.error('Globe initialization failed:', err);
        setError('Failed to load 3D Globe. Please refresh the page.');
        setIsLoading(false);
      }
    };
    
    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(initGlobe, 100);
    
    return () => {
      clearTimeout(timer);
      if (globeInstanceRef.current) {
        try {
          const globe = globeInstanceRef.current;
          if (globe._destructor) {
            globe._destructor();
          }
          globeInstanceRef.current = null;
        } catch (err) {
          console.error('Globe cleanup error:', err);
        }
      }
    };
  }, [width, height]);

  // Update markers when data changes
  useEffect(() => {
    if (globeInstanceRef.current && !isLoading) {
      globeInstanceRef.current.pointsData(markers);
    }
  }, [markers, isLoading]);

  // Handle country/city focus
  useEffect(() => {
    if (globeInstanceRef.current && !isLoading) {
      const globe = globeInstanceRef.current;
      
      if (selectedCountry && selectedCountry !== 'all') {
        // Country coordinates mapping
        const countryCoords: Record<string, { lat: number, lng: number, altitude: number }> = {
          'GB': { lat: 54.7753, lng: -2.3508, altitude: 2.0 },
          'US': { lat: 39.8283, lng: -98.5795, altitude: 2.0 },
          'IN': { lat: 20.5937, lng: 78.9629, altitude: 2.0 },
          'FR': { lat: 46.6034, lng: 1.8883, altitude: 2.0 },
          'DE': { lat: 51.1657, lng: 10.4515, altitude: 2.0 },
          'JP': { lat: 36.2048, lng: 138.2529, altitude: 2.0 },
          'AU': { lat: -25.2744, lng: 133.7751, altitude: 2.0 },
        };
        
        const coords = countryCoords[selectedCountry];
        if (coords) {
          // Stop auto-rotation when focusing on country
          globe.controls().autoRotate = false;
          globe.pointOfView(coords, 1500);
        }
      } else {
        // Resume auto-rotation when viewing globally
        globe.controls().autoRotate = true;
        globe.pointOfView({ lat: 0, lng: 0, altitude: 2.5 }, 1000);
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <h3 className="text-lg font-semibold text-white mb-2">Loading Google Earth Globe</h3>
          <p className="text-gray-400 text-sm">Preparing 3D satellite Earth...</p>
        </div>
      )}
      
      <div 
        ref={globeRef} 
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
            🌍 Rotate • Zoom • Auto-spinning like Google Earth
          </div>
        </div>
      )}
    </div>
  );
}