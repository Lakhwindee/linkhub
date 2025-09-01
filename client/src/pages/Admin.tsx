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
import { Settings, Users, FileText, Flag, DollarSign, BarChart3, CheckCircle, XCircle, Eye, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import type { AdSubmission, Report } from "@shared/schema";

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useState<AdSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2" data-testid="heading-admin">
              <Settings className="w-8 h-8 text-accent" />
              <span>Admin Panel</span>
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-admin-subtitle">
              Manage users, content, and platform operations
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="destructive" data-testid="badge-admin-role">
              {user.role}
            </Badge>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card data-testid="card-stat-users">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="text-total-users">
                    {dashboardData?.totalUsers || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-posts">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="text-total-posts">
                    {dashboardData?.totalPosts || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Posts</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-reports">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                  <Flag className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="text-pending-reports">
                    {pendingReports.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending Reports</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-submissions">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="text-pending-submissions">
                    {pendingSubmissions.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending Reviews</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="submissions" data-testid="tab-submissions">
              Ad Reviews
            </TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">
              Reports
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              Users
            </TabsTrigger>
          </TabsList>

          {/* Ad Submissions Review */}
          <TabsContent value="submissions" className="space-y-6">
            <Card data-testid="card-submissions">
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
                      <Card key={submission.id} className="border-yellow-200 dark:border-yellow-800" data-testid={`card-submission-${submission.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" data-testid={`badge-submission-status-${submission.id}`}>
                                  {submission.status}
                                </Badge>
                                <span className="text-sm text-muted-foreground" data-testid={`text-submission-date-${submission.id}`}>
                                  Submitted {format(new Date(submission.createdAt!), 'MMM d, yyyy')}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground" data-testid={`text-submission-id-${submission.id}`}>
                                Submission ID: {submission.id}
                              </p>
                              {submission.rawFileUrl && (
                                <Button variant="outline" size="sm" asChild data-testid={`button-view-submission-${submission.id}`}>
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
                                    data-testid={`button-approve-submission-${submission.id}`}
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
                                      data-testid="textarea-approval-notes"
                                    />
                                    <div className="flex space-x-2">
                                      <Button 
                                        variant="outline" 
                                        onClick={() => setSelectedSubmission(null)}
                                        data-testid="button-cancel-approval"
                                      >
                                        Cancel
                                      </Button>
                                      <Button 
                                        onClick={() => handleReviewSubmission('approved')}
                                        disabled={reviewSubmissionMutation.isPending}
                                        className="bg-green-600 hover:bg-green-700"
                                        data-testid="button-confirm-approval"
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
                                    data-testid={`button-reject-submission-${submission.id}`}
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
                                      data-testid="textarea-rejection-notes"
                                    />
                                    <div className="flex space-x-2">
                                      <Button 
                                        variant="outline" 
                                        onClick={() => setSelectedSubmission(null)}
                                        data-testid="button-cancel-rejection"
                                      >
                                        Cancel
                                      </Button>
                                      <Button 
                                        onClick={() => handleReviewSubmission('rejected')}
                                        disabled={reviewSubmissionMutation.isPending || !reviewNotes.trim()}
                                        variant="destructive"
                                        data-testid="button-confirm-rejection"
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
                  <Card data-testid="card-no-submissions">
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
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports" className="space-y-6">
            <Card data-testid="card-reports">
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
                      <Card key={report.id} className="border-yellow-200 dark:border-yellow-800" data-testid={`card-report-${report.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" data-testid={`badge-report-reason-${report.id}`}>
                                  {report.reason}
                                </Badge>
                                <Badge variant="secondary" data-testid={`badge-report-target-${report.id}`}>
                                  {report.targetType}
                                </Badge>
                              </div>
                              <p className="text-sm text-card-foreground" data-testid={`text-report-description-${report.id}`}>
                                {report.description || "No description provided"}
                              </p>
                              <p className="text-xs text-muted-foreground" data-testid={`text-report-date-${report.id}`}>
                                Reported {format(new Date(report.createdAt!), 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" data-testid={`button-investigate-report-${report.id}`}>
                                <Eye className="w-3 h-3 mr-2" />
                                Investigate
                              </Button>
                              <Button size="sm" variant="destructive" data-testid={`button-take-action-report-${report.id}`}>
                                Take Action
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card data-testid="card-no-reports">
                    <CardContent className="p-12 text-center">
                      <Flag className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No pending reports</h3>
                      <p className="text-muted-foreground">
                        All reports have been reviewed and resolved.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-6">
            <Card data-testid="card-users">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>User Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <Input
                      placeholder="Search users by username or email..."
                      className="flex-1"
                      data-testid="input-search-users"
                    />
                    <Select>
                      <SelectTrigger className="w-48" data-testid="select-user-role-filter">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Roles</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="creator">Creator</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Card data-testid="card-user-search-results">
                    <CardContent className="p-8 text-center">
                      <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">User Management</h3>
                      <p className="text-muted-foreground">
                        Search for users to view their profiles and manage their accounts.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
