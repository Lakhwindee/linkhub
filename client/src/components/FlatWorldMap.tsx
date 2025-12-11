import { useMemo, useState } from 'react';
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
            {({ geographies }: { geographies: any[] }) =>
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
          
          {/* Stays Pins - Bed Icons */}
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
                {/* House/Bed shape */}
                <rect
                  x={-12}
                  y={-24}
                  width={24}
                  height={20}
                  rx={3}
                  fill="#ec4899"
                  stroke="#fff"
                  strokeWidth={2}
                />
                {/* Bed icon inside */}
                <rect x={-8} y={-18} width={16} height={4} fill="#fff" rx={1} />
                <rect x={-8} y={-12} width={6} height={8} fill="#fff" rx={1} />
                <rect x={2} y={-12} width={6} height={8} fill="#fff" rx={1} />
                {/* Price tag */}
                <rect
                  x={-25}
                  y={-46}
                  width={50}
                  height={18}
                  rx={4}
                  fill="rgba(236, 72, 153, 0.9)"
                />
                <text
                  x={0}
                  y={-34}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={9}
                  fontWeight="600"
                >
                  {formatPrice(stay.pricePerNight, stay.currency)}
                </text>
              </g>
            </Marker>
          ))}
          
          {/* User Pins */}
          {validUsers.map((user, index) => {
            const isCreator = user.plan === 'creator';
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
                  {/* Pin shape */}
                  <path
                    d="M0,-20 C-8,-20 -12,-12 -12,-8 C-12,0 0,10 0,10 C0,10 12,0 12,-8 C12,-12 8,-20 0,-20"
                    fill={isCreator ? '#fbbf24' : '#3b82f6'}
                    stroke="#fff"
                    strokeWidth={2}
                    transform={isSelected ? 'scale(1.3)' : 'scale(1)'}
                    style={{ transition: 'transform 0.2s' }}
                  />
                  <circle
                    cx={0}
                    cy={-10}
                    r={4}
                    fill="#fff"
                  />
                  {/* Name tag */}
                  <rect
                    x={-30}
                    y={-42}
                    width={60}
                    height={18}
                    rx={4}
                    fill="rgba(0,0,0,0.8)"
                  />
                  <text
                    x={0}
                    y={-30}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={10}
                    fontWeight="500"
                  >
                    {(user.displayName || user.username || '').slice(0, 10)}
                  </text>
                </g>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
      
      {/* Selected User Popup Window */}
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
              <Avatar className="w-14 h-14 border-2 border-primary">
                <AvatarImage src={selectedUser.avatarUrl || selectedUser.profileImageUrl || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
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
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  selectedUser.plan === 'creator' 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {selectedUser.plan === 'creator' ? '⭐ Creator' : '🌍 Traveler'}
                </span>
              </div>
            </div>
            
            {selectedUser.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                {selectedUser.bio}
              </p>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isConnecting ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Connect
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  window.location.href = `/users/${selectedUser.username}`;
                }}
                className="flex-1"
              >
                View Profile
              </Button>
            </div>
            
            <p className="text-xs text-center text-gray-400 mt-3">
              <MessageCircle className="w-3 h-3 inline mr-1" />
              Send a connect request to start chatting
            </p>
          </div>
        </div>
      )}

      {/* Selected Stay Popup Window */}
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
      
      {/* Hover tooltips */}
      {hoveredUser && !selectedUser && !selectedStay && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-black/90 rounded-lg shadow-lg px-3 py-2 pointer-events-none">
          <p className="font-semibold text-white text-sm">{hoveredUser.displayName || hoveredUser.username}</p>
          <p className="text-xs text-gray-300">{hoveredUser.city}, {hoveredUser.country}</p>
        </div>
      )}

      {hoveredStay && !selectedUser && !selectedStay && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-pink-600 rounded-lg shadow-lg px-3 py-2 pointer-events-none">
          <p className="font-semibold text-white text-sm">{hoveredStay.title}</p>
          <p className="text-xs text-pink-100">{formatPrice(hoveredStay.pricePerNight, hoveredStay.currency)}</p>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-black/70 backdrop-blur-sm rounded-lg p-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full border border-white"></div>
            <span className="text-white text-xs">Creators</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
            <span className="text-white text-xs">Travelers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-pink-500 rounded-sm border border-white"></div>
            <span className="text-white text-xs">Stays</span>
          </div>
        </div>
        <p className="text-gray-300 text-xs mt-2">
          {validUsers.length} travelers · {validStays.length} stays
        </p>
      </div>
      
      {/* Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
        <h2 className="text-white font-semibold text-lg text-center">Discover Travelers & Stays</h2>
        <p className="text-gray-300 text-xs text-center">Click on a pin to connect or book</p>
      </div>
    </div>
  );
}
