import { useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from 'react-simple-maps';
import type { User } from '@shared/schema';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

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
    return users.filter(u => 
      u.lat !== undefined && 
      u.lng !== undefined && 
      u.lat !== null && 
      u.lng !== null
    );
  }, [users, showTravellers]);

  return (
    <div className="w-full h-full relative bg-[#0c4a6e]">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 120,
          center: [0, 20]
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#22c55e"
                  stroke="#16a34a"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { fill: '#16a34a', outline: 'none' },
                    pressed: { outline: 'none' }
                  }}
                />
              ))
            }
          </Geographies>
          
          {validUsers.map((user, index) => {
            const isCreator = user.plan === 'creator';
            return (
              <Marker
                key={user.id || index}
                coordinates={[Number(user.lng), Number(user.lat)]}
                onClick={() => onUserClick?.(user)}
              >
                <circle
                  r={8}
                  fill={isCreator ? '#fbbf24' : '#3b82f6'}
                  stroke="#fff"
                  strokeWidth={2}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
      
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
        <p className="text-gray-300 text-xs text-center">Click on a marker to view profile</p>
      </div>
    </div>
  );
}
