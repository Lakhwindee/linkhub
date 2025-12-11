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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const init = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const Globe = (await import('globe.gl')).default;
        
        // Get actual canvas dimensions
        const container = canvasRef.current?.parentElement;
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        console.log('Initializing globe with dimensions:', width, height);

        // Create globe instance
        const world = Globe()
          .width(width)
          .height(height)
          .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe@2/example/img/earth-blue-marble.jpg')
          .bumpImageUrl('//cdn.jsdelivr.net/npm/three-globe@2/example/img/earth-topology.png');

        // Mount to canvas
        world(canvasRef.current);

        // Add traveler points
        if (showTravellers && users.length > 0) {
          const points = users
            .filter(u => u.lat && u.lng)
            .map(user => ({
              lat: user.lat,
              lng: user.lng,
              size: 1,
              color: user.plan === 'creator' ? '#fbbf24' : '#3b82f6',
              user: user
            }));

          if (points.length > 0) {
            console.log('Adding traveler points:', points.length);
            world
              .pointsData(points)
              .pointColor((d: any) => d.color)
              .pointSize((d: any) => d.size)
              .pointAltitude(0.01)
              .onPointClick((d: any) => {
                if (onUserClick && d.user) {
                  onUserClick(d.user);
                }
              });
          }
        }

        // Enable auto-rotation
        if (world.controls) {
          world.controls().autoRotate = true;
          world.controls().autoRotateSpeed = 2;
        }

        globeRef.current = world;
        console.log('Globe initialized successfully');
        setLoading(false);

        // Handle resize
        const handleResize = () => {
          const container = canvasRef.current?.parentElement;
          if (container) {
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            world.width(newWidth).height(newHeight);
          }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);

      } catch (err) {
        console.error('Globe init error:', err);
        setLoading(false);
      }
    };

    init();
  }, [users, onUserClick, showTravellers]);

  return (
    <div className="w-full h-full relative bg-slate-950">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/95 z-50">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-white text-sm">Loading world map...</p>
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
      <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur text-white px-3 py-2 rounded z-10 text-xs">
        <div className="font-bold">🌍 World Map</div>
        <div className="text-gray-300">{users.filter(u => u.lat && u.lng).length} travelers</div>
      </div>
    </div>
  );
}
