import { useMemo, useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from 'react-simple-maps';
import type { User } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, UserPlus, MapPin, MessageCircle, Bed, Calendar } from 'lucide-react';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

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

interface ZoomTarget {
  lat: number;
  lng: number;
  zoom?: number;
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
  zoomToCountry?: ZoomTarget | null;
}

export default function FlatWorldMap({ 
  users = [], 
  stays = [],
  onUserClick,
  onStayClick,
  onConnect,
  showTravellers = true,
  showStays = true,
  isConnecting = false,
  zoomToCountry = null
}: FlatWorldMapProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);
  const [hoveredUser, setHoveredUser] = useState<User | null>(null);
  const [hoveredStay, setHoveredStay] = useState<Stay | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 20]);
  const [mapZoom, setMapZoom] = useState(1);
  
  useEffect(() => {
    if (zoomToCountry) {
      setMapCenter([zoomToCountry.lng, zoomToCountry.lat]);
      setMapZoom(zoomToCountry.zoom || 4);
    } else {
      setMapCenter([0, 20]);
      setMapZoom(1);
    }
  }, [zoomToCountry]);
  
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
          center={mapCenter}
          zoom={mapZoom}
          onMoveEnd={({ coordinates, zoom }) => {
            setMapCenter(coordinates as [number, number]);
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
                <rect
                  x={-12}
                  y={-24}
                  width={24}
                  height={20}
                  rx={3}
                  fill="#e91e63"
                  stroke="#fff"
                  strokeWidth={2}
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                />
                <rect x={-8} y={-18} width={16} height={4} fill="#fff" rx={1} />
                <rect x={-8} y={-12} width={6} height={8} fill="#fff" rx={1} />
                <rect x={2} y={-12} width={6} height={8} fill="#fff" rx={1} />
                <rect
                  x={-28}
                  y={-48}
                  width={56}
                  height={20}
                  rx={4}
                  fill="rgba(233, 30, 99, 0.95)"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                />
                <text
                  x={0}
                  y={-34}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={10}
                  fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                >
                  {formatPrice(stay.pricePerNight, stay.currency)}
                </text>
              </g>
            </Marker>
          ))}
          
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
                  <path
                    d="M0,-24 C-10,-24 -14,-14 -14,-10 C-14,0 0,12 0,12 C0,12 14,0 14,-10 C14,-14 10,-24 0,-24"
                    fill="#4285f4"
                    stroke="#fff"
                    strokeWidth={2}
                    transform={isSelected ? 'scale(1.2)' : 'scale(1)'}
                    style={{ 
                      transition: 'transform 0.2s',
                      filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))'
                    }}
                  />
                  <circle
                    cx={0}
                    cy={-12}
                    r={5}
                    fill="#fff"
                  />
                  <rect
                    x={-35}
                    y={-48}
                    width={70}
                    height={20}
                    rx={4}
                    fill="rgba(66, 133, 244, 0.95)"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                  />
                  <text
                    x={0}
                    y={-34}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={11}
                    fontWeight="500"
                    fontFamily="system-ui, sans-serif"
                  >
                    {(user.displayName || user.username || '').slice(0, 12)}
                  </text>
                </g>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
      
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
      
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur-sm rounded-lg px-5 py-3 shadow-lg border border-gray-200">
        <h2 className="text-gray-900 font-semibold text-lg text-center">Discover Travelers & Stays</h2>
        <p className="text-gray-500 text-xs text-center">Click on a pin to connect or book</p>
      </div>
      
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
