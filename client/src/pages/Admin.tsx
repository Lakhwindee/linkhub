import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Settings, Users, FileText, Flag, DollarSign, BarChart3, CheckCircle, XCircle, Eye, AlertTriangle,
  Search, Filter, Download, Upload, Shield, Monitor, Database, Globe, Mail, CreditCard,
  Activity, Lock, Unlock, UserPlus, UserMinus, Trash2, Edit3, Calendar, TrendingUp,
  Clock, Server, Wifi, AlertCircle, RefreshCw, MoreVertical, Bell, Home, MessageSquare
} from "lucide-react";
import { format, subDays, subWeeks, subMonths } from "date-fns";
import { Link } from "wouter";
import type { AdSubmission, Report } from "@shared/schema";

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management for different admin sections
  const [activeSection, setActiveSection] = useState("dashboard");
  const [selectedSubmission, setSelectedSubmission] = useState<AdSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [dateRange, setDateRange] = useState("7days");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Check admin access
  useEffect(() => {
    if (user && !['admin', 'superadmin', 'moderator'].includes(user.role || '')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    enabled: user && ['admin', 'superadmin', 'moderator'].includes(user.role || ''),
    retry: false,
  });

  // Fetch ad submissions
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ["/api/admin/submissions"],
    enabled: user && ['admin', 'superadmin', 'moderator'].includes(user.role || ''),
    retry: false,
  });

  // Fetch reports
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/admin/reports"],
    enabled: user && ['admin', 'superadmin', 'moderator'].includes(user.role || ''),
    retry: false,
  });

  const reviewSubmissionMutation = useMutation({
    mutationFn: async (data: { submissionId: string; status: string; notes?: string }) => {
      return await apiRequest("POST", `/api/admin/submissions/${data.submissionId}/review`, {
        status: data.status,
        notes: data.notes
      });
    },
    onSuccess: (data, { status }) => {
      toast({
        title: status === 'approved' ? "Submission Approved" : "Submission Rejected",
        description: status === 'approved' 
          ? "Payment has been added to creator's wallet." 
          : "The submission has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/submissions"] });
      setSelectedSubmission(null);
      setReviewNotes("");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Review Failed",
        description: error.message || "Failed to review submission.",
        variant: "destructive",
      });
    },
  });

  const handleReviewSubmission = (status: 'approved' | 'rejected') => {
    if (!selectedSubmission) return;
    
    reviewSubmissionMutation.mutate({
      submissionId: selectedSubmission.id,
      status,
      notes: reviewNotes.trim() || undefined
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !['admin', 'superadmin', 'moderator'].includes(user.role || '')) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-600 dark:text-red-400" />
              <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">
                Access Denied
              </h2>
              <p className="text-red-700 dark:text-red-300 mb-6">
                You don't have permission to access the admin panel. Contact a system administrator if you believe this is an error.
              </p>
              <Button variant="outline" asChild data-testid="button-go-home">
                <Link href="/">Go Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const pendingSubmissions = submissions.filter((s: AdSubmission) => s.status === 'pending');
  const pendingReports = reports.filter((r: Report) => r.status === 'pending');

  // Navigation items for admin panel
  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, description: "Overview & Analytics" },
    { id: "users", label: "User Management", icon: Users, description: "Manage all users" },
    { id: "content", label: "Content Moderation", icon: FileText, description: "Posts, stays, events" },
    { id: "financial", label: "Financial", icon: DollarSign, description: "Revenue & payments" },
    { id: "reports", label: "Reports & Flags", icon: Flag, description: "User reports" },
    { id: "analytics", label: "Analytics", icon: BarChart3, description: "Platform metrics" },
    { id: "settings", label: "System Settings", icon: Settings, description: "Platform config" },
    { id: "monitoring", label: "Live Monitoring", icon: Monitor, description: "Real-time status" },
    { id: "audit", label: "Audit Logs", icon: Activity, description: "Activity tracking" }
  ];

  const renderDashboardSection = () => (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{dashboardData?.totalUsers || 0}</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{dashboardData?.totalPosts || 0}</div>
                <div className="text-sm text-muted-foreground">Total Posts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <Flag className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{pendingReports.length}</div>
                <div className="text-sm text-muted-foreground">Pending Reports</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{pendingSubmissions.length}</div>
                <div className="text-sm text-muted-foreground">Pending Reviews</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New user registration</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Content reported</p>
                  <p className="text-xs text-muted-foreground">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Ad submission reviewed</p>
                  <p className="text-xs text-muted-foreground">12 minutes ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Growth Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">New Users (7d)</span>
                <span className="font-semibold text-green-600">+12%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Posts Created (7d)</span>
                <span className="font-semibold text-blue-600">+8%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Revenue (7d)</span>
                <span className="font-semibold text-purple-600">+15%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">User Engagement</span>
                <span className="font-semibold text-orange-600">94%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-card border-r border-border min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-8">
              <Shield className="w-8 h-8 text-accent" />
              <div>
                <h1 className="text-xl font-bold">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">Platform Management</p>
              </div>
            </div>

            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors flex items-center space-x-3 ${
                    activeSection === item.id
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {navigationItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
              </h2>
              <p className="text-muted-foreground">
                {navigationItems.find(item => item.id === activeSection)?.description || 'Platform overview'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Wifi className="w-3 h-3 mr-1" />
                Online
              </Badge>
              <Badge variant="secondary">
                {user.role}
              </Badge>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Section Content */}
          <div className="space-y-6">
            {activeSection === "dashboard" && renderDashboardSection()}
            
            {activeSection === "users" && (
              <div className="space-y-6">
                {/* User Management Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-80"
                      />
                    </div>
                    <Select value={filterRole} onValueChange={setFilterRole}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="creator">Creator</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button size="sm">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </div>
                </div>

                {/* Bulk Actions */}
                {selectedUsers.length > 0 && (
                  <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium">{selectedUsers.length} users selected</span>
                      <Select value={bulkAction} onValueChange={setBulkAction}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Bulk actions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ban">Ban Users</SelectItem>
                          <SelectItem value="unban">Unban Users</SelectItem>
                          <SelectItem value="change-role">Change Role</SelectItem>
                          <SelectItem value="delete">Delete Users</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="destructive">Apply</Button>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedUsers([])}
                    >
                      Clear Selection
                    </Button>
                  </div>
                )}

                {/* Users Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="w-5 h-5" />
                      <span>Platform Users</span>
                      <Badge variant="secondary">1,247 total</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <input type="checkbox" />
                          </TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Posts</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Last Active</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <input type="checkbox" />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium">JD</span>
                              </div>
                              <div>
                                <div className="font-medium">John Doe</div>
                                <div className="text-sm text-muted-foreground">john@example.com</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">Creator</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                          </TableCell>
                          <TableCell>24</TableCell>
                          <TableCell>Jan 15, 2024</TableCell>
                          <TableCell>2 hours ago</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {/* More rows... */}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "analytics" && (
              <div className="space-y-6">
                {/* Analytics Dashboard */}
                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        <span>User Growth</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">+24%</div>
                      <p className="text-sm text-muted-foreground">vs last month</p>
                      <div className="mt-4 h-20 bg-gradient-to-r from-green-100 to-green-200 rounded-lg flex items-end p-2">
                        <div className="flex items-end space-x-1 w-full">
                          {[20, 35, 25, 40, 30, 45, 38, 50, 42, 55, 48, 60].map((height, i) => (
                            <div key={i} className="bg-green-500 rounded-t" style={{ height: `${height}%`, width: '8%' }}></div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-purple-500" />
                        <span>Revenue</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-600">$12,458</div>
                      <p className="text-sm text-muted-foreground">this month</p>
                      <div className="mt-4 h-20 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg flex items-end p-2">
                        <div className="flex items-end space-x-1 w-full">
                          {[30, 45, 35, 50, 40, 55, 48, 60, 52, 65, 58, 70].map((height, i) => (
                            <div key={i} className="bg-purple-500 rounded-t" style={{ height: `${height}%`, width: '8%' }}></div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Activity className="w-5 h-5 text-blue-500" />
                        <span>Engagement</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">89%</div>
                      <p className="text-sm text-muted-foreground">daily active users</p>
                      <div className="mt-4 h-20 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-end p-2">
                        <div className="flex items-end space-x-1 w-full">
                          {[40, 55, 45, 60, 50, 65, 58, 70, 62, 75, 68, 80].map((height, i) => (
                            <div key={i} className="bg-blue-500 rounded-t" style={{ height: `${height}%`, width: '8%' }}></div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Analytics */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Travel Guide: Tokyo</span>
                          <span className="text-sm font-medium">1,247 views</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Photography Tips</span>
                          <span className="text-sm font-medium">892 views</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Budget Travel Hacks</span>
                          <span className="text-sm font-medium">673 views</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>User Activity by Hour</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-32 bg-muted rounded-lg flex items-end p-4">
                        <div className="flex items-end space-x-2 w-full">
                          {[10, 15, 12, 20, 25, 30, 45, 60, 70, 65, 80, 85, 90, 75, 70, 65, 60, 55, 50, 40, 30, 25, 20, 15].map((height, i) => (
                            <div key={i} className="bg-primary rounded-t" style={{ height: `${height}%`, width: '3.5%' }}></div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Other sections would be rendered here based on activeSection */}
            {activeSection === "reports" && (
              <div className="space-y-6">
                {/* Reports Section - keeping existing functionality */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Flag className="w-5 h-5 text-yellow-600" />
                      <span>Content Reports</span>
                      {pendingReports.length > 0 && (
                        <Badge variant="destructive">{pendingReports.length}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportsLoading ? (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="animate-pulse space-y-3 p-4 border border-border rounded-lg">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : pendingReports.length > 0 ? (
                      <div className="space-y-4">
                        {pendingReports.map((report: Report) => (
                          <Card key={report.id} className="border-yellow-200 dark:border-yellow-800">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline">{report.reason}</Badge>
                                    <Badge variant="secondary">{report.targetType}</Badge>
                                  </div>
                                  <p className="text-sm text-card-foreground">
                                    {report.description || "No description provided"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Reported {format(new Date(report.createdAt!), 'MMM d, yyyy h:mm a')}
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="outline">
                                    <Eye className="w-3 h-3 mr-2" />
                                    Investigate
                                  </Button>
                                  <Button size="sm" variant="destructive">
                                    Take Action
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="p-12 text-center">
                          <Flag className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <h3 className="text-lg font-semibold text-foreground mb-2">No pending reports</h3>
                          <p className="text-muted-foreground">All reports have been reviewed and resolved.</p>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "financial" && (
              <div className="space-y-6">
                {/* Ad Submissions Review - keeping existing functionality */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-chart-2" />
                      <span>Ad Submissions for Review</span>
                      {pendingSubmissions.length > 0 && (
                        <Badge variant="destructive">{pendingSubmissions.length}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {submissionsLoading ? (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="animate-pulse space-y-3 p-4 border border-border rounded-lg">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                            <div className="h-3 bg-muted rounded w-2/3"></div>
                          </div>
                        ))}
                      </div>
                    ) : pendingSubmissions.length > 0 ? (
                      <div className="space-y-4">
                        {pendingSubmissions.map((submission: AdSubmission) => (
                          <Card key={submission.id} className="border-yellow-200 dark:border-yellow-800">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline">{submission.status}</Badge>
                                    <span className="text-sm text-muted-foreground">
                                      Submitted {format(new Date(submission.createdAt!), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Submission ID: {submission.id}
                                  </p>
                                  {submission.rawFileUrl && (
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={submission.rawFileUrl} target="_blank" rel="noopener noreferrer">
                                        <Eye className="w-3 h-3 mr-2" />
                                        View Content
                                      </a>
                                    </Button>
                                  )}
                                </div>

                                <div className="flex space-x-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => setSelectedSubmission(submission)}
                                      >
                                        <CheckCircle className="w-3 h-3 mr-2" />
                                        Approve
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Approve Submission</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <p className="text-muted-foreground">
                                          Are you sure you want to approve this submission? Payment will be added to the creator's wallet.
                                        </p>
                                        <Textarea
                                          placeholder="Add review notes (optional)..."
                                          value={reviewNotes}
                                          onChange={(e) => setReviewNotes(e.target.value)}
                                        />
                                        <div className="flex space-x-2">
                                          <Button 
                                            variant="outline" 
                                            onClick={() => setSelectedSubmission(null)}
                                          >
                                            Cancel
                                          </Button>
                                          <Button 
                                            onClick={() => handleReviewSubmission('approved')}
                                            disabled={reviewSubmissionMutation.isPending}
                                            className="bg-green-600 hover:bg-green-700"
                                          >
                                            Confirm Approval
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>

                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        variant="destructive"
                                        onClick={() => setSelectedSubmission(submission)}
                                      >
                                        <XCircle className="w-3 h-3 mr-2" />
                                        Reject
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Reject Submission</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <p className="text-muted-foreground">
                                          Please provide a reason for rejecting this submission.
                                        </p>
                                        <Textarea
                                          placeholder="Reason for rejection..."
                                          value={reviewNotes}
                                          onChange={(e) => setReviewNotes(e.target.value)}
                                          required
                                        />
                                        <div className="flex space-x-2">
                                          <Button 
                                            variant="outline" 
                                            onClick={() => setSelectedSubmission(null)}
                                          >
                                            Cancel
                                          </Button>
                                          <Button 
                                            onClick={() => handleReviewSubmission('rejected')}
                                            disabled={reviewSubmissionMutation.isPending || !reviewNotes.trim()}
                                            variant="destructive"
                                          >
                                            Confirm Rejection
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="p-12 text-center">
                          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <h3 className="text-lg font-semibold text-foreground mb-2">All caught up!</h3>
                          <p className="text-muted-foreground">
                            No ad submissions pending review at the moment.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Placeholder sections for future development */}
            {["content", "settings", "monitoring", "audit"].includes(activeSection) && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Settings className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h3>
                  <p className="text-muted-foreground">
                    This section is under development and will be available soon.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
