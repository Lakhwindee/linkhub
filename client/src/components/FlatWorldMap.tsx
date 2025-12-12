import { useMemo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
  Annotation
} from 'react-simple-maps';
import type { User } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, UserPlus, MapPin, MessageCircle, Bed, Calendar } from 'lucide-react';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const MAJOR_CITIES = [
  { name: "London", lat: 51.5074, lng: -0.1278 },
  { name: "Paris", lat: 48.8566, lng: 2.3522 },
  { name: "New York", lat: 40.7128, lng: -74.006 },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { name: "Sydney", lat: -33.8688, lng: 151.2093 },
  { name: "Dubai", lat: 25.2048, lng: 55.2708 },
  { name: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Hong Kong", lat: 22.3193, lng: 114.1694 },
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Shanghai", lat: 31.2304, lng: 121.4737 },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { name: "Berlin", lat: 52.52, lng: 13.405 },
  { name: "Rome", lat: 41.9028, lng: 12.4964 },
  { name: "Madrid", lat: 40.4168, lng: -3.7038 },
  { name: "Moscow", lat: 55.7558, lng: 37.6173 },
  { name: "Bangkok", lat: 13.7563, lng: 100.5018 },
  { name: "Cairo", lat: 30.0444, lng: 31.2357 },
  { name: "Toronto", lat: 43.6532, lng: -79.3832 },
  { name: "São Paulo", lat: -23.5505, lng: -46.6333 },
  { name: "Mexico City", lat: 19.4326, lng: -99.1332 },
  { name: "Istanbul", lat: 41.0082, lng: 28.9784 },
  { name: "Amsterdam", lat: 52.3676, lng: 4.9041 },
  { name: "Barcelona", lat: 41.3851, lng: 2.1734 },
  { name: "Lagos", lat: 6.5244, lng: 3.3792 },
  { name: "Cape Town", lat: -33.9249, lng: 18.4241 },
  { name: "Melbourne", lat: -37.8136, lng: 144.9631 },
  { name: "Delhi", lat: 28.6139, lng: 77.209 },
  { name: "Seoul", lat: 37.5665, lng: 126.978 },
  { name: "Beijing", lat: 39.9042, lng: 116.4074 },
  { name: "Johannesburg", lat: -26.2041, lng: 28.0473 },
];

const COUNTRY_LABELS = [
  { name: "United States", lat: 39.8283, lng: -98.5795 },
  { name: "Canada", lat: 56.1304, lng: -106.3468 },
  { name: "Brazil", lat: -14.235, lng: -51.9253 },
  { name: "Argentina", lat: -38.4161, lng: -63.6167 },
  { name: "United Kingdom", lat: 55.3781, lng: -3.436 },
  { name: "France", lat: 46.2276, lng: 2.2137 },
  { name: "Germany", lat: 51.1657, lng: 10.4515 },
  { name: "Spain", lat: 40.4637, lng: -3.7492 },
  { name: "Italy", lat: 41.8719, lng: 12.5674 },
  { name: "Russia", lat: 61.524, lng: 105.3188 },
  { name: "China", lat: 35.8617, lng: 104.1954 },
  { name: "India", lat: 20.5937, lng: 78.9629 },
  { name: "Japan", lat: 36.2048, lng: 138.2529 },
  { name: "Australia", lat: -25.2744, lng: 133.7751 },
  { name: "South Africa", lat: -30.5595, lng: 22.9375 },
  { name: "Mexico", lat: 23.6345, lng: -102.5528 },
  { name: "Indonesia", lat: -0.7893, lng: 113.9213 },
  { name: "Saudi Arabia", lat: 23.8859, lng: 45.0792 },
  { name: "Turkey", lat: 38.9637, lng: 35.2433 },
  { name: "Nigeria", lat: 9.082, lng: 8.6753 },
  { name: "Egypt", lat: 26.8206, lng: 30.8025 },
  { name: "Pakistan", lat: 30.3753, lng: 69.3451 },
  { name: "Thailand", lat: 15.87, lng: 100.9925 },
  { name: "Vietnam", lat: 14.0583, lng: 108.2772 },
  { name: "Philippines", lat: 12.8797, lng: 121.774 },
  { name: "Malaysia", lat: 4.2105, lng: 101.9758 },
  { name: "Poland", lat: 51.9194, lng: 19.1451 },
  { name: "Ukraine", lat: 48.3794, lng: 31.1656 },
  { name: "Kenya", lat: -0.0236, lng: 37.9062 },
  { name: "Colombia", lat: 4.5709, lng: -74.2973 },
  { name: "Chile", lat: -35.6751, lng: -71.543 },
  { name: "Peru", lat: -9.19, lng: -75.0152 },
  { name: "Morocco", lat: 31.7917, lng: -7.0926 },
  { name: "Algeria", lat: 28.0339, lng: 1.6596 },
  { name: "Iran", lat: 32.4279, lng: 53.688 },
  { name: "Iraq", lat: 33.2232, lng: 43.6793 },
  { name: "Kazakhstan", lat: 48.0196, lng: 66.9237 },
  { name: "Sweden", lat: 60.1282, lng: 18.6435 },
  { name: "Norway", lat: 60.472, lng: 8.4689 },
  { name: "Finland", lat: 61.9241, lng: 25.7482 },
  { name: "Greece", lat: 39.0742, lng: 21.8243 },
  { name: "Portugal", lat: 39.3999, lng: -8.2245 },
  { name: "New Zealand", lat: -40.9006, lng: 174.886 },
];

interface Stay {
  id: string;
  title: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
  pricePerNight?: string;
  currency?: string;
  type?: string;
  imageUrls?: string[];
}

interface FlatWorldMapProps {
  users: User[];
  stays?: Stay[];
  onUserClick?: (user: User) => void;
  onStayClick?: (stay: Stay) => void;
  onConnect?: (userId: string) => void;
  showTravellers?: boolean;
  showStays?: boolean;
  isConnecting?: boolean;
}

export default function FlatWorldMap({ 
  users = [], 
  stays = [],
  onUserClick,
  onStayClick,
  onConnect,
  showTravellers = true,
  showStays = true,
  isConnecting = false
}: FlatWorldMapProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);
  const [hoveredUser, setHoveredUser] = useState<User | null>(null);
  const [hoveredStay, setHoveredStay] = useState<Stay | null>(null);
  const [mapZoom, setMapZoom] = useState(1);
  
  const validUsers = useMemo(() => {
    if (!showTravellers) return [];
    return users.filter(u => 
      u.lat !== undefined && 
      u.lng !== undefined && 
      u.lat !== null && 
      u.lng !== null
    );
  }, [users, showTravellers]);

  const validStays = useMemo(() => {
    if (!showStays) return [];
    return stays.filter(s => 
      s.lat !== undefined && 
      s.lng !== undefined && 
      s.lat !== null && 
      s.lng !== null
    );
  }, [stays, showStays]);

  const handleMarkerClick = (user: User) => {
    setSelectedStay(null);
    setSelectedUser(user);
    onUserClick?.(user);
  };

  const handleStayClick = (stay: Stay) => {
    setSelectedUser(null);
    setSelectedStay(stay);
    onStayClick?.(stay);
  };

  const handleConnect = () => {
    if (selectedUser && onConnect) {
      onConnect(selectedUser.id);
    }
  };

  const closePopup = () => {
    setSelectedUser(null);
    setSelectedStay(null);
  };

  const formatPrice = (price: string | undefined, currency: string | undefined) => {
    if (!price) return 'Free';
    const symbols: Record<string, string> = {
      'GBP': '£', 'EUR': '€', 'USD': '$', 'INR': '₹', 'AUD': 'A$', 'JPY': '¥'
    };
    return `${symbols[currency || 'GBP'] || currency || ''}${price}/night`;
  };

  return (
    <div className="w-full h-full relative" style={{ background: 'linear-gradient(180deg, #a8d8ea 0%, #87ceeb 30%, #6bb3d9 60%, #5b9bc9 100%)' }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 120,
          center: [0, 20]
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup
          zoom={mapZoom}
          onMoveEnd={({ zoom }) => {
            setMapZoom(zoom);
          }}
          minZoom={1}
          maxZoom={12}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#e8e4d8"
                  stroke="#c5bfb0"
                  strokeWidth={0.3}
                  style={{
                    default: { 
                      outline: 'none',
                      filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.1))'
                    },
                    hover: { 
                      fill: '#d4cfbf', 
                      outline: 'none',
                      cursor: 'pointer'
                    },
                    pressed: { outline: 'none' }
                  }}
                />
              ))
            }
          </Geographies>
          
          {/* Country Labels */}
          {COUNTRY_LABELS.map((country, idx) => (
            <Marker key={`country-${idx}`} coordinates={[country.lng, country.lat]}>
              <text
                textAnchor="middle"
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fill: '#555',
                  fontSize: mapZoom > 2 ? 8 / mapZoom : 5,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  pointerEvents: 'none',
                  textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff'
                }}
              >
                {country.name}
              </text>
            </Marker>
          ))}
          
          {/* City Labels */}
          {MAJOR_CITIES.map((city, idx) => (
            <Marker key={`city-${idx}`} coordinates={[city.lng, city.lat]}>
              <circle r={2} fill="#333" />
              <text
                y={-6}
                textAnchor="middle"
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fill: '#333',
                  fontSize: mapZoom > 2 ? 6 / mapZoom : 4,
                  fontWeight: 500,
                  pointerEvents: 'none',
                  textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff'
                }}
              >
                {city.name}
              </text>
            </Marker>
          ))}
          
          {/* Stays Pins - Modern compact design */}
          {validStays.map((stay, index) => (
            <Marker
              key={`stay-${stay.id || index}`}
              coordinates={[Number(stay.lng), Number(stay.lat)]}
            >
              <g 
                style={{ cursor: 'pointer' }}
                onClick={() => handleStayClick(stay)}
                onMouseEnter={() => setHoveredStay(stay)}
                onMouseLeave={() => setHoveredStay(null)}
              >
                <circle
                  cx={0}
                  cy={0}
                  r={8}
                  fill="#ec4899"
                  stroke="#fff"
                  strokeWidth={2}
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}
                />
                <rect x={-3} y={-3} width={6} height={4} fill="#fff" rx={1} />
                <rect x={-2} y={2} width={4} height={2} fill="#fff" rx={0.5} />
              </g>
            </Marker>
          ))}
          
          {/* Traveler Pins - Modern compact design */}
          {validUsers.map((user, index) => {
            const isSelected = selectedUser?.id === user.id;
            return (
              <Marker
                key={user.id || index}
                coordinates={[Number(user.lng), Number(user.lat)]}
              >
                <g 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleMarkerClick(user)}
                  onMouseEnter={() => setHoveredUser(user)}
                  onMouseLeave={() => setHoveredUser(null)}
                >
                  <circle
                    cx={0}
                    cy={0}
                    r={isSelected ? 10 : 8}
                    fill="#3b82f6"
                    stroke="#fff"
                    strokeWidth={2}
                    style={{ 
                      transition: 'all 0.2s',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))'
                    }}
                  />
                  <circle cx={0} cy={-2} r={2.5} fill="#fff" />
                  <path
                    d="M-3,3 Q0,1 3,3 Q3,6 0,6 Q-3,6 -3,3"
                    fill="#fff"
                  />
                </g>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
      
      {/* Selected User Popup */}
      {selectedUser && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-5 min-w-[280px] max-w-[320px] border border-gray-200 dark:border-gray-700">
            <button 
              onClick={closePopup}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-14 h-14 border-2 border-blue-500">
                <AvatarImage src={selectedUser.avatarUrl || selectedUser.profileImageUrl || ''} />
                <AvatarFallback className="bg-blue-500 text-white text-lg">
                  {(selectedUser.displayName || selectedUser.username || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  {selectedUser.displayName || selectedUser.username}
                </h3>
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span>{selectedUser.city}, {selectedUser.country}</span>
                </div>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Traveler
                </span>
              </div>
            </div>
            
            {selectedUser.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                {selectedUser.bio}
              </p>
            )}
            
            <Button 
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              {isConnecting ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Connect
            </Button>
            
            <p className="text-xs text-center text-gray-400 mt-3">
              <MessageCircle className="w-3 h-3 inline mr-1" />
              Send a connect request to start chatting
            </p>
          </div>
        </div>
      )}

      {/* Selected Stay Popup */}
      {selectedStay && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-5 min-w-[280px] max-w-[320px] border border-gray-200 dark:border-gray-700">
            <button 
              onClick={closePopup}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-lg bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                <Bed className="w-7 h-7 text-pink-600 dark:text-pink-300" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  {selectedStay.title}
                </h3>
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span>{selectedStay.city}, {selectedStay.country}</span>
                </div>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                  {selectedStay.type || 'Stay'}
                </span>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
              <div className="text-center">
                <span className="text-2xl font-bold text-pink-600">
                  {formatPrice(selectedStay.pricePerNight, selectedStay.currency)}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  window.location.href = `/stays/${selectedStay.id}`;
                }}
                className="flex-1 bg-pink-600 hover:bg-pink-700"
              >
                <Calendar className="w-4 h-4 mr-2" />
                View & Book
              </Button>
            </div>
            
            <p className="text-xs text-center text-gray-400 mt-3">
              <Bed className="w-3 h-3 inline mr-1" />
              Click to see details and book this stay
            </p>
          </div>
        </div>
      )}
      
      {/* Hover Tooltips */}
      {hoveredUser && !selectedUser && !selectedStay && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-white rounded-lg shadow-lg px-3 py-2 pointer-events-none border border-gray-200">
          <p className="font-semibold text-gray-900 text-sm">{hoveredUser.displayName || hoveredUser.username}</p>
          <p className="text-xs text-gray-500">{hoveredUser.city}, {hoveredUser.country}</p>
        </div>
      )}

      {hoveredStay && !selectedUser && !selectedStay && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-white rounded-lg shadow-lg px-3 py-2 pointer-events-none border border-pink-200">
          <p className="font-semibold text-gray-900 text-sm">{hoveredStay.title}</p>
          <p className="text-xs text-pink-600">{formatPrice(hoveredStay.pricePerNight, hoveredStay.currency)}</p>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#4285f4] rounded-full border border-white shadow"></div>
            <span className="text-gray-700 text-xs font-medium">Travelers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#e91e63] rounded-sm border border-white shadow"></div>
            <span className="text-gray-700 text-xs font-medium">Stays</span>
          </div>
        </div>
        <p className="text-gray-500 text-xs mt-2">
          {validUsers.length} travelers · {validStays.length} stays
        </p>
      </div>
      
      {/* Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur-sm rounded-lg px-5 py-3 shadow-lg border border-gray-200">
        <h2 className="text-gray-900 font-semibold text-lg text-center">Discover Travelers & Stays</h2>
        <p className="text-gray-500 text-xs text-center">Click on a pin to connect or book</p>
      </div>
      
      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1">
        <button 
          onClick={() => setMapZoom(z => Math.min(z * 1.5, 12))}
          className="w-8 h-8 bg-white rounded shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold"
        >
          +
        </button>
        <button 
          onClick={() => setMapZoom(z => Math.max(z / 1.5, 1))}
          className="w-8 h-8 bg-white rounded shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold"
        >
          -
        </button>
      </div>
    </div>
  );
}
