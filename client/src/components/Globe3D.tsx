import { useRef, useEffect, useState } from 'react';
import Globe from 'globe.gl';

interface GlobeProps {
  users: any[];
  width?: number;
  height?: number;
  userLocation?: [number, number] | null;
  focusLocation?: { lat: number; lng: number; zoom?: number } | null;
}

export default function Globe3D({ users, width = 500, height = 500, userLocation, focusLocation }: GlobeProps) {
  const globeRef = useRef<HTMLDivElement>(null);
  const globeInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize 3D Globe
  useEffect(() => {
    if (!globeRef.current || globeInstanceRef.current) return;
    
    const initGlobe = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Create 3D Globe instance with high quality texture
        const globe = (Globe as any)()
          .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
          .backgroundColor('rgba(0,0,0,0)')
          .showAtmosphere(true)
          .atmosphereColor('lightblue')
          .atmosphereAltitude(0.15)
          .width(width)
          .height(height)
          .rendererConfig({ antialias: true, alpha: true, precision: 'highp' });
        
        globeInstanceRef.current = globe;
        globe(globeRef.current!);
        
        // Wait for globe to load
        setTimeout(() => {
          if (globeInstanceRef.current) {
            // Disable auto-rotate
            globe.controls().autoRotate = false;
            globe.controls().enableZoom = true;
            globe.controls().minDistance = 100; // Allow closer zoom for city details
            globe.controls().maxDistance = 1000; // Allow further zoom for global view
            
            // Enable pointer interactions
            globe.controls().enableDamping = true;
            globe.controls().dampingFactor = 0.1;
            
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
    
    // Cleanup
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

  // Update markers when users data changes
  useEffect(() => {
    if (!globeInstanceRef.current || !users.length) return;

    // Convert users to points data
    const pointsData = users.map(user => ({
      lat: user.lat,
      lng: user.lng,
      size: 0.8,
      color: user.plan === 'creator' ? '#f97316' : user.plan === 'traveler' ? '#22c55e' : '#9ca3af',
      user: user,
    }));

    globeInstanceRef.current
      .pointsData(pointsData)
      .pointAltitude(0.01)
      .pointRadius('size')
      .pointColor('color')
      .pointLabel((d: any) => `
        <div style="
          background: rgba(0,0,0,0.8); 
          color: white; 
          padding: 8px 12px; 
          border-radius: 8px; 
          font-size: 12px;
          max-width: 200px;
        ">
          <div style="font-weight: bold; margin-bottom: 4px;">
            ${d.user.displayName || d.user.username}
          </div>
          <div style="opacity: 0.8;">
            📍 ${d.user.city}, ${d.user.country}
          </div>
          <div style="opacity: 0.8; margin-top: 4px;">
            ${d.user.interests?.slice(0, 2).join(', ') || 'Explorer'}
          </div>
        </div>
      `)
      .onPointClick((point: any) => {
        // Handle point click
        console.log('User clicked:', point.user);
      });

  }, [users]);

  // Handle user location
  useEffect(() => {
    if (userLocation && globeInstanceRef.current) {
      // Rotate globe to user location
      globeInstanceRef.current.pointOfView({ 
        lat: userLocation[0], 
        lng: userLocation[1], 
        altitude: 2 
      }, 1000);
    }
  }, [userLocation]);

  // Handle focus location changes
  useEffect(() => {
    if (focusLocation && globeInstanceRef.current) {
      // Calculate altitude based on zoom level for better detail views
      let altitude = 2.5; // Default global view
      
      if (focusLocation.zoom) {
        if (focusLocation.zoom >= 10) {
          // City level - very close view
          altitude = 1.2;
        } else if (focusLocation.zoom >= 6) {
          // Country level - medium close view  
          altitude = 1.8;
        } else {
          // Regional level - moderate view
          altitude = 2.2;
        }
      }
      
      // Rotate globe to focus location with better detail
      globeInstanceRef.current.pointOfView({ 
        lat: focusLocation.lat, 
        lng: focusLocation.lng, 
        altitude: altitude 
      }, 1500);
    }
  }, [focusLocation]);

  if (error) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: `${width}px`, height: `${height}px` }}>
        <div className="text-white text-center">
          <div className="text-red-400 mb-2">⚠️ Globe Error</div>
          <div className="text-sm opacity-70">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-white text-center">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
            <div className="text-sm opacity-70">Loading 3D Globe...</div>
          </div>
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
    </div>
  );
}