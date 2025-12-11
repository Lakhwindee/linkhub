import { useState, useEffect, useRef } from 'react';
import type { User, Stay } from '@shared/schema';

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
  users = [], 
  width = typeof window !== 'undefined' ? window.innerWidth : 1024,
  height = typeof window !== 'undefined' ? window.innerHeight : 768,
  onUserClick,
  selectedCountry,
  selectedState,
  showTravellers = true,
  showStays = true
}: Globe3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initGlobe = async () => {
      try {
        // Dynamically import globe.gl
        const Globe = (await import('globe.gl')).default;
        
        if (!canvasRef.current) {
          setIsLoading(false);
          return;
        }

        // Initialize globe
        const globe = Globe()
          .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe@2/example/img/earth-blue-marble.jpg')
          .bumpImageUrl('//cdn.jsdelivr.net/npm/three-globe@2/example/img/earth-topology.png')
          .backgroundImageUrl('//cdn.jsdelivr.net/npm/three-globe@2/example/img/night-sky.png')
          .width(width)
          .height(height)
          .pointOfView({ lat: 20, lng: 0, altitude: 2.5 });

        globe(canvasRef.current);
        globeRef.current = globe;

        // Add traveler points if enabled
        if (showTravellers && users.length > 0) {
          const points = users
            .filter(u => u.lat && u.lng)
            .map(user => ({
              lat: user.lat,
              lng: user.lng,
              size: user.plan === 'creator' ? 1.5 : 1,
              color: user.plan === 'creator' ? '#fbbf24' : '#3b82f6',
              userData: user
            }));

          globe.pointsData(points)
            .pointColor(d => (d as any).color)
            .pointSize(d => (d as any).size)
            .pointAltitude(0.01)
            .onPointClick(d => {
              const point = d as any;
              if (point.userData && onUserClick) {
                onUserClick(point.userData);
              }
            });
        }

        // Auto-rotate
        globe.controls().autoRotate = true;
        globe.controls().autoRotateSpeed = 2;

        setIsLoading(false);

        // Handle window resize
        const handleResize = () => {
          const newWidth = window.innerWidth;
          const newHeight = window.innerHeight;
          globe.width(newWidth).height(newHeight);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);

      } catch (error) {
        console.error('Failed to initialize globe:', error);
        setIsLoading(false);
      }
    };

    initGlobe();
  }, [users, width, height, onUserClick, showTravellers]);

  return (
    <div className="w-full h-full relative bg-slate-900">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-white font-semibold">Loading World Map...</p>
          </div>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
      
      {/* Info overlay */}
      <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur text-white px-4 py-2 rounded-lg text-sm">
        <div className="font-semibold">🗺️ World Map</div>
        <div className="text-gray-300 text-xs">{users.filter(u => u.lat && u.lng).length} travelers worldwide</div>
      </div>
    </div>
  );
}
