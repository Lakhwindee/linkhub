import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, MapPin, Star, DollarSign, Users, Calendar, Edit, Eye, Trash2, Home, Map, Coffee, Car, UserCheck, Loader2 } from "lucide-react";
import HostProfileForm from "@/components/HostProfileForm";
import { toast } from "sonner";

interface PersonalHost {
  id: string;
  title: string;
  description?: string;
  location: string;
  country: string;
  city: string;
  hostType: string;
  priceType: string;
  pricePerDay: string;
  currency: string;
  maxGuests: number;
  amenities?: string[];
  languages?: string[];
  imageUrls?: string[];
  isActive: boolean;
  createdAt: string;
}

export default function PersonalHosts() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingHost, setEditingHost] = useState<PersonalHost | null>(null);
  const [myHosts, setMyHosts] = useState<PersonalHost[]>([]);
  const [allHosts, setAllHosts] = useState<PersonalHost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [myHostsLoading, setMyHostsLoading] = useState(true);

  // Fetch my hosts
  useEffect(() => {
    if (user?.id) {
      fetchMyHosts();
    }
  }, [user?.id]);

  // Fetch all hosts for browsing
  useEffect(() => {
    fetchAllHosts();
  }, []);

  const fetchMyHosts = async () => {
    try {
      setMyHostsLoading(true);
      const response = await fetch('/api/personal-hosts/my-hosts', {
        headers: {
          'X-Demo-Session': user?.id || ''
        }
      });
      if (response.ok) {
        const hosts = await response.json();
        setMyHosts(hosts);
      }
    } catch (error) {
      console.error('Error fetching my hosts:', error);
      toast.error('Failed to load your host profiles');
    } finally {
      setMyHostsLoading(false);
    }
  };

  const fetchAllHosts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        limit: '20'
      });
      if (searchQuery) params.append('country', searchQuery);
      if (filterType !== 'all') params.append('hostType', filterType);

      const response = await fetch(`/api/personal-hosts?${params}`);
      if (response.ok) {
        const hosts = await response.json();
        setAllHosts(hosts);
      }
    } catch (error) {
      console.error('Error fetching hosts:', error);
      toast.error('Failed to load hosts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateHost = async (data: any) => {
    try {
      const response = await fetch('/api/personal-hosts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Session': user?.id || ''
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const newHost = await response.json();
        setMyHosts([newHost, ...myHosts]);
        setShowCreateDialog(false);
        toast.success('Host profile created successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create host profile');
      }
    } catch (error) {
      console.error('Error creating host:', error);
      toast.error('Failed to create host profile');
    }
  };

  const handleEditHost = async (data: any) => {
    if (!editingHost) return;

    try {
      const response = await fetch(`/api/personal-hosts/${editingHost.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Session': user?.id || ''
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const updatedHost = await response.json();
        setMyHosts(myHosts.map(h => h.id === editingHost.id ? updatedHost : h));
        setEditingHost(null);
        toast.success('Host profile updated successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update host profile');
      }
    } catch (error) {
      console.error('Error updating host:', error);
      toast.error('Failed to update host profile');
    }
  };

  const handleDeleteHost = async (hostId: string) => {
    if (!confirm('Are you sure you want to delete this host profile?')) return;

    try {
      const response = await fetch(`/api/personal-hosts/${hostId}`, {
        method: 'DELETE',
        headers: {
          'X-Demo-Session': user?.id || ''
        }
      });

      if (response.ok) {
        setMyHosts(myHosts.filter(h => h.id !== hostId));
        toast.success('Host profile deleted successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete host profile');
      }
    } catch (error) {
      console.error('Error deleting host:', error);
      toast.error('Failed to delete host profile');
    }
  };

  const getHostTypeIcon = (type: string) => {
    switch (type) {
      case 'accommodation': return Home;
      case 'guide': return Map;
      case 'experience': return Coffee;
      case 'transport': return Car;
      default: return Home;
    }
  };

  // Filter and search functionality
  useEffect(() => {
    fetchAllHosts();
  }, [searchQuery, filterType]);

  const filteredHosts = allHosts.filter(host => {
    const matchesSearch = searchQuery === "" || 
                         host.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         host.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         host.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         host.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || host.hostType === filterType;
    return matchesSearch && matchesType;
  });

  if (!user || (user.role !== 'publisher' && user.role !== 'creator')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Access denied. Publisher or Creator account required.</p>
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
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Create Host Profile</DialogTitle>
              </DialogHeader>
              <HostProfileForm
                onSubmit={handleCreateHost}
                onCancel={() => setShowCreateDialog(false)}
              />
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
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHosts.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <UserCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Hosts Found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search filters to find hosts
                    </p>
                  </div>
                ) : (
                  filteredHosts.map((host) => {
                    const HostIcon = getHostTypeIcon(host.hostType);
                    return (
                      <Card key={host.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-video relative">
                          {host.imageUrls && host.imageUrls.length > 0 ? (
                            <img 
                              src={host.imageUrls[0]} 
                              alt={host.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <HostIcon className="w-12 h-12 text-muted-foreground" />
                            </div>
                          )}
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
                            {host.description || 'No description provided'}
                          </p>
                          
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <MapPin className="w-4 h-4 mr-1" />
                            {host.location || `${host.city}, ${host.country}`}
                          </div>
                          
                          <div className="flex items-center text-sm text-muted-foreground mb-3">
                            <Users className="w-4 h-4 mr-1" />
                            Up to {host.maxGuests} guests
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              Host in {host.country}
                            </div>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </TabsContent>

          {/* My Host Profiles Tab */}
          <TabsContent value="my-hosts" className="space-y-6">
            {myHostsLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : myHosts.length === 0 ? (
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
                        {host.imageUrls && host.imageUrls.length > 0 ? (
                          <img 
                            src={host.imageUrls[0]} 
                            alt={host.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <HostIcon className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <Badge variant={host.isActive ? 'default' : 'secondary'}>
                            {host.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant={host.priceType === 'free' ? 'outline' : 'default'}>
                            {host.priceType === 'free' ? 'FREE' : `$${host.pricePerDay}/day`}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="flex items-start gap-2 mb-2">
                          <HostIcon className="w-4 h-4 mt-1 text-primary" />
                          <h3 className="font-semibold text-lg flex-1">{host.title}</h3>
                        </div>
                        
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {host.description || 'No description provided'}
                        </p>
                        
                        <div className="flex items-center text-sm text-muted-foreground mb-3">
                          <MapPin className="w-4 h-4 mr-1" />
                          {host.location || `${host.city}, ${host.country}`}
                        </div>
                        
                        <div className="flex items-center text-sm text-muted-foreground mb-4">
                          <Users className="w-4 h-4 mr-1" />
                          Up to {host.maxGuests} guests
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => setEditingHost(host)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteHost(host.id)}
                          >
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

      {/* Edit Host Dialog */}
      {editingHost && (
        <Dialog open={!!editingHost} onOpenChange={() => setEditingHost(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Edit Host Profile</DialogTitle>
            </DialogHeader>
            <HostProfileForm
              onSubmit={handleEditHost}
              onCancel={() => setEditingHost(null)}
              initialData={editingHost as any}
              isEditing={true}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}