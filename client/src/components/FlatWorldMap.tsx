import { useMemo } from 'react';
import type { User } from '@shared/schema';

interface FlatWorldMapProps {
  users: User[];
  onUserClick?: (user: User) => void;
  showTravellers?: boolean;
}

export default function FlatWorldMap({ 
  users = [], 
  onUserClick,
  showTravellers = true 
}: FlatWorldMapProps) {
  const validUsers = useMemo(() => {
    if (!showTravellers) return [];
    return users.filter(u => u.lat !== undefined && u.lng !== undefined && u.lat !== null && u.lng !== null);
  }, [users, showTravellers]);

  const latLngToXY = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  return (
    <div className="w-full h-full bg-slate-800 relative overflow-hidden">
      <svg 
        viewBox="0 0 100 50" 
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
        
        <rect width="100" height="50" fill="url(#oceanGradient)" />
        
        <g fill="#2d4a3e" opacity="0.8">
          <ellipse cx="25" cy="18" rx="12" ry="6" />
          <ellipse cx="28" cy="24" rx="4" ry="3" />
          <ellipse cx="22" cy="30" rx="6" ry="8" />
          <ellipse cx="18" cy="42" rx="3" ry="4" />
          
          <ellipse cx="52" cy="15" rx="8" ry="5" />
          <ellipse cx="55" cy="22" rx="10" ry="6" />
          <ellipse cx="50" cy="30" rx="5" ry="4" />
          
          <ellipse cx="70" cy="18" rx="12" ry="8" />
          <ellipse cx="75" cy="28" rx="8" ry="5" />
          <ellipse cx="68" cy="35" rx="4" ry="3" />
          
          <ellipse cx="85" cy="38" rx="6" ry="4" />
          <ellipse cx="88" cy="42" rx="3" ry="2" />
        </g>
        
        <g>
          {validUsers.map((user, index) => {
            const { x, y } = latLngToXY(Number(user.lat), Number(user.lng));
            const isCreator = user.plan === 'creator';
            
            return (
              <g 
                key={user.id || index}
                onClick={() => onUserClick?.(user)}
                className="cursor-pointer"
                style={{ pointerEvents: 'all' }}
              >
                <circle
                  cx={x}
                  cy={y / 2}
                  r={isCreator ? 1.2 : 0.8}
                  fill={isCreator ? '#fbbf24' : '#3b82f6'}
                  stroke="white"
                  strokeWidth="0.2"
                  className="hover:opacity-80 transition-opacity"
                />
                <circle
                  cx={x}
                  cy={y / 2}
                  r={isCreator ? 2 : 1.5}
                  fill={isCreator ? '#fbbf24' : '#3b82f6'}
                  opacity="0.3"
                  className="animate-ping"
                  style={{ animationDuration: '2s' }}
                />
              </g>
            );
          })}
        </g>
      </svg>
      
      <div className="absolute bottom-4 left-4 bg-slate-900/80 rounded-lg p-3 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span className="text-white text-xs">Creators</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span className="text-white text-xs">Travelers</span>
          </div>
        </div>
        <p className="text-gray-400 text-xs mt-2">
          {validUsers.length} travelers on map
        </p>
      </div>
      
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/80 rounded-lg px-4 py-2">
        <h2 className="text-white font-semibold text-lg">World Map</h2>
        <p className="text-gray-400 text-xs">Click on a traveler to view profile</p>
      </div>
    </div>
  );
}
