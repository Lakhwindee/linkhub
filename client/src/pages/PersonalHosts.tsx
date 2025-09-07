import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, MapPin, Star, DollarSign, Users, Calendar, Edit, Eye, Trash2, Home, Map, Coffee, Car, UserCheck } from "lucide-react";

export default function PersonalHosts() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Sample data - this will be replaced with real API calls
  const myHosts = [
    {
      id: "1",
      title: "Cozy Home Stay in Mumbai",
      description: "Beautiful 2-bedroom apartment with modern amenities",
      location: "Mumbai, India",
      hostType: "accommodation",
      priceType: "paid",
      pricePerDay: 50,
      currency: "USD",
      maxGuests: 4,
      imageUrls: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&h=200&fit=crop"],
      isActive: true,
      bookings: 12,
      rating: 4.8
    }
  ];

  const allHosts = [
    {
      id: "2",
      title: "Local Guide & Host",
      description: "Show you the best hidden gems in Delhi",
      location: "Delhi, India", 
      hostType: "guide",
      priceType: "free",
      pricePerDay: 0,
      currency: "USD",
      maxGuests: 6,
      imageUrls: ["https://images.unsplash.com/photo-1599838819909-14d1e3320cd3?w=300&h=200&fit=crop"],
      hostName: "Raj Sharma",
      languages: ["English", "Hindi"],
      rating: 4.9,
      totalBookings: 45
    },
    {
      id: "3", 
      title: "Coffee Experience Tour",
      description: "Learn about local coffee culture and brewing",
      location: "Bangalore, India",
      hostType: "experience",
      priceType: "paid",
      pricePerDay: 25,
      currency: "USD", 
      maxGuests: 8,
      imageUrls: ["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=200&fit=crop"],
      hostName: "Priya Nair", 
      languages: ["English", "Tamil"],
      rating: 4.7,
      totalBookings: 23
    }
  ];

  const getHostTypeIcon = (type: string) => {
    switch (type) {
      case 'accommodation': return Home;
      case 'guide': return Map;
      case 'experience': return Coffee;
      case 'transport': return Car;
      default: return Home;
    }
  };

  const filteredHosts = allHosts.filter(host => {
    const matchesSearch = host.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         host.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || host.hostType === filterType;
    return matchesSearch && matchesType;
  });

  if (user?.role !== 'publisher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Access denied. Publisher account required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Personal Hosts</h1>
            <p className="text-muted-foreground mt-2">
              List yourself as a host or book other hosts for unique travel experiences
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Become a Host
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Host Profile</DialogTitle>
              </DialogHeader>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Host creation form will be implemented here</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList>
            <TabsTrigger value="browse">Browse Hosts</TabsTrigger>
            <TabsTrigger value="my-hosts">My Host Profiles</TabsTrigger>
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
          </TabsList>

          {/* Browse Hosts Tab */}
          <TabsContent value="browse" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search hosts by location or experience..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="accommodation">🏠 Accommodation</SelectItem>
                  <SelectItem value="guide">🗺️ Local Guide</SelectItem>
                  <SelectItem value="experience">☕ Experience</SelectItem>
                  <SelectItem value="transport">🚗 Transport</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hosts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHosts.map((host) => {
                const HostIcon = getHostTypeIcon(host.hostType);
                return (
                  <Card key={host.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative">
                      <img 
                        src={host.imageUrls[0]} 
                        alt={host.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <HostIcon className="w-3 h-3" />
                          {host.hostType}
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge variant={host.priceType === 'free' ? 'outline' : 'default'}>
                          {host.priceType === 'free' ? 'FREE' : `$${host.pricePerDay}/day`}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{host.title}</h3>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {host.description}
                      </p>
                      
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        {host.location}
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground mb-3">
                        <Users className="w-4 h-4 mr-1" />
                        Up to {host.maxGuests} guests
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          {host.rating} ({host.totalBookings} bookings)
                        </div>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* My Host Profiles Tab */}
          <TabsContent value="my-hosts" className="space-y-6">
            {myHosts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <UserCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Host Profiles Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first host profile to start earning and connecting with travelers
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Host Profile
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myHosts.map((host) => {
                  const HostIcon = getHostTypeIcon(host.hostType);
                  return (
                    <Card key={host.id}>
                      <div className="aspect-video relative">
                        <img 
                          src={host.imageUrls[0]} 
                          alt={host.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge variant={host.isActive ? 'default' : 'secondary'}>
                            {host.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{host.title}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mb-3">
                          <MapPin className="w-4 h-4 mr-1" />
                          {host.location}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-foreground">{host.bookings}</div>
                            <div className="text-xs text-muted-foreground">Bookings</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-foreground">{host.rating}</div>
                            <div className="text-xs text-muted-foreground">Rating</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* My Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Bookings Yet</h3>
                <p className="text-muted-foreground">
                  Your host bookings will appear here once you make reservations
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}