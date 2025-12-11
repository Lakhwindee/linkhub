import { useState, useEffect, useRef } from 'react';
import type { User } from '@shared/schema';

interface Globe3DProps {
  users: User[];
  onUserClick?: (user: User) => void;
  selectedCountry?: string;
  selectedState?: string;
  showTravellers?: boolean;
}

export default function Globe3D({ 
  users = [], 
  onUserClick,
  selectedCountry,
  selectedState,
  showTravellers = true
}: Globe3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initGlobe = async () => {
      try {
        if (!containerRef.current) {
          console.log('No container ref');
          return;
        }

        // Import Globe
        const GlobeGL = (await import('globe.gl')).default;
        console.log('Globe.gl imported successfully');

        // Get viewport dimensions
        const width = window.innerWidth;
        const height = window.innerHeight;
        console.log('Creating globe with dimensions:', width, height);

        // Create globe
        const world = GlobeGL()
          .width(width)
          .height(height)
          .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe@2/example/img/earth-blue-marble.jpg')
          .bumpImageUrl('//cdn.jsdelivr.net/npm/three-globe@2/example/img/earth-topology.png');

        // Render to container
        world(containerRef.current);
        console.log('Globe mounted to container');

        // Add traveler points
        if (showTravellers && users.length > 0) {
          const validUsers = users.filter(u => u.lat !== undefined && u.lng !== undefined);
          console.log('Valid users with coords:', validUsers.length, validUsers);

          if (validUsers.length > 0) {
            const points = validUsers.map(user => ({
              lat: user.lat,
              lng: user.lng,
              size: user.plan === 'creator' ? 1.2 : 0.8,
              color: user.plan === 'creator' ? '#fbbf24' : '#3b82f6',
              user: user
            }));

            world
              .pointsData(points)
              .pointColor((d: any) => d.color)
              .pointSize((d: any) => d.size)
              .pointAltitude(0.01)
              .onPointClick((d: any) => {
                console.log('Clicked point:', d.user);
                if (onUserClick && d.user) {
                  onUserClick(d.user);
                }
              });
            console.log('Points added to globe:', points.length);
          }
        }

        // Auto-rotate
        if (world.controls?.()) {
          world.controls().autoRotate = true;
          world.controls().autoRotateSpeed = 2;
          console.log('Auto-rotate enabled');
        }

        setLoading(false);

        // Handle window resize
        const handleResize = () => {
          const newWidth = window.innerWidth;
          const newHeight = window.innerHeight;
          world.width(newWidth).height(newHeight);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);

      } catch (error) {
        console.error('❌ Globe initialization error:', error);
        setLoading(false);
      }
    };

    // Small delay to ensure container is mounted
    const timer = setTimeout(initGlobe, 100);
    return () => clearTimeout(timer);

  }, [users, onUserClick, showTravellers]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-slate-950 relative"
    >
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-40">
          <div className="animate-spin h-8 w-8 border-4 border-blue-400 border-t-transparent rounded-full mb-3"></div>
          <p className="text-white text-sm font-medium">🌍 Loading World Map...</p>
        </div>
      )}
      <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur text-white px-3 py-2 rounded text-xs z-10 pointer-events-none">
        <div className="font-bold">World Map</div>
        <div className="text-gray-300">{users.filter(u => u.lat && u.lng).length} travelers</div>
      </div>
    </div>
  );
}
