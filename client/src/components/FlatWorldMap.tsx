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

  const latLngToPercent = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
      <svg 
        viewBox="0 0 1000 500" 
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="oceanBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0c4a6e" />
            <stop offset="50%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#0c4a6e" />
          </linearGradient>
          <linearGradient id="landGreen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#166534" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>
        </defs>
        
        <rect width="1000" height="500" fill="url(#oceanBg)" />
        
        <g fill="url(#landGreen)" stroke="#15803d" strokeWidth="1">
          <path d="M140,80 Q180,60 220,70 Q260,80 280,100 Q290,130 270,160 Q250,180 220,190 Q180,195 150,180 Q130,160 120,130 Q120,100 140,80 Z" />
          <path d="M180,200 Q220,190 250,210 Q270,240 260,280 Q240,320 200,350 Q160,370 130,350 Q110,320 120,280 Q140,240 180,200 Z" />
          <path d="M200,360 Q230,350 250,370 Q260,400 240,430 Q210,450 180,440 Q160,420 170,390 Q180,365 200,360 Z" />
          
          <path d="M420,60 Q500,40 580,50 Q660,70 700,100 Q730,130 720,170 Q700,200 650,220 Q580,240 500,230 Q440,210 420,170 Q400,130 420,60 Z" />
          <path d="M450,180 Q520,160 580,180 Q620,210 610,260 Q580,310 520,340 Q450,360 400,330 Q370,290 390,240 Q420,200 450,180 Z" />
          <path d="M470,350 Q520,330 560,350 Q590,380 570,420 Q530,460 470,450 Q430,430 440,390 Q450,360 470,350 Z" />
          
          <path d="M700,100 Q780,80 850,100 Q900,140 920,200 Q930,270 900,340 Q850,390 780,400 Q720,390 680,350 Q650,300 660,240 Q680,170 700,100 Z" />
          <path d="M730,250 Q800,220 860,250 Q900,300 880,360 Q840,410 770,420 Q700,410 680,360 Q680,300 730,250 Z" />
          
          <path d="M820,380 Q870,360 920,380 Q960,410 950,450 Q920,480 860,485 Q800,480 790,450 Q795,410 820,380 Z" />
          <path d="M880,420 Q920,400 950,420 Q970,450 950,470 Q920,490 880,480 Q860,460 870,440 Q875,425 880,420 Z" />
        </g>
        
        <g opacity="0.3" fill="none" stroke="#94a3b8" strokeWidth="0.5">
          <line x1="0" y1="250" x2="1000" y2="250" />
          <line x1="0" y1="166" x2="1000" y2="166" strokeDasharray="5,5" />
          <line x1="0" y1="334" x2="1000" y2="334" strokeDasharray="5,5" />
          <line x1="500" y1="0" x2="500" y2="500" />
        </g>
        
        {validUsers.map((user, index) => {
          const { x, y } = latLngToPercent(Number(user.lat), Number(user.lng));
          const isCreator = user.plan === 'creator';
          const cx = x * 10;
          const cy = y * 5;
          
          return (
            <g 
              key={user.id || index}
              onClick={() => onUserClick?.(user)}
              className="cursor-pointer"
              style={{ pointerEvents: 'all' }}
            >
              <circle
                cx={cx}
                cy={cy}
                r="12"
                fill={isCreator ? '#fbbf24' : '#3b82f6'}
                stroke="white"
                strokeWidth="3"
                className="drop-shadow-lg"
              />
              <circle
                cx={cx}
                cy={cy}
                r="20"
                fill={isCreator ? '#fbbf24' : '#3b82f6'}
                opacity="0.4"
              >
                <animate attributeName="r" values="12;25;12" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}
      </svg>
      
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full border border-white"></div>
            <span className="text-white text-xs">Creators</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
            <span className="text-white text-xs">Travelers</span>
          </div>
        </div>
        <p className="text-gray-300 text-xs mt-2">
          {validUsers.length} travelers on map
        </p>
      </div>
      
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
        <h2 className="text-white font-semibold text-lg text-center">Discover Travelers</h2>
        <p className="text-gray-300 text-xs text-center">Click on a dot to view profile</p>
      </div>
    </div>
  );
}
