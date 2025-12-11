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
        console.log('✅ Globe.gl imported');

        // Get container dimensions
        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width || window.innerWidth;
        const height = rect.height || window.innerHeight;
        console.log('📐 Globe dimensions:', { width, height });

        // Create globe
        const world = GlobeGL()
          .width(width)
          .height(height)
          .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe@2/example/img/earth-blue-marble.jpg')
          .bumpImageUrl('//cdn.jsdelivr.net/npm/three-globe@2/example/img/earth-topology.png');

        // Render to container
        world(containerRef.current);
        console.log('🌍 Globe mounted');

        // Add traveler points
        if (showTravellers && users && users.length > 0) {
          const validUsers = users.filter(u => u.lat !== undefined && u.lng !== undefined);
          console.log('👥 Valid users:', validUsers.length);

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
            console.log('📍 Points added:', points.length);
          }
        }

        // Auto-rotate
        if (world.controls?.()) {
          world.controls().autoRotate = true;
          world.controls().autoRotateSpeed = 2;
          console.log('🔄 Auto-rotate enabled');
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

      } catch (error) {
        console.error('❌ Globe error:', error);
        setLoading(false);
      }
    };

    const timer = setTimeout(initGlobe, 50);
    return () => clearTimeout(timer);

  }, [users, onUserClick, showTravellers]);

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: '#0f172a'
      }}
    >
      {loading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          zIndex: 40
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '4px solid rgb(96, 165, 250)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '12px'
          }} />
          <p style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>Loading map...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
