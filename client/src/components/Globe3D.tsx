import { useRef, useEffect, useState, useCallback } from 'react';
import Globe from 'globe.gl';
import type { User } from '@shared/schema';

interface Globe3DProps {
  users: User[];
  width?: number;
  height?: number;
  onUserClick?: (user: User) => void;
  selectedCountry?: string;
  selectedCity?: string;
}

interface GlobeMarker {
  lat: number;
  lng: number;
  user: User;
  color: string;
  size: number;
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

  // Memoize markers to prevent unnecessary recalculations
  const markers: GlobeMarker[] = users
    .filter(user => user.lat && user.lng && user.showOnMap)
    .map(user => ({
      lat: user.lat!,
      lng: user.lng!,
      user,
      color: user.plan === 'creator' ? '#10b981' : user.plan === 'traveler' ? '#3b82f6' : '#6b7280',
      size: user.plan === 'creator' ? 0.8 : 0.6
    }));

  // Initialize globe with performance optimizations
  useEffect(() => {
    if (!globeRef.current || globeInstanceRef.current) return;
    
    const initGlobe = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const globe = (Globe as any)()
          .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg') // Better night-style texture
          .backgroundColor('rgba(0, 0, 0, 0.9)') // Darker space-like background
          .showAtmosphere(true)
          .atmosphereColor('#4F94CD') // More natural atmosphere color
          .atmosphereAltitude(0.08) // Thinner atmosphere like Apple Maps
          .width(width)
          .height(height)
          // Fix for preventing multiple globe copies
          .showGraticules(false)
          .enablePointerInteraction(true)
          // Performance optimizations
          .rendererConfig({ 
            antialias: false, // Disable for better performance
            alpha: true,
            powerPreference: 'high-performance'
          })
          // Optimize points rendering
          .pointsData(markers)
          .pointAltitude(0.01)
          .pointColor('color')
          .pointRadius('size')
          .pointResolution(8) // Lower resolution for better performance
          .pointsMerge(true) // Merge geometries for better performance
          // Add interaction
          .onPointClick((point: any) => {
            if (onUserClick && point.user) {
              onUserClick(point.user);
            }
          })
          .onPointHover((point: any) => {
            globe.controls().enabled = !point; // Disable controls on hover for better UX
            if (point) {
              document.body.style.cursor = 'pointer';
            } else {
              document.body.style.cursor = 'auto';
            }
          });
        
        globeInstanceRef.current = globe;
        globe(globeRef.current);
        
        // Configure controls for smooth interaction and set default view
        setTimeout(() => {
          if (globeInstanceRef.current) {
            const controls = globe.controls();
            controls.autoRotate = false; // Turn off auto-rotate like Apple Maps
            controls.enableZoom = true;
            controls.enablePan = true;
            controls.enableDamping = true;
            controls.dampingFactor = 0.05; // Smoother damping like Apple Maps
            controls.minDistance = 50; // Very close zoom like Apple Maps
            controls.maxDistance = 2000; // Much more zoom out capability
            controls.minPolarAngle = 0;
            controls.maxPolarAngle = Math.PI;
            
            // Apple Maps-like smooth controls
            controls.rotateSpeed = 0.5;
            controls.zoomSpeed = 1.2;
            controls.panSpeed = 1.0;
            
            // Set default view to show full Earth properly
            globe.pointOfView({ lat: 0, lng: 0, altitude: 2.2 }, 1000);
            
            setIsLoading(false);
          }
        }, 1000);
        
      } catch (err) {
        console.error('Globe initialization error:', err);
        setError('Failed to load 3D Globe');
        setIsLoading(false);
      }
    };
    
    initGlobe();
    
    return () => {
      if (globeInstanceRef.current) {
        try {
          globeInstanceRef.current._destructor?.();
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
          'GB': { lat: 54.7753, lng: -2.3508, altitude: 2.5 },
          'US': { lat: 39.8283, lng: -98.5795, altitude: 2.5 },
          'IN': { lat: 20.5937, lng: 78.9629, altitude: 2.5 },
          'FR': { lat: 46.6034, lng: 1.8883, altitude: 2.5 },
          'DE': { lat: 51.1657, lng: 10.4515, altitude: 2.5 },
          'JP': { lat: 36.2048, lng: 138.2529, altitude: 2.5 },
          'AU': { lat: -25.2744, lng: 133.7751, altitude: 2.5 },
        };
        
        const coords = countryCoords[selectedCountry];
        if (coords) {
          globe.pointOfView(coords, 1500);
        }
      } else {
        // Reset to global view - show full Earth
        globe.pointOfView({ lat: 0, lng: 0, altitude: 2.5 }, 2000);
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
          The 3D globe could not be initialized. Please refresh the page or try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="relative bg-slate-900 rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <h3 className="text-lg font-semibold text-white mb-2">Loading 3D Globe</h3>
          <p className="text-gray-400 text-sm">Initializing world map...</p>
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
            Drag to rotate • Scroll to zoom
          </div>
        </div>
      )}
    </div>
  );
}