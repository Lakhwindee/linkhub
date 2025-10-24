import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, ExternalLink, User, Calendar, Youtube } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PublisherSubmission {
  id: string;
  clipUrl: string | null;
  contentLink: string | null;
  originalVideoUrl: string | null;
  status: string;
  reviewNotes: string | null;
  createdAt: string;
  reviewedAt: string;
  campaignId: string;
  campaignTitle: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorEmail: string;
  creatorChannelName: string | null;
  creatorSubscribers: number | null;
}

export default function PublisherDashboard() {
  const { data: submissions = [], isLoading } = useQuery<PublisherSubmission[]>({
    queryKey: ['/api/publisher/submissions'],
    queryFn: async () => {
      const response = await fetch('/api/publisher/submissions', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }
      return response.json();
    }
  });

  const formatSubscribers = (count: number | null) => {
    if (!count) return 'N/A';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="max-w-7xl mx-auto pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading submissions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto pt-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Creator Submissions</h1>
          <p className="text-muted-foreground text-lg">
            View all approved video clips and content links from creators
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Submissions</CardDescription>
              <CardTitle className="text-3xl">{submissions.length}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Campaigns</CardDescription>
              <CardTitle className="text-3xl">
                {new Set(submissions.map(s => s.campaignId)).size}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Creators</CardDescription>
              <CardTitle className="text-3xl">
                {new Set(submissions.map(s => s.creatorId)).size}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Submissions List */}
        {submissions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No Submissions Yet</h2>
              <p className="text-muted-foreground">
                Approved creator submissions will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {submissions.map((submission) => (
              <Card key={submission.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {submission.campaignTitle}
                      </CardTitle>
                      <CardDescription className="text-base">
                        Campaign ID: {submission.campaignId}
                      </CardDescription>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      Approved
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  {/* Creator Info */}
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-4 mb-3">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {submission.creatorName || submission.creatorUsername}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          @{submission.creatorUsername}
                        </p>
                      </div>
                    </div>
                    
                    {submission.creatorChannelName && (
                      <div className="flex items-center gap-2 text-sm">
                        <Youtube className="w-4 h-4 text-red-600" />
                        <span className="font-medium">{submission.creatorChannelName}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          {formatSubscribers(submission.creatorSubscribers)} subscribers
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Submission Content */}
                  <div className="space-y-4">
                    {/* Video Clip */}
                    {submission.clipUrl && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Video className="w-4 h-4" />
                          <span>Video Clip</span>
                        </div>
                        <div className="bg-black rounded-lg overflow-hidden aspect-video">
                          <iframe
                            src={submission.clipUrl.replace('watch?v=', 'embed/')}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(submission.clipUrl!, '_blank')}
                          className="w-full"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Video in YouTube
                        </Button>
                      </div>
                    )}

                    {/* Content Link */}
                    {submission.contentLink && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <ExternalLink className="w-4 h-4" />
                          <span>Content Link</span>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <a
                            href={submission.contentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                          >
                            {submission.contentLink}
                          </a>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(submission.contentLink!, '_blank')}
                          className="w-full"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Visit Content Link
                        </Button>
                      </div>
                    )}

                    {/* Original Video */}
                    {submission.originalVideoUrl && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Video className="w-4 h-4" />
                          <span>Original Video</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(submission.originalVideoUrl!, '_blank')}
                          className="w-full"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Original Video
                        </Button>
                      </div>
                    )}

                    {/* Review Notes */}
                    {submission.reviewNotes && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Admin Review Notes</div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                          {submission.reviewNotes}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Timestamps */}
                  <div className="mt-6 pt-4 border-t flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Submitted {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}</span>
                    </div>
                    <span>•</span>
                    <div>
                      Approved {formatDistanceToNow(new Date(submission.reviewedAt), { addSuffix: true })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
