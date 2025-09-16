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
import { Switch } from "@/components/ui/switch";
import { 
  Settings, Users, FileText, Flag, DollarSign, BarChart3, CheckCircle, XCircle, Eye, AlertTriangle,
  Search, Filter, Download, Upload, Shield, Monitor, Database, Globe, Mail, CreditCard,
  Activity, Lock, Unlock, UserPlus, UserMinus, Trash2, Edit3, Calendar, TrendingUp,
  Clock, Server, Wifi, AlertCircle, RefreshCw, MoreVertical, Bell, Home, MessageSquare,
  Save, MapPin, Plus, Percent, Send, Key, Bot, Zap, ArrowUp
} from "lucide-react";
import { Label } from "@/components/ui/label";
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
  const [activeForm, setActiveForm] = useState<'discount' | 'trial' | null>(null);
  
  // AI Assistant state
  const [aiMessages, setAiMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}>>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI Assistant. I can help you edit and modify your website through natural language commands. For example, you can say:\n\n• "Add a new menu item called About Us"\n• "Change the homepage title to Welcome to HubLink"\n• "Create a new user with admin privileges"\n• "Update the pricing section with new rates"\n\nWhat would you like me to help you with today?',
      timestamp: new Date()
    }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // AI Assistant functions
  const handleAiMessage = async () => {
    if (!aiInput.trim() || aiLoading) return;
    
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: aiInput.trim(),
      timestamp: new Date()
    };
    
    setAiMessages(prev => [...prev, userMessage]);
    setAiInput("");
    setAiLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/ai/chat', {
        message: userMessage.content,
        context: 'admin_panel'
      });
      
      const result = await response.json();
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: result.response,
        timestamp: new Date()
      };
      
      setAiMessages(prev => [...prev, aiResponse]);
    } catch (error: any) {
      console.error('AI chat error:', error);
      const errorResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: `Sorry, I encountered an error: ${error.message || 'Unable to process your request'}. Please try again.`,
        timestamp: new Date()
      };
      setAiMessages(prev => [...prev, errorResponse]);
      
      toast({
        title: "AI Assistant Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Show login screen if not authenticated instead of redirecting

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
    enabled: Boolean(user && ['admin', 'superadmin', 'moderator'].includes(user.role || '')),
    retry: false,
  });

  // Fetch ad submissions
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ["/api/admin/submissions"],
    enabled: Boolean(user && ['admin', 'superadmin', 'moderator'].includes(user.role || '')),
    retry: false,
  });
  
  // Cast submissions to proper type for TypeScript
  const typedSubmissions = submissions as AdSubmission[];

  // Fetch reports
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/admin/reports"],
    enabled: Boolean(user && ['admin', 'superadmin', 'moderator'].includes(user.role || '')),
    retry: false,
  });

  // Fetch API settings
  const { data: apiSettings, isLoading: apiSettingsLoading, refetch: refetchApiSettings } = useQuery({
    queryKey: ["/api/admin/api-settings"],
    enabled: Boolean(user && ['admin', 'superadmin'].includes(user.role || '')),
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

  // API Settings mutations
  const saveApiSettingsMutation = useMutation({
    mutationFn: async (data: { service: string; settings: any }) => {
      setSavingService(data.service);
      return await apiRequest("PUT", `/api/admin/api-settings/${data.service}`, data.settings);
    },
    onSuccess: (data, variables) => {
      setSavingService(null);
      toast({
        title: "Settings Saved",
        description: `${variables.service} API settings saved successfully!`,
      });
      refetchApiSettings();
    },
    onError: (error: any) => {
      setSavingService(null);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save API settings.",
        variant: "destructive",
      });
    },
  });

  const testApiConnectionMutation = useMutation({
    mutationFn: async (service: string) => {
      return await apiRequest("POST", `/api/admin/api-settings/test/${service}`, {});
    },
    onSuccess: (data, service) => {
      const result = typeof data === 'object' && data !== null ? data : {};
      toast({
        title: "Test Successful",
        description: (result as any).message || `${service} API connection successful!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.message || "API connection test failed.",
        variant: "destructive",
      });
    },
  });

  // API Settings form state  
  const [apiFormData, setApiFormData] = useState<any>({
    stripe: {
      publishableKey: '',
      secretKey: '',
      webhookSecret: ''
    },
    paypal: {
      clientId: '',
      clientSecret: '',
      environment: 'sandbox'
    },
    youtube: {
      apiKey: '',
      projectId: 'hublink-project'
    },
    openai: {
      apiKey: '',
      model: 'gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 0.7
    },
    maps: {
      apiKey: '',
      enableAdvancedFeatures: true
    }
  });
  
  // Track which service is currently being saved
  const [savingService, setSavingService] = useState<string | null>(null);

  // Initialize form data with API settings
  useEffect(() => {
    if (apiSettings) {
      const settings = apiSettings as any; // Type cast for safety
      setApiFormData({
        openai: {
          apiKey: '', // Don't pre-populate sensitive data
          model: settings.openai?.model || 'gpt-3.5-turbo',
          maxTokens: settings.openai?.maxTokens || 1000,
          temperature: settings.openai?.temperature || 0.7,
        },
        stripe: {
          publishableKey: '',
          secretKey: '',
          webhookSecret: '',
        },
        paypal: {
          clientId: '',
          clientSecret: '',
          environment: settings.paypal?.environment || 'sandbox',
        },
        youtube: {
          apiKey: '',
          projectId: settings.youtube?.projectId || 'hublink-project',
        },
        maps: {
          apiKey: '', // Don't pre-populate sensitive data
          enableAdvancedFeatures: true
        }
      });
    }
  }, [apiSettings]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !['admin', 'superadmin', 'moderator'].includes(user.role || '')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="border-2 border-accent">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Shield className="w-16 h-16 text-accent" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Admin Login</h1>
              <p className="text-muted-foreground">
                Access the HubLink administration panel
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin ID</label>
                <Input 
                  type="text" 
                  placeholder="Enter Admin ID"
                  className="w-full"
                  id="admin-id"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input 
                  type="password" 
                  placeholder="Enter Password"
                  className="w-full"
                  id="admin-password"
                />
              </div>
              <Button 
                className="w-full bg-accent hover:bg-accent/90" 
                onClick={async () => {
                  const id = (document.getElementById('admin-id') as HTMLInputElement)?.value;
                  const password = (document.getElementById('admin-password') as HTMLInputElement)?.value;
                  
                  if (!id || !password) {
                    toast({
                      title: "Missing Credentials",
                      description: "Please enter both Admin ID and Password",
                      variant: "destructive",
                    });
                    return;
                  }

                  try {
                    const response = await fetch('/api/demo-login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id, password }),
                      credentials: 'include',
                    });
                    
                    if (response.ok) {
                      toast({
                        title: "Login Successful",
                        description: "Welcome to HubLink Admin Panel",
                      });
                      setTimeout(() => {
                        window.location.reload();
                      }, 1000);
                    } else {
                      toast({
                        title: "Login Failed",
                        description: "Invalid Admin ID or Password",
                        variant: "destructive",
                      });
                    }
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Network error occurred",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <Shield className="w-4 h-4 mr-2" />
                Login to Admin Panel
              </Button>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold text-sm mb-2">Admin Credentials:</h3>
                <div className="text-xs space-y-1 font-mono">
                  <div><strong>ID:</strong> ADMIN_001</div>
                  <div><strong>Password:</strong> admin123</div>
                </div>
              </div>
              
              <Button variant="outline" className="w-full" asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const pendingSubmissions = Array.isArray(submissions) ? submissions.filter((s: AdSubmission) => s.status === 'pending') : [];
  const pendingReports = Array.isArray(reports) ? reports.filter((r: Report) => r.status === 'pending') : [];

  // Navigation items for admin panel
  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, description: "Overview & Analytics" },
    { id: "users", label: "User Management", icon: Users, description: "Manage all users", badge: "Live" },
    { id: "ai-assistant", label: "AI Assistant", icon: MessageSquare, description: "ChatGPT-style website editor", badge: "AI" },
    { id: "email-management", label: "Email Management", icon: Mail, description: "Company communications", badge: "New" },
    { id: "discount-codes", label: "Coupons & Trials", icon: Percent, description: "Manage discount codes, trial coupons & auto-billing", badge: "Updated" },
    { id: "branding", label: "Branding & Logo", icon: Globe, description: "Website appearance", badge: "New" },
    { id: "api-settings", label: "API Settings", icon: Key, description: "Configure API keys & integrations", badge: "New" },
    { id: "content", label: "Content Moderation", icon: FileText, description: "Posts, stays, events" },
    { id: "ad-review", label: "Ad Review", icon: Eye, description: "Review ad submissions", badge: "Updated" },
    { id: "financial", label: "Financial", icon: DollarSign, description: "Revenue, payments & finances" },
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
                <div className="text-2xl font-bold">{(dashboardData as any)?.totalUsers || 0}</div>
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
                <div className="text-2xl font-bold">{(dashboardData as any)?.totalPosts || 0}</div>
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

            {/* AI Assistant Section */}
            {activeSection === "ai-assistant" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">AI Assistant</h2>
                      <p className="text-muted-foreground">ChatGPT-style website editor</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      <Zap className="w-3 h-3 mr-1" />
                      AI Powered
                    </Badge>
                    <Button variant="outline" onClick={() => setAiMessages([{
                      id: Date.now().toString(),
                      role: 'assistant',
                      content: 'Hello! I\'m your AI Assistant. I can help you edit and modify your website through natural language commands. What would you like me to help you with today?',
                      timestamp: new Date()
                    }])}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      New Chat
                    </Button>
                  </div>
                </div>

                {/* Chat Interface */}
                <Card className="h-[600px] flex flex-col">
                  <CardHeader className="border-b">
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5" />
                      <span>Website Editor Chat</span>
                    </CardTitle>
                  </CardHeader>
                  
                  {/* Messages Area */}
                  <CardContent className="flex-1 p-0 overflow-hidden">
                    <div className="h-full overflow-y-auto p-4 space-y-4">
                      {aiMessages.map((message) => (
                        <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === 'user' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-muted text-foreground border'
                          }`}>
                            <div className="flex items-start space-x-2">
                              {message.role === 'assistant' && (
                                <Bot className="w-4 h-4 mt-1 text-purple-500" />
                              )}
                              <div className="flex-1">
                                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                                <div className={`text-xs mt-1 ${
                                  message.role === 'user' ? 'text-blue-100' : 'text-muted-foreground'
                                }`}>
                                  {format(message.timestamp, 'h:mm a')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {aiLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted text-foreground border rounded-lg p-3 max-w-[80%]">
                            <div className="flex items-center space-x-2">
                              <Bot className="w-4 h-4 text-purple-500" />
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  {/* Input Area */}
                  <div className="border-t p-4">
                    <div className="flex space-x-2">
                      <div className="flex-1 relative">
                        <Textarea
                          value={aiInput}
                          onChange={(e) => setAiInput(e.target.value)}
                          placeholder="Type your command... e.g., 'Add a new menu item called About Us' or 'Change the homepage title'"
                          className="pr-12 resize-none"
                          rows={1}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAiMessage();
                            }
                          }}
                          disabled={aiLoading}
                        />
                        <Button
                          size="sm"
                          className="absolute right-2 top-1.5"
                          onClick={handleAiMessage}
                          disabled={!aiInput.trim() || aiLoading}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      💡 Try commands like: "Add new user", "Update homepage", "Change menu items", "Modify pricing"
                    </div>
                  </div>
                </Card>

                {/* AI Features Info */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Globe className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Website Editing</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Modify content, menus, pages, and layout through natural language commands
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-4 h-4 text-green-500" />
                        <span className="font-medium">User Management</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Create, update, or manage users, roles, and permissions with simple commands
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Settings className="w-4 h-4 text-purple-500" />
                        <span className="font-medium">System Config</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Update settings, configurations, and platform features through AI assistance
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* API Settings Section */}
            {activeSection === "api-settings" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">API Settings & Integrations</h2>
                  <div className="flex space-x-2">
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export Config
                    </Button>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Import Config
                    </Button>
                  </div>
                </div>

                {/* API Keys Management Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Stripe API Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CreditCard className="w-5 h-5 mr-2" />
                          Stripe API Keys
                        </div>
                        <Badge 
                          variant={(apiSettings as any)?.stripe?.status === 'active' ? "secondary" : "destructive"}
                          className={(apiSettings as any)?.stripe?.status === 'active' ? "bg-green-100 text-green-800" : ""}
                        >
                          {(apiSettings as any)?.stripe?.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Publishable Key</Label>
                        <div className="flex space-x-2 mt-1">
                          <Input 
                            type="password" 
                            placeholder="pk_live_..." 
                            value={apiFormData.stripe?.publishableKey || ''}
                            onChange={(e) => setApiFormData(prev => ({
                              ...prev,
                              stripe: { ...prev.stripe, publishableKey: e.target.value }
                            }))}
                          />
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>Secret Key</Label>
                        <div className="flex space-x-2 mt-1">
                          <Input 
                            type="password" 
                            placeholder="sk_live_..." 
                            value={apiFormData.stripe?.secretKey || ''}
                            onChange={(e) => setApiFormData(prev => ({
                              ...prev,
                              stripe: { ...prev.stripe, secretKey: e.target.value }
                            }))}
                          />
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>Webhook Secret</Label>
                        <div className="flex space-x-2 mt-1">
                          <Input 
                            type="password" 
                            placeholder="whsec_..." 
                            value={apiFormData.stripe?.webhookSecret || ''}
                            onChange={(e) => setApiFormData(prev => ({
                              ...prev,
                              stripe: { ...prev.stripe, webhookSecret: e.target.value }
                            }))}
                          />
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm"
                          onClick={() => {
                            if (!apiFormData.stripe?.publishableKey && !apiFormData.stripe?.secretKey) {
                              toast({
                                title: "API Keys Required",
                                description: "Please enter at least one Stripe API key.",
                                variant: "destructive",
                              });
                              return;
                            }
                            saveApiSettingsMutation.mutate({
                              service: 'stripe',
                              settings: apiFormData.stripe || {}
                            });
                          }}
                          disabled={savingService === 'stripe'}
                        >
                          {savingService === 'stripe' ? 'Saving...' : 'Update Keys'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => testApiConnectionMutation.mutate('stripe')}
                          disabled={testApiConnectionMutation.isPending}
                        >
                          {testApiConnectionMutation.isPending ? 'Testing...' : 'Test Connection'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* PayPal API Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <DollarSign className="w-5 h-5 mr-2" />
                          PayPal API Keys
                        </div>
                        <Badge 
                          variant={(apiSettings as any)?.paypal?.status === 'active' ? "secondary" : "destructive"}
                          className={(apiSettings as any)?.paypal?.status === 'active' ? "bg-green-100 text-green-800" : ""}
                        >
                          {(apiSettings as any)?.paypal?.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Client ID</Label>
                        <div className="flex space-x-2 mt-1">
                          <Input 
                            type="password" 
                            placeholder="Enter PayPal Client ID"
                            value={apiFormData.paypal?.clientId || ''}
                            onChange={(e) => setApiFormData(prev => ({
                              ...prev,
                              paypal: { ...prev.paypal, clientId: e.target.value }
                            }))} 
                          />
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>Client Secret</Label>
                        <div className="flex space-x-2 mt-1">
                          <Input 
                            type="password" 
                            placeholder="Enter PayPal Client Secret"
                            value={apiFormData.paypal?.clientSecret || ''}
                            onChange={(e) => setApiFormData(prev => ({
                              ...prev,
                              paypal: { ...prev.paypal, clientSecret: e.target.value }
                            }))} 
                          />
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>Environment</Label>
                        <Select defaultValue="sandbox">
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sandbox">Sandbox</SelectItem>
                            <SelectItem value="live">Live</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm"
                          onClick={() => {
                            if (!apiFormData.paypal?.clientId || !apiFormData.paypal?.clientSecret) {
                              toast({
                                title: "API Keys Required",
                                description: "Please enter both PayPal Client ID and Secret.",
                                variant: "destructive",
                              });
                              return;
                            }
                            saveApiSettingsMutation.mutate({
                              service: 'paypal',
                              settings: apiFormData.paypal || {}
                            });
                          }}
                          disabled={savingService === 'paypal'}
                        >
                          {savingService === 'paypal' ? 'Saving...' : 'Save Keys'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => testApiConnectionMutation.mutate('paypal')}
                          disabled={testApiConnectionMutation.isPending}
                        >
                          {testApiConnectionMutation.isPending ? 'Testing...' : 'Test Connection'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* YouTube API Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Globe className="w-5 h-5 mr-2" />
                          YouTube API Key
                        </div>
                        <Badge 
                          variant={apiSettings?.youtube?.status === 'active' ? "secondary" : "destructive"}
                          className={apiSettings?.youtube?.status === 'active' ? "bg-green-100 text-green-800" : ""}
                        >
                          {apiSettings?.youtube?.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>API Key</Label>
                        <div className="flex space-x-2 mt-1">
                          <Input 
                            type="password" 
                            placeholder="Enter YouTube API Key"
                            value={apiFormData.youtube?.apiKey || ''}
                            onChange={(e) => setApiFormData(prev => ({
                              ...prev,
                              youtube: { ...prev.youtube, apiKey: e.target.value }
                            }))} 
                          />
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>Project ID</Label>
                        <Input 
                          placeholder="Google Cloud Project ID" 
                          className="mt-1"
                          value={apiFormData.youtube?.projectId || ''}
                          onChange={(e) => setApiFormData(prev => ({
                            ...prev,
                            youtube: { ...prev.youtube, projectId: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm"
                          onClick={() => {
                            if (!apiFormData.youtube?.apiKey) {
                              toast({
                                title: "API Key Required",
                                description: "Please enter YouTube API key.",
                                variant: "destructive",
                              });
                              return;
                            }
                            saveApiSettingsMutation.mutate({
                              service: 'youtube',
                              settings: apiFormData.youtube || {}
                            });
                          }}
                          disabled={saveApiSettingsMutation.isPending}
                        >
                          {saveApiSettingsMutation.isPending ? 'Saving...' : 'Save API Key'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => testApiConnectionMutation.mutate('youtube')}
                          disabled={testApiConnectionMutation.isPending}
                        >
                          {testApiConnectionMutation.isPending ? 'Testing...' : 'Test API'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* OpenAI API Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Bot className="w-5 h-5 mr-2" />
                          OpenAI API Configuration
                        </div>
                        <Badge 
                          variant={apiSettings?.openai?.status === 'active' ? "secondary" : "destructive"}
                          className={apiSettings?.openai?.status === 'active' ? "bg-green-100 text-green-800" : ""}
                        >
                          {apiSettings?.openai?.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>API Key</Label>
                        <div className="flex space-x-2 mt-1">
                          <Input 
                            type="password" 
                            placeholder="sk-..." 
                            value={apiFormData.openai?.apiKey || ''}
                            onChange={(e) => setApiFormData(prev => ({
                              ...prev,
                              openai: { ...prev.openai, apiKey: e.target.value }
                            }))}
                          />
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>Model Selection</Label>
                        <Select 
                          value={apiFormData.openai?.model || apiSettings?.openai?.model || "gpt-3.5-turbo"}
                          onValueChange={(value) => setApiFormData(prev => ({
                            ...prev,
                            openai: { ...prev.openai, model: value }
                          }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Recommended)</SelectItem>
                            <SelectItem value="gpt-4">GPT-4 (Premium)</SelectItem>
                            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Max Tokens</Label>
                        <Input 
                          type="number" 
                          value={apiFormData.openai?.maxTokens || apiSettings?.openai?.maxTokens || 1000}
                          onChange={(e) => setApiFormData(prev => ({
                            ...prev,
                            openai: { ...prev.openai, maxTokens: parseInt(e.target.value) }
                          }))}
                          placeholder="1000"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Temperature</Label>
                        <Input 
                          type="number" 
                          step="0.1"
                          min="0"
                          max="2"
                          value={apiFormData.openai?.temperature || apiSettings?.openai?.temperature || 0.7}
                          onChange={(e) => setApiFormData(prev => ({
                            ...prev,
                            openai: { ...prev.openai, temperature: parseFloat(e.target.value) }
                          }))}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm"
                          onClick={() => {
                            if (!apiFormData.openai?.apiKey) {
                              toast({
                                title: "API Key Required",
                                description: "Please enter your OpenAI API key first.",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            saveApiSettingsMutation.mutate({
                              service: 'openai',
                              settings: apiFormData.openai || {}
                            });
                          }}
                          disabled={savingService === 'openai'}
                        >
                          {savingService === 'openai' ? 'Saving...' : 'Save Settings'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => testApiConnectionMutation.mutate('openai')}
                          disabled={testApiConnectionMutation.isPending}
                        >
                          {testApiConnectionMutation.isPending ? 'Testing...' : 'Test AI Chat'}
                        </Button>
                      </div>
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span>API Status:</span>
                          <Badge 
                            variant={apiSettings?.openai?.status === 'active' ? "secondary" : "destructive"}
                            className={apiSettings?.openai?.status === 'active' ? "bg-green-100 text-green-800" : ""}
                          >
                            {apiSettings?.openai?.status === 'active' ? 'Connected' : 'Disconnected'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span>Current Model:</span>
                          <span className="font-mono text-xs">
                            {apiSettings?.openai?.model || 'gpt-3.5-turbo'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span>Monthly Usage:</span>
                          <span className="font-mono text-xs">
                            {apiSettings?.openai?.monthlyUsage || 0} tokens
                          </span>
                        </div>
                        {apiSettings?.openai?.lastTested && (
                          <div className="flex items-center justify-between text-sm mt-2">
                            <span>Last Tested:</span>
                            <span className="font-mono text-xs">
                              {format(new Date(apiSettings.openai.lastTested), 'MMM dd, h:mm a')}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Google Maps Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <MapPin className="w-5 h-5 mr-2" />
                          Google Maps API
                        </div>
                        <Badge 
                          variant={apiSettings?.maps?.status === 'active' ? "secondary" : "destructive"}
                          className={apiSettings?.maps?.status === 'active' ? "bg-green-100 text-green-800" : ""}
                        >
                          {apiSettings?.maps?.status === 'active' ? 'Connected' : 'Disconnected'}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Configure Google Maps API for location services, geocoding, and map visualization
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="maps-api-key">API Key *</Label>
                        <Input
                          id="maps-api-key"
                          name="apiKey"
                          type="password"
                          placeholder="AIzaSy..."
                          value={apiFormData.maps?.apiKey || ''}
                          onChange={(e) => setApiFormData(prev => ({
                            ...prev,
                            maps: { ...prev.maps, apiKey: e.target.value }
                          }))}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Your Google Maps JavaScript API key
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="maps-advanced-features"
                          checked={apiFormData.maps?.enableAdvancedFeatures || false}
                          onCheckedChange={(checked) => setApiFormData(prev => ({
                            ...prev,
                            maps: { ...prev.maps, enableAdvancedFeatures: checked }
                          }))}
                        />
                        <Label htmlFor="maps-advanced-features" className="text-sm">
                          Enable Advanced Features (3D, Street View)
                        </Label>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (!apiFormData.maps?.apiKey) {
                              toast({
                                title: "API Key Required",
                                description: "Please enter your Google Maps API key first.",
                                variant: "destructive"
                              });
                              return;
                            }
                            saveApiSettingsMutation.mutate({
                              service: 'maps',
                              settings: apiFormData.maps || {}
                            });
                          }}
                          disabled={savingService === 'maps'}
                        >
                          {savingService === 'maps' ? 'Saving...' : 'Save Configuration'}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => testApiConnectionMutation.mutate('maps')}
                          disabled={testApiConnectionMutation.isPending}
                        >
                          {testApiConnectionMutation.isPending ? 'Testing...' : 'Test Connection'}
                        </Button>
                      </div>
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span>API Status:</span>
                          <Badge 
                            variant={apiSettings?.maps?.status === 'active' ? "secondary" : "destructive"}
                            className={apiSettings?.maps?.status === 'active' ? "bg-green-100 text-green-800" : ""}
                          >
                            {apiSettings?.maps?.status === 'active' ? 'Connected' : 'Disconnected'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span>Services Available:</span>
                          <span className="font-mono text-xs">
                            Maps, Geocoding, Places
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span>Monthly Requests:</span>
                          <span className="font-mono text-xs">
                            {apiSettings?.maps?.monthlyRequests || 0} / 25,000
                          </span>
                        </div>
                        {apiSettings?.maps?.lastTested && (
                          <div className="flex items-center justify-between text-sm mt-2">
                            <span>Last Tested:</span>
                            <span className="font-mono text-xs">
                              {format(new Date(apiSettings.maps.lastTested), 'MMM dd, h:mm a')}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Database Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Database className="w-5 h-5 mr-2" />
                          Database Config
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Connected</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Database URL</Label>
                        <Input 
                          type="password" 
                          defaultValue="postgres://••••••••••••"
                          disabled
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Connection Pool Size</Label>
                        <Input 
                          type="number" 
                          defaultValue="10"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Test Connection</Button>
                        <Button variant="outline" size="sm">View Logs</Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Google Cloud Storage */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Server className="w-5 h-5 mr-2" />
                          Google Cloud Storage
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Bucket Name</Label>
                        <Input 
                          defaultValue="hublink-storage"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Service Account Key</Label>
                        <div className="flex space-x-2 mt-1">
                          <Input 
                            type="password" 
                            defaultValue="••••••••••••"
                          />
                          <Button variant="outline" size="sm">
                            <Upload className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm">Update Config</Button>
                        <Button variant="outline" size="sm">Test Storage</Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Email Service Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Mail className="w-5 h-5 mr-2" />
                          Email Service
                        </div>
                        <Badge variant="outline">Not Configured</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Service Provider</Label>
                        <Select>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select email service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sendgrid">SendGrid</SelectItem>
                            <SelectItem value="mailgun">Mailgun</SelectItem>
                            <SelectItem value="ses">Amazon SES</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>API Key</Label>
                        <div className="flex space-x-2 mt-1">
                          <Input 
                            type="password" 
                            placeholder="Enter API Key" 
                          />
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm">Save Config</Button>
                        <Button variant="outline" size="sm">Send Test Email</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* API Usage Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      API Usage Statistics (Last 30 Days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">2,456</div>
                        <div className="text-sm text-muted-foreground">Stripe API Calls</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">0</div>
                        <div className="text-sm text-muted-foreground">PayPal API Calls</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">0</div>
                        <div className="text-sm text-muted-foreground">YouTube API Calls</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">12,890</div>
                        <div className="text-sm text-muted-foreground">Storage Requests</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      API Security Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label>Rate Limiting</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Input type="number" defaultValue="100" />
                          <span className="text-sm text-muted-foreground">requests/minute</span>
                        </div>
                      </div>
                      <div>
                        <Label>API Key Rotation</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Input type="number" defaultValue="90" />
                          <span className="text-sm text-muted-foreground">days</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm">Apply Security Settings</Button>
                      <Button variant="outline" size="sm">Generate New API Key</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Ad Review Section */}
            {activeSection === "ad-review" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Ad Submissions Review</h2>
                  <div className="flex space-x-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Submissions</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </div>

                {/* Ad Submissions List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Eye className="w-5 h-5 text-chart-2" />
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
                                        View File
                                      </a>
                                    </Button>
                                  )}
                                </div>
                                <div className="flex space-x-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setSelectedSubmission(submission)}
                                      >
                                        <Eye className="w-3 h-3 mr-2" />
                                        Review
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle>Review Ad Submission</DialogTitle>
                                      </DialogHeader>
                                      {selectedSubmission && (
                                        <div className="space-y-4">
                                          <div>
                                            <h4 className="font-medium mb-2">Submission Details</h4>
                                            <div className="space-y-2 text-sm">
                                              <p><strong>ID:</strong> {selectedSubmission.id}</p>
                                              <p><strong>Status:</strong> {selectedSubmission.status}</p>
                                              <p><strong>Submitted:</strong> {format(new Date(selectedSubmission.createdAt!), 'MMM d, yyyy h:mm a')}</p>
                                            </div>
                                          </div>
                                          
                                          <div>
                                            <Label htmlFor="review-notes">Review Notes</Label>
                                            <Textarea 
                                              id="review-notes"
                                              placeholder="Add review notes or feedback..."
                                              value={reviewNotes}
                                              onChange={(e) => setReviewNotes(e.target.value)}
                                              className="mt-1"
                                              rows={3}
                                            />
                                          </div>
                                          
                                          <div className="flex justify-end space-x-2">
                                            <Button 
                                              variant="outline" 
                                              onClick={() => handleReviewSubmission('rejected')}
                                              disabled={reviewSubmissionMutation.isPending}
                                            >
                                              <XCircle className="w-4 h-4 mr-2" />
                                              Reject
                                            </Button>
                                            <Button 
                                              onClick={() => handleReviewSubmission('approved')}
                                              disabled={reviewSubmissionMutation.isPending}
                                              className="bg-green-600 hover:bg-green-700"
                                            >
                                              <CheckCircle className="w-4 h-4 mr-2" />
                                              Approve & Pay
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
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

                {/* Ad Review Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ad Review Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{submissions.length}</div>
                        <div className="text-sm text-muted-foreground">Total Submissions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{pendingSubmissions.length}</div>
                        <div className="text-sm text-muted-foreground">Pending Review</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{submissions.filter((s: AdSubmission) => s.status === 'approved').length}</div>
                        <div className="text-sm text-muted-foreground">Approved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{submissions.filter((s: AdSubmission) => s.status === 'rejected').length}</div>
                        <div className="text-sm text-muted-foreground">Rejected</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Email Management System */}
            {activeSection === "email-management" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Email Management System</h2>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Send className="w-4 h-4 mr-2" />
                    Send Campaign
                  </Button>
                </div>

                {/* Email Service Settings */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* SMTP Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Server className="w-5 h-5 mr-2" />
                        SMTP Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>SMTP Host</Label>
                        <Input defaultValue="smtp.hublink.com" className="mt-1" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Port</Label>
                          <Input defaultValue="587" className="mt-1" />
                        </div>
                        <div>
                          <Label>Security</Label>
                          <Input defaultValue="TLS" className="mt-1" />
                        </div>
                      </div>
                      <div>
                        <Label>Username</Label>
                        <Input defaultValue="notifications@hublink.com" className="mt-1" />
                      </div>
                      <div>
                        <Label>Password</Label>
                        <Input type="password" defaultValue="••••••••" className="mt-1" />
                      </div>
                      <Button className="w-full">Test Connection</Button>
                    </CardContent>
                  </Card>

                  {/* Email Templates */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Email Templates
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">Welcome Email</span>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                        <div className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">Password Reset</span>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                        <div className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">Subscription Update</span>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                        <div className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">Payment Receipt</span>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Template
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Bulk Email Campaign */}
                <Card>
                  <CardHeader>
                    <CardTitle>Email Campaigns & User Communications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label>Campaign Type</Label>
                        <Select>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newsletter">Newsletter</SelectItem>
                            <SelectItem value="promotion">Promotion</SelectItem>
                            <SelectItem value="update">Platform Update</SelectItem>
                            <SelectItem value="announcement">Announcement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Target Audience</Label>
                        <Select>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select audience" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            <SelectItem value="premium">Premium Users</SelectItem>
                            <SelectItem value="free">Free Users</SelectItem>
                            <SelectItem value="creators">Creators</SelectItem>
                            <SelectItem value="inactive">Inactive Users</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Schedule</Label>
                        <Select>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Send now" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="now">Send Now</SelectItem>
                            <SelectItem value="scheduled">Schedule Later</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Email Subject</Label>
                      <Input placeholder="Enter email subject..." className="mt-1" />
                    </div>
                    <div>
                      <Label>Email Content</Label>
                      <div className="mt-1 p-4 border rounded min-h-[120px] bg-muted/20">
                        <p className="text-sm text-muted-foreground">Rich text editor would go here...</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button>Send Campaign</Button>
                      <Button variant="outline">Save Draft</Button>
                      <Button variant="outline">Preview</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Email Analytics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Email Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">2,341</div>
                        <div className="text-sm text-muted-foreground">Emails Sent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">89.2%</div>
                        <div className="text-sm text-muted-foreground">Delivery Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">34.5%</div>
                        <div className="text-sm text-muted-foreground">Open Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">12.3%</div>
                        <div className="text-sm text-muted-foreground">Click Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* User Management Section */}
            {/* Coupons & Trials Management */}
            {activeSection === "discount-codes" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Coupons & Trials Management</h2>
                  <div className="flex space-x-2">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => setActiveForm(activeForm === 'discount' ? null : 'discount')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {activeForm === 'discount' ? 'Hide Form' : 'Create Discount Code'}
                    </Button>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => setActiveForm(activeForm === 'trial' ? null : 'trial')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {activeForm === 'trial' ? 'Hide Form' : 'Create Trial Code'}
                    </Button>
                  </div>
                </div>

                {/* Trial Statistics Dashboard */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">45</div>
                        <div className="text-sm text-muted-foreground">Active Trials</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">75.3%</div>
                        <div className="text-sm text-muted-foreground">Conversion Rate</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">£2,305</div>
                        <div className="text-sm text-muted-foreground">Revenue Lost</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">£2,025</div>
                        <div className="text-sm text-muted-foreground">Projected Revenue</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Active Trials Monitoring */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Active User Trials (Auto-Billing Tracking)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">User</th>
                            <th className="text-left p-2">Coupon Code</th>
                            <th className="text-left p-2">Plan Type</th>
                            <th className="text-left p-2">Days Left</th>
                            <th className="text-left p-2">Auto-Debit</th>
                            <th className="text-left p-2">Price</th>
                            <th className="text-left p-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-2">
                              <div>
                                <div className="font-medium">john@example.com</div>
                                <div className="text-xs text-muted-foreground">user_123</div>
                              </div>
                            </td>
                            <td className="p-2 font-mono">TRIAL30</td>
                            <td className="p-2">
                              <Badge variant="outline">Premium</Badge>
                            </td>
                            <td className="p-2">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1 text-orange-600" />
                                <span className="font-bold text-orange-600">25 days</span>
                              </div>
                            </td>
                            <td className="p-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-800">Enabled</Badge>
                            </td>
                            <td className="p-2 font-semibold">£45/mo</td>
                            <td className="p-2">
                              <Button variant="outline" size="sm" className="text-red-600">Cancel</Button>
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2">
                              <div>
                                <div className="font-medium">sarah@example.com</div>
                                <div className="text-xs text-muted-foreground">user_456</div>
                              </div>
                            </td>
                            <td className="p-2 font-mono">FREETRIAL7</td>
                            <td className="p-2">
                              <Badge variant="outline">Creator</Badge>
                            </td>
                            <td className="p-2">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1 text-red-600" />
                                <span className="font-bold text-red-600">3 days</span>
                              </div>
                            </td>
                            <td className="p-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-800">Enabled</Badge>
                            </td>
                            <td className="p-2 font-semibold">£45/mo</td>
                            <td className="p-2">
                              <Button variant="outline" size="sm" className="text-red-600">Cancel</Button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* All Codes Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>All Discount & Trial Codes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Code</th>
                            <th className="text-left p-2">Type</th>
                            <th className="text-left p-2">Benefit</th>
                            <th className="text-left p-2">Usage</th>
                            <th className="text-left p-2">Expires</th>
                            <th className="text-left p-2">Status</th>
                            <th className="text-left p-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-2 font-mono font-bold">WELCOME50</td>
                            <td className="p-2"><Badge>Discount</Badge></td>
                            <td className="p-2">50% off</td>
                            <td className="p-2">23/100</td>
                            <td className="p-2">30 days</td>
                            <td className="p-2"><Badge variant="secondary">Active</Badge></td>
                            <td className="p-2">
                              <Button variant="outline" size="sm">Edit</Button>
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-mono font-bold">SAVE10</td>
                            <td className="p-2"><Badge>Discount</Badge></td>
                            <td className="p-2">£10 off</td>
                            <td className="p-2">8/50</td>
                            <td className="p-2">60 days</td>
                            <td className="p-2"><Badge variant="secondary">Active</Badge></td>
                            <td className="p-2">
                              <Button variant="outline" size="sm">Edit</Button>
                            </td>
                          </tr>
                          <tr className="border-b bg-purple-50 dark:bg-purple-900/20">
                            <td className="p-2 font-mono font-bold text-purple-700">TRIAL30</td>
                            <td className="p-2"><Badge className="bg-purple-600">Trial</Badge></td>
                            <td className="p-2">
                              <div>
                                <div className="font-semibold">30 days free</div>
                                <div className="text-xs text-muted-foreground">Premium Plan</div>
                              </div>
                            </td>
                            <td className="p-2">45/500</td>
                            <td className="p-2">90 days</td>
                            <td className="p-2"><Badge variant="secondary">Active</Badge></td>
                            <td className="p-2">
                              <Button variant="outline" size="sm">Edit</Button>
                            </td>
                          </tr>
                          <tr className="border-b bg-purple-50 dark:bg-purple-900/20">
                            <td className="p-2 font-mono font-bold text-purple-700">FREETRIAL7</td>
                            <td className="p-2"><Badge className="bg-purple-600">Trial</Badge></td>
                            <td className="p-2">
                              <div>
                                <div className="font-semibold">7 days free</div>
                                <div className="text-xs text-muted-foreground">Creator Plan</div>
                              </div>
                            </td>
                            <td className="p-2">12/100</td>
                            <td className="p-2">30 days</td>
                            <td className="p-2"><Badge variant="secondary">Active</Badge></td>
                            <td className="p-2">
                              <Button variant="outline" size="sm">Edit</Button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Dynamic Forms Based on Active Form */}
                {activeForm === 'discount' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Create New Discount Code</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label>Coupon Code</Label>
                          <Input placeholder="WELCOME50" className="mt-1 font-mono" />
                        </div>
                        <div>
                          <Label>Discount Type</Label>
                          <Select>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage (%)</SelectItem>
                              <SelectItem value="fixed_amount">Fixed Amount (£)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Discount Value</Label>
                          <Input type="number" placeholder="50" className="mt-1" />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label>Max Uses</Label>
                          <Input type="number" placeholder="100" className="mt-1" />
                        </div>
                        <div>
                          <Label>Min Order Value (£)</Label>
                          <Input type="number" placeholder="25" className="mt-1" />
                        </div>
                        <div>
                          <Label>Valid Until</Label>
                          <Input type="date" className="mt-1" />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Applicable Plans</Label>
                          <Select>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select plans" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Plans</SelectItem>
                              <SelectItem value="premium">Premium Only</SelectItem>
                              <SelectItem value="creator">Creator Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Select defaultValue="active">
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">✅ Active</SelectItem>
                              <SelectItem value="inactive">❌ Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Input placeholder="50% off for new users" className="mt-1" />
                      </div>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Create Discount Code
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {activeForm === 'trial' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Create New Trial Coupon</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label>Coupon Code</Label>
                          <Input placeholder="TRIAL30" className="mt-1 font-mono" />
                        </div>
                        <div>
                          <Label>Trial Period</Label>
                          <Select>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="7">7 Days</SelectItem>
                              <SelectItem value="14">14 Days</SelectItem>
                              <SelectItem value="30">30 Days</SelectItem>
                              <SelectItem value="60">60 Days</SelectItem>
                              <SelectItem value="90">90 Days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Plan Type</Label>
                          <Select>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select plan" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="premium">Premium (£45/mo)</SelectItem>
                              <SelectItem value="creator">Creator (£45/mo)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Max Uses</Label>
                          <Input type="number" placeholder="100" className="mt-1" />
                        </div>
                        <div>
                          <Label>Auto-Debit After Trial</Label>
                          <Select defaultValue="enabled">
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="enabled">✅ Enabled (Recommended)</SelectItem>
                              <SelectItem value="disabled">❌ Disabled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Input placeholder="30 days free trial - Premium Plan" className="mt-1" />
                      </div>
                      <Button className="w-full bg-purple-600 hover:bg-purple-700">
                        Create Trial Coupon
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Branding & Logo Management */}
            {activeSection === "branding" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Branding & Logo Management</h2>
                  <Button variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Preview Changes
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Logo Upload */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Logo & Images</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Website Logo</Label>
                        <div className="mt-2 p-4 border-2 border-dashed rounded-lg text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Click to upload logo</p>
                        </div>
                      </div>
                      <div>
                        <Label>Favicon</Label>
                        <div className="mt-2 p-4 border-2 border-dashed rounded-lg text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Click to upload favicon</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Brand Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Brand Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Website Name</Label>
                        <Input defaultValue="HubLink" className="mt-1" />
                      </div>
                      <div>
                        <Label>Primary Color</Label>
                        <Input type="color" defaultValue="#0066cc" className="mt-1 h-10" />
                      </div>
                      <div>
                        <Label>Secondary Color</Label>
                        <Input type="color" defaultValue="#f0f9ff" className="mt-1 h-10" />
                      </div>
                      <Button className="w-full">Save Changes</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeSection === "users" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">User Management</h2>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export Users
                    </Button>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Bulk Actions
                    </Button>
                  </div>
                </div>

                {/* User Search and Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Search className="w-5 h-5" />
                      <span>Search & Filter Users</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      <Input
                        placeholder="Search by name, email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Select value={filterRole} onValueChange={setFilterRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="creator">Creator</SelectItem>
                          <SelectItem value="publisher">Publisher</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="banned">Banned</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button>
                        <Filter className="w-4 h-4 mr-2" />
                        Apply Filters
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Users Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>All Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Join Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium">JD</span>
                              </div>
                              <div>
                                <div className="font-medium">John Doe</div>
                                <div className="text-sm text-muted-foreground">@johndoe</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>john@example.com</TableCell>
                          <TableCell>
                            <Badge variant="outline">Creator</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">Premium</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                          </TableCell>
                          <TableCell>Jan 15, 2024</TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button variant="outline" size="sm">
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Lock className="w-3 h-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {/* More user rows would be populated dynamically */}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* System Settings Section */}
            {activeSection === "settings" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">System Settings</h2>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </Button>
                </div>

                {/* Plan Pricing Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span>Plan Pricing Management</span>
                      <Badge variant="secondary">Live Editing</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Free Plan */}
                      <div className="border-2 border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">Free Plan</h3>
                          <Badge variant="outline">Active</Badge>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Plan Name</label>
                            <Input defaultValue="Free Plan" className="mt-1" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-sm font-medium">Price</label>
                              <Input defaultValue="0" type="number" className="mt-1" />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Currency</label>
                              <Select defaultValue="GBP">
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="GBP">GBP (£)</SelectItem>
                                  <SelectItem value="USD">USD ($)</SelectItem>
                                  <SelectItem value="EUR">EUR (€)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Features</label>
                            <Textarea 
                              defaultValue="Basic profile&#10;View content&#10;Limited messaging&#10;Community access"
                              rows={4}
                              className="mt-1"
                            />
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={() => {
                              toast({
                                title: "Plan Updated",
                                description: "Free plan settings have been saved successfully",
                              });
                            }}
                          >
                            Save Free Plan
                          </Button>
                        </div>
                      </div>

                      {/* Premium Plan */}
                      <div className="border-2 border-accent rounded-lg p-4 bg-accent/5">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">Premium Plan</h3>
                          <Badge className="bg-accent">Most Popular</Badge>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Plan Name</label>
                            <Input defaultValue="Premium Plan" className="mt-1" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-sm font-medium">Price</label>
                              <Input defaultValue="45" type="number" className="mt-1" />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Currency</label>
                              <Select defaultValue="GBP">
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="GBP">GBP (£)</SelectItem>
                                  <SelectItem value="USD">USD ($)</SelectItem>
                                  <SelectItem value="EUR">EUR (€)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Features</label>
                            <Textarea 
                              defaultValue="All Free features&#10;Creator tools&#10;Unlimited messaging&#10;Event creation&#10;Analytics dashboard&#10;Ad campaigns&#10;Priority support"
                              rows={4}
                              className="mt-1"
                            />
                          </div>
                          <Button 
                            className="w-full bg-accent hover:bg-accent/90" 
                            onClick={async () => {
                              try {
                                const response = await fetch('/api/admin/plans/premium', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    name: 'Premium Plan',
                                    price: 45,
                                    currency: 'GBP',
                                    billing: 'monthly',
                                    features: ['All Free features', 'Creator tools', 'Unlimited messaging', 'Event creation', 'Analytics dashboard', 'Ad campaigns', 'Priority support'],
                                    active: true
                                  })
                                });
                                
                                if (response.ok) {
                                  toast({
                                    title: "Plan Updated Successfully!",
                                    description: "Premium plan pricing has been updated and is now live",
                                  });
                                } else {
                                  throw new Error('Failed to update plan');
                                }
                              } catch (error) {
                                toast({
                                  title: "Update Failed",
                                  description: "There was an error updating the plan",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            Save Premium Plan
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="w-5 h-5 text-blue-600 mt-0.5">ℹ️</div>
                        <div>
                          <h4 className="font-medium text-blue-900 dark:text-blue-100">Live Plan Management</h4>
                          <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                            Changes to pricing and features are applied immediately. All new subscriptions will use the updated pricing.
                            Existing subscriptions will be updated at their next billing cycle.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Website Content Editor */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Edit3 className="w-5 h-5 text-purple-600" />
                      <span>Website Content Editor</span>
                      <Badge variant="secondary">Real-time</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Homepage Hero Title</label>
                          <Input 
                            defaultValue="Connect Travelers & Creators Globally" 
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Homepage Subtitle</label>
                          <Textarea 
                            defaultValue="Join the world's leading travel community platform"
                            rows={2}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Feature 1 Title</label>
                          <Input 
                            defaultValue="Discover Amazing Places" 
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Feature 1 Description</label>
                          <Textarea 
                            defaultValue="Explore curated content from fellow travelers"
                            rows={2}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Feature 2 Title</label>
                          <Input 
                            defaultValue="Connect with Creators" 
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Feature 2 Description</label>
                          <Textarea 
                            defaultValue="Follow your favorite travel creators and influencers"
                            rows={2}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Feature 3 Title</label>
                          <Input 
                            defaultValue="Plan Events Together" 
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Feature 3 Description</label>
                          <Textarea 
                            defaultValue="Create and join travel events with like-minded people"
                            rows={2}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/admin/content/homepage', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              hero_title: "Connect Travelers & Creators Globally",
                              hero_subtitle: "Join the world's leading travel community platform"
                            })
                          });
                          
                          if (response.ok) {
                            toast({
                              title: "Content Updated!",
                              description: "Website content has been updated successfully",
                            });
                          }
                        } catch (error) {
                          toast({
                            title: "Update Failed", 
                            description: "Failed to update website content",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Update Website Content
                    </Button>
                  </CardContent>
                </Card>

                {/* Platform Configuration */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Settings className="w-5 h-5" />
                        <span>Platform Configuration</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Site Name</label>
                        <Input defaultValue="HubLink" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Site Description</label>
                        <Textarea defaultValue="Connect travelers and creators globally" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Platform Fee (%)</label>
                        <Input defaultValue="10" type="number" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Maintenance Mode</label>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="maintenance" />
                          <label htmlFor="maintenance" className="text-sm">Enable maintenance mode</label>
                        </div>
                      </div>
                      <Button>Save Platform Settings</Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Security & Privacy</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Two-Factor Authentication</label>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="2fa" />
                          <label htmlFor="2fa" className="text-sm">Require 2FA for admin accounts</label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Session Timeout (minutes)</label>
                        <Input defaultValue="30" type="number" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Data Retention (days)</label>
                        <Input defaultValue="365" type="number" />
                      </div>
                      <Button>Save Security Settings</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Analytics Section */}
            {activeSection === "analytics" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Users className="w-8 h-8 text-blue-500" />
                        <div>
                          <div className="text-2xl font-bold">2,847</div>
                          <div className="text-sm text-muted-foreground">Total Users</div>
                          <div className="text-xs text-green-600">+12.5%</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="w-8 h-8 text-green-500" />
                        <div>
                          <div className="text-2xl font-bold">£34,521</div>
                          <div className="text-sm text-muted-foreground">Revenue</div>
                          <div className="text-xs text-green-600">+8.2%</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-purple-500" />
                        <div>
                          <div className="text-2xl font-bold">1,283</div>
                          <div className="text-sm text-muted-foreground">Posts Created</div>
                          <div className="text-xs text-green-600">+15.3%</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="w-8 h-8 text-orange-500" />
                        <div>
                          <div className="text-2xl font-bold">94.2%</div>
                          <div className="text-sm text-muted-foreground">Engagement</div>
                          <div className="text-xs text-green-600">+2.1%</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Content Performance */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Content Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Travel Posts</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 h-2 bg-muted rounded">
                              <div className="w-16 h-2 bg-blue-500 rounded"></div>
                            </div>
                            <span className="text-sm font-medium">80%</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Event Posts</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 h-2 bg-muted rounded">
                              <div className="w-12 h-2 bg-green-500 rounded"></div>
                            </div>
                            <span className="text-sm font-medium">60%</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Stays & Bookings</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 h-2 bg-muted rounded">
                              <div className="w-14 h-2 bg-purple-500 rounded"></div>
                            </div>
                            <span className="text-sm font-medium">70%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top Performing Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-sm">Amazing sunset in Bali</div>
                            <div className="text-xs text-muted-foreground">Travel Post</div>
                          </div>
                          <Badge variant="secondary">2.3k views</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-sm">London Food Festival</div>
                            <div className="text-xs text-muted-foreground">Event</div>
                          </div>
                          <Badge variant="secondary">1.8k views</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-sm">Cozy Cottage in Peak District</div>
                            <div className="text-xs text-muted-foreground">Stay</div>
                          </div>
                          <Badge variant="secondary">1.2k views</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Content Moderation Section */}
            {activeSection === "content" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Content Moderation</h2>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Moderation Rules
                  </Button>
                </div>

                {/* Content Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <div>
                          <div className="text-2xl font-bold">1,847</div>
                          <div className="text-sm text-muted-foreground">Total Posts</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Flag className="w-8 h-8 text-red-500" />
                        <div>
                          <div className="text-2xl font-bold">23</div>
                          <div className="text-sm text-muted-foreground">Flagged Content</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-8 h-8 text-green-500" />
                        <div>
                          <div className="text-2xl font-bold">156</div>
                          <div className="text-sm text-muted-foreground">Events</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-8 h-8 text-purple-500" />
                        <div>
                          <div className="text-2xl font-bold">89</div>
                          <div className="text-sm text-muted-foreground">Stays Listed</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Content Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Content</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <div>
                              <div className="font-medium">Beautiful beaches in Thailand</div>
                              <div className="text-sm text-muted-foreground">Amazing experience visiting...</div>
                            </div>
                          </TableCell>
                          <TableCell>John Doe</TableCell>
                          <TableCell>
                            <Badge variant="outline">Travel Post</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">Published</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button variant="outline" size="sm">
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
            
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
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Financial Management</h2>
                  <div className="flex space-x-2">
                    <Select defaultValue="30days">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7days">Last 7 days</SelectItem>
                        <SelectItem value="30days">Last 30 days</SelectItem>
                        <SelectItem value="90days">Last 90 days</SelectItem>
                        <SelectItem value="year">This year</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                  </div>
                </div>

                {/* Revenue Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">£45,231.89</div>
                      <p className="text-xs text-muted-foreground">
                        +20.1% from last month
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">£4,523.19</div>
                      <p className="text-xs text-muted-foreground">
                        10% of total revenue
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Processing Fees</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">£1,234.56</div>
                      <p className="text-xs text-muted-foreground">
                        2.7% processing cost
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">£39,474.14</div>
                      <p className="text-xs text-muted-foreground">
                        After all fees
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Revenue Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue by Service</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Home className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">Stays Bookings</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">£18,450</div>
                            <div className="text-xs text-muted-foreground">40.8%</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span className="text-sm">Trip Packages</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">£15,780</div>
                            <div className="text-xs text-muted-foreground">34.9%</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-purple-600" />
                            <span className="text-sm">Subscriptions</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">£8,950</div>
                            <div className="text-xs text-muted-foreground">19.8%</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Eye className="w-4 h-4 text-orange-600" />
                            <span className="text-sm">Ad Revenue</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">£2,051</div>
                            <div className="text-xs text-muted-foreground">4.5%</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Methods</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">Stripe Payments</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">£38,950</div>
                            <div className="text-xs text-muted-foreground">86.1%</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm">PayPal</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">£6,281</div>
                            <div className="text-xs text-muted-foreground">13.9%</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-green-600" />
                            <span className="text-sm">Bank Transfer</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">£0</div>
                            <div className="text-xs text-muted-foreground">0%</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Transaction Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="w-5 h-5" />
                      <span>Recent Transactions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { id: "TXN-001", type: "Booking", amount: "£450.00", status: "Completed", user: "Alice Johnson", date: "2025-09-09" },
                        { id: "TXN-002", type: "Subscription", amount: "£45.00", status: "Completed", user: "Bob Smith", date: "2025-09-09" },
                        { id: "TXN-003", type: "Trip Package", amount: "£1,200.00", status: "Pending", user: "Carol Brown", date: "2025-09-08" },
                        { id: "TXN-004", type: "Ad Payment", amount: "£125.00", status: "Completed", user: "David Wilson", date: "2025-09-08" },
                        { id: "TXN-005", type: "Booking", amount: "£750.00", status: "Refunded", user: "Emma Davis", date: "2025-09-07" }
                      ].map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="space-y-1">
                              <div className="text-sm font-medium">{transaction.type} - {transaction.id}</div>
                              <div className="text-xs text-muted-foreground">{transaction.user} • {transaction.date}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-sm font-medium">{transaction.amount}</div>
                              <Badge 
                                variant={
                                  transaction.status === 'Completed' ? 'default' :
                                  transaction.status === 'Pending' ? 'secondary' :
                                  'destructive'
                                }
                                className="text-xs"
                              >
                                {transaction.status}
                              </Badge>
                            </div>
                            <Button variant="outline" size="sm">
                              <Eye className="w-3 h-3 mr-2" />
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <Button variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Export All Transactions
                        </Button>
                        <div className="text-sm text-muted-foreground">
                          Showing 5 of 1,247 transactions
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payouts Management */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Send className="w-5 h-5" />
                        <span>Creator Payouts</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">£28,450</div>
                          <div className="text-xs text-muted-foreground">Total Paid Out</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">£4,320</div>
                          <div className="text-xs text-muted-foreground">Pending Payouts</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Next payout date:</span>
                          <span className="font-medium">September 15, 2025</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Payout frequency:</span>
                          <span className="font-medium">Weekly</span>
                        </div>
                      </div>
                      <Button className="w-full">
                        <Send className="w-4 h-4 mr-2" />
                        Process Pending Payouts
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Percent className="w-5 h-5" />
                        <span>Fee Configuration</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Platform Fee</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">10%</span>
                            <Button variant="outline" size="sm">Edit</Button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Stripe Processing</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">2.9% + 30p</span>
                            <Button variant="outline" size="sm">View</Button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">PayPal Processing</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">3.4% + 20p</span>
                            <Button variant="outline" size="sm">View</Button>
                          </div>
                        </div>
                      </div>
                      <div className="pt-3 border-t">
                        <Button variant="outline" className="w-full">
                          <Settings className="w-4 h-4 mr-2" />
                          Advanced Fee Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Email Management System */}
            {activeSection === "email-management" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Email Management System</h2>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Send className="w-4 h-4 mr-2" />
                    Send Campaign
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-12 text-center">
                    <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Email System Ready</h3>
                    <p className="text-muted-foreground">
                      Configure your email settings and start sending campaigns.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Live Monitoring Section */}
            {activeSection === "monitoring" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Live System Monitoring</h2>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-muted-foreground">Live</span>
                    </div>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* System Status Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">Server Status</div>
                          <div className="text-lg font-bold text-green-600">Online</div>
                        </div>
                        <Wifi className="w-8 h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">Database</div>
                          <div className="text-lg font-bold text-green-600">Connected</div>
                        </div>
                        <Database className="w-8 h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">Active Users</div>
                          <div className="text-lg font-bold">1,247</div>
                        </div>
                        <Users className="w-8 h-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">Response Time</div>
                          <div className="text-lg font-bold text-green-600">142ms</div>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Real-time Activity Feed */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Real-time Activity Feed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      <div className="flex items-start space-x-3 p-3 border rounded">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className="font-medium">New user registration:</span> sarah@example.com
                          </div>
                          <div className="text-xs text-muted-foreground">2 minutes ago</div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 border rounded">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className="font-medium">Payment processed:</span> £45.00 subscription
                          </div>
                          <div className="text-xs text-muted-foreground">5 minutes ago</div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 border rounded">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className="font-medium">Trial expired:</span> user_123 converted to paid
                          </div>
                          <div className="text-xs text-muted-foreground">8 minutes ago</div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 border rounded">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className="font-medium">Content reported:</span> Post ID 456 flagged for review
                          </div>
                          <div className="text-xs text-muted-foreground">12 minutes ago</div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 border rounded">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className="font-medium">Ad submission:</span> New campaign pending review
                          </div>
                          <div className="text-xs text-muted-foreground">15 minutes ago</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* System Performance Metrics */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Monitor className="w-5 h-5 mr-2" />
                        Server Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>CPU Usage</span>
                          <span>23%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div className="bg-green-600 h-2 rounded-full" style={{width: '23%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Memory Usage</span>
                          <span>67%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div className="bg-yellow-600 h-2 rounded-full" style={{width: '67%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Disk Usage</span>
                          <span>45%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div className="bg-blue-600 h-2 rounded-full" style={{width: '45%'}}></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        System Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 p-2 border border-yellow-200 rounded bg-yellow-50 dark:bg-yellow-900/20">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm">High memory usage detected</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 border border-green-200 rounded bg-green-50 dark:bg-green-900/20">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">All services operational</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 border border-blue-200 rounded bg-blue-50 dark:bg-blue-900/20">
                          <Bell className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">Scheduled maintenance in 2 hours</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Audit Logs Section */}
            {activeSection === "audit" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Audit Logs & Activity Tracking</h2>
                  <div className="flex space-x-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="user_actions">User Actions</SelectItem>
                        <SelectItem value="admin_actions">Admin Actions</SelectItem>
                        <SelectItem value="system_events">System Events</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export Logs
                    </Button>
                  </div>
                </div>

                {/* Audit Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">2,456</div>
                        <div className="text-sm text-muted-foreground">Total Actions Today</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">12</div>
                        <div className="text-sm text-muted-foreground">Failed Login Attempts</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">89</div>
                        <div className="text-sm text-muted-foreground">Admin Actions</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">234</div>
                        <div className="text-sm text-muted-foreground">Security Events</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Audit Logs Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Audit Logs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Timestamp</th>
                            <th className="text-left p-2">Action</th>
                            <th className="text-left p-2">User</th>
                            <th className="text-left p-2">Target</th>
                            <th className="text-left p-2">IP Address</th>
                            <th className="text-left p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-2 text-sm">2024-12-07 15:23:45</td>
                            <td className="p-2">
                              <Badge variant="outline">User Login</Badge>
                            </td>
                            <td className="p-2 text-sm">sarah@example.com</td>
                            <td className="p-2 text-sm">Authentication</td>
                            <td className="p-2 text-sm font-mono">192.168.1.45</td>
                            <td className="p-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-800">Success</Badge>
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 text-sm">2024-12-07 15:20:12</td>
                            <td className="p-2">
                              <Badge variant="outline">Apply Trial Coupon</Badge>
                            </td>
                            <td className="p-2 text-sm">john@example.com</td>
                            <td className="p-2 text-sm">TRIAL30</td>
                            <td className="p-2 text-sm font-mono">192.168.1.67</td>
                            <td className="p-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-800">Success</Badge>
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 text-sm">2024-12-07 15:18:33</td>
                            <td className="p-2">
                              <Badge variant="outline">Admin Action</Badge>
                            </td>
                            <td className="p-2 text-sm">admin@hublink.com</td>
                            <td className="p-2 text-sm">User: user_456</td>
                            <td className="p-2 text-sm font-mono">192.168.1.10</td>
                            <td className="p-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-800">Success</Badge>
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 text-sm">2024-12-07 15:15:21</td>
                            <td className="p-2">
                              <Badge variant="outline">Failed Login</Badge>
                            </td>
                            <td className="p-2 text-sm">unknown@attacker.com</td>
                            <td className="p-2 text-sm">Authentication</td>
                            <td className="p-2 text-sm font-mono">45.123.87.234</td>
                            <td className="p-2">
                              <Badge variant="destructive">Failed</Badge>
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 text-sm">2024-12-07 15:12:45</td>
                            <td className="p-2">
                              <Badge variant="outline">Payment Processed</Badge>
                            </td>
                            <td className="p-2 text-sm">emma@example.com</td>
                            <td className="p-2 text-sm">£45.00 Subscription</td>
                            <td className="p-2 text-sm font-mono">192.168.1.89</td>
                            <td className="p-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-800">Success</Badge>
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 text-sm">2024-12-07 15:10:12</td>
                            <td className="p-2">
                              <Badge variant="outline">Create Trial Code</Badge>
                            </td>
                            <td className="p-2 text-sm">admin@hublink.com</td>
                            <td className="p-2 text-sm">FREETRIAL7</td>
                            <td className="p-2 text-sm font-mono">192.168.1.10</td>
                            <td className="p-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-800">Success</Badge>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Events */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      Security Events & Threats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 p-3 border border-red-200 rounded bg-red-50 dark:bg-red-900/20">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-1" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">Suspicious Login Activity</div>
                          <div className="text-xs text-muted-foreground">
                            Multiple failed login attempts from IP: 45.123.87.234
                          </div>
                          <div className="text-xs text-muted-foreground">15 minutes ago</div>
                        </div>
                        <Button size="sm" variant="outline">Block IP</Button>
                      </div>
                      <div className="flex items-start space-x-3 p-3 border border-yellow-200 rounded bg-yellow-50 dark:bg-yellow-900/20">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-1" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">Unusual Payment Pattern</div>
                          <div className="text-xs text-muted-foreground">
                            Large number of trial-to-paid conversions from same region
                          </div>
                          <div className="text-xs text-muted-foreground">1 hour ago</div>
                        </div>
                        <Button size="sm" variant="outline">Investigate</Button>
                      </div>
                      <div className="flex items-start space-x-3 p-3 border border-green-200 rounded bg-green-50 dark:bg-green-900/20">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">Security Scan Complete</div>
                          <div className="text-xs text-muted-foreground">
                            No vulnerabilities detected in latest security scan
                          </div>
                          <div className="text-xs text-muted-foreground">2 hours ago</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Placeholder sections for future development */}
            {["content", "settings"].includes(activeSection) && (
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
