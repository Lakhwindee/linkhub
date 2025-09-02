import { useRef, useEffect } from 'react';
import Globe from 'globe.gl';

interface GlobeProps {
  users: any[];
  width?: number;
  height?: number;
  userLocation?: [number, number] | null;
}

export default function Globe3D({ users, width = 500, height = 500, userLocation }: GlobeProps) {
  const globeRef = useRef<HTMLDivElement>(null);
  const globeInstanceRef = useRef<any>(null);

  // Initialize 3D Globe
  useEffect(() => {
    if (!globeRef.current || globeInstanceRef.current) return;
    
    const initGlobe = () => {
      // Create 3D Globe instance
      const globe = new Globe()
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .backgroundColor('rgba(0,0,0,0)')
        .showAtmosphere(true)
        .atmosphereColor('lightblue')
        .atmosphereAltitude(0.15)
        .width(width)
        .height(height);
      
      globeInstanceRef.current = globe;
      globe(globeRef.current);
      
      // Auto-rotate
      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 0.5;
      globe.controls().enableZoom = true;
      globe.controls().minDistance = 150;
      globe.controls().maxDistance = 800;
      
      // Enable pointer interactions
      globe.controls().enableDamping = true;
      globe.controls().dampingFactor = 0.1;
    };
    
    initGlobe();
    
    // Cleanup
    return () => {
      if (globeInstanceRef.current) {
        globeInstanceRef.current._destructor?.();
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

  return (
    <div className="relative flex items-center justify-center">
      <div 
        ref={globeRef} 
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
        }}
      />
    </div>
  );
}