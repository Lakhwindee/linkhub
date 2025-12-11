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
  const [error, setError] = useState<string | null>(null);
  const [globeLoaded, setGlobeLoaded] = useState(false);

  useEffect(() => {
    const initGlobe = async () => {
      try {
        if (!containerRef.current) {
          console.log('No container ref');
          return;
        }

        // Check WebGL support first
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
          setError('WebGL not supported');
          setLoading(false);
          return;
        }

        // Import Globe
        const GlobeGL = (await import('globe.gl')).default;
        console.log('Globe.gl imported');

        // Get container dimensions
        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width || window.innerWidth;
        const height = rect.height || window.innerHeight;
        console.log('Globe dimensions:', { width, height });

        // Create globe
        const world = GlobeGL()
          .width(width)
          .height(height)
          .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe@2/example/img/earth-blue-marble.jpg')
          .bumpImageUrl('//cdn.jsdelivr.net/npm/three-globe@2/example/img/earth-topology.png')
          .backgroundColor('#0f172a');

        // Render to container
        world(containerRef.current);
        console.log('Globe mounted');
        setGlobeLoaded(true);

        // Add traveler points
        if (showTravellers && users && users.length > 0) {
          const validUsers = users.filter(u => u.lat !== undefined && u.lng !== undefined);
          console.log('Valid users:', validUsers.length);

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
                if (onUserClick && d.user) {
                  onUserClick(d.user);
                }
              });
            console.log('Points added:', points.length);
          }
        }

        // Auto-rotate
        if (world.controls?.()) {
          world.controls().autoRotate = true;
          world.controls().autoRotateSpeed = 1.5;
        }

        setLoading(false);

        // Handle resize
        const handleResize = () => {
          const newRect = containerRef.current?.getBoundingClientRect();
          if (newRect) {
            world.width(newRect.width).height(newRect.height);
          }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);

      } catch (err: any) {
        console.error('Globe error:', err);
        setError(err.message || 'Failed to load globe');
        setLoading(false);
      }
    };

    const timer = setTimeout(initGlobe, 100);
    return () => clearTimeout(timer);

  }, [users, onUserClick, showTravellers]);

  // Error state - show a nice fallback
  if (error) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center text-white">
        <div className="text-center max-w-md p-6">
          <div className="text-6xl mb-4">🌍</div>
          <h2 className="text-2xl font-bold mb-2">World Map</h2>
          <p className="text-gray-300 mb-4">
            Interactive 3D globe requires WebGL support.
          </p>
          <div className="bg-slate-700/50 rounded-lg p-4 text-left">
            <p className="text-sm text-gray-400 mb-2">Travelers on the map:</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-sm">Creators</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-sm">Travelers</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Total travelers: {users.filter(u => u.lat && u.lng).length}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Try using Chrome, Firefox, or Edge with hardware acceleration enabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-slate-900"
      style={{ minHeight: '100vh' }}
    >
      {loading && !globeLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-40">
          <div className="animate-spin h-10 w-10 border-4 border-blue-400 border-t-transparent rounded-full mb-4"></div>
          <p className="text-white text-lg font-medium">Loading World Map...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait...</p>
        </div>
      )}
    </div>
  );
}
