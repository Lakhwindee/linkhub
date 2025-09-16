import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { FollowButton } from "@/components/FollowButton";
import { BoostPostModal } from "@/components/BoostPostModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MapPin, MoreHorizontal, Flag, Heart, MessageCircle, Share, Eye, EyeOff, Users, ThumbsDown, Send, Instagram, Twitter, Facebook, Copy, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import type { Post } from "@shared/schema";

interface PostCardProps {
  post: Post;
  compact?: boolean;
}

export function PostCard({ post, compact = false }: PostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 50) + 5);
  const [dislikeCount, setDislikeCount] = useState(Math.floor(Math.random() * 5));
  const [commentCount, setCommentCount] = useState(Math.floor(Math.random() * 20) + 2);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [comments, setComments] = useState<{id: string, author: string, text: string, time: Date}[]>([
    {
      id: '1',
      author: 'travel_lover',
      text: 'Amazing photo! 😍',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '2', 
      author: 'wanderlust_soul',
      text: 'I need to visit this place! Thanks for sharing ✈️',
      time: new Date(Date.now() - 5 * 60 * 60 * 1000)
    }
  ]);

  // Check if current user owns this post
  const isOwnPost = user?.id === post.userId;
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleLike = () => {
    if (isDisliked) {
      setIsDisliked(false);
      setDislikeCount(prev => prev - 1);
    }
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleDislike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikeCount(prev => prev - 1);
    }
    setIsDisliked(!isDisliked);
    setDislikeCount(prev => isDisliked ? prev - 1 : prev + 1);
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now().toString(),
        author: 'You',
        text: newComment.trim(),
        time: new Date()
      };
      setComments(prev => [comment, ...prev]);
      setCommentCount(prev => prev + 1);
      setNewComment('');
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out this amazing post: ${post.body?.slice(0, 100)}...`;
    
    switch (platform) {
      case 'instagram':
        // Instagram doesn't support direct sharing via URL, so copy to clipboard
        navigator.clipboard.writeText(`${text} ${url}`);
        alert('Post content copied to clipboard! Share it on Instagram.');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(`${text} ${url}`);
        alert('Link copied to clipboard!');
        break;
    }
    setShowShareDialog(false);
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Eye className="w-3 h-3" />;
      case 'followers':
        return <Users className="w-3 h-3" />;
      case 'private':
        return <EyeOff className="w-3 h-3" />;
      default:
        return <Eye className="w-3 h-3" />;
    }
  };

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'Public';
      case 'followers':
        return 'Followers';
      case 'private':
        return 'Private';
      default:
        return 'Public';
    }
  };

  if (compact) {
    return (
      <div className="border-l-2 border-accent pl-4 space-y-2" data-testid={`post-compact-${post.id}`}>
        <div className="flex items-center space-x-2">
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-xs">
              {post.userId?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <Link href={`/profile/${post.userId}`}>
            <span className="text-sm font-medium hover:text-primary cursor-pointer transition-colors" data-testid={`text-post-author-${post.id}`}>
              @{post.userId}
            </span>
          </Link>
          <span className="text-xs text-muted-foreground" data-testid={`text-post-time-${post.id}`}>
            {formatDistanceToNow(new Date(post.createdAt!))} ago
          </span>
        </div>
        <p className="text-sm text-card-foreground line-clamp-2" data-testid={`text-post-body-${post.id}`}>
          {post.body}
        </p>
        {post.city && post.country && (
          <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 mr-1" />
            <span data-testid={`text-post-location-${post.id}`}>{post.city}, {post.country}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
    <Card data-testid={`card-post-${post.id}`}>
      <CardContent className="p-6">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback data-testid={`text-post-author-initials-${post.id}`}>
                {post.userId?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <Link href={`/profile/${post.userId}`}>
                  <span className="font-semibold text-card-foreground hover:text-primary cursor-pointer transition-colors" data-testid={`text-post-author-name-${post.id}`}>
                    @{post.userId}
                  </span>
                </Link>
                <Badge variant="outline" className="text-xs flex items-center space-x-1">
                  {getVisibilityIcon(post.visibility || 'public')}
                  <span>{getVisibilityLabel(post.visibility || 'public')}</span>
                </Badge>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span data-testid={`text-post-timestamp-${post.id}`}>
                  {formatDistanceToNow(new Date(post.createdAt!))} ago
                </span>
                {post.city && post.country && (
                  <>
                    <span>•</span>
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span data-testid={`text-post-full-location-${post.id}`}>
                        {post.city}, {post.country}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <FollowButton 
              userId={post.userId!} 
              username={(post as any).username || post.userId!} 
              size="sm" 
              variant="outline"
              showIcon={false}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" data-testid={`button-post-menu-${post.id}`}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Boost option - only for post owner */}
                {isOwnPost && (
                  <DropdownMenuItem 
                    onClick={() => setShowBoostModal(true)}
                    data-testid={`button-boost-menu-${post.id}`}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Boost Post
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem data-testid={`button-report-post-${post.id}`}>
                  <Flag className="w-4 h-4 mr-2" />
                  Report Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Post Content */}
        {post.body && (
          <div className="mb-4">
            <p className="text-card-foreground whitespace-pre-wrap" data-testid={`text-post-content-${post.id}`}>
              {post.body}
            </p>
          </div>
        )}

        {/* Media */}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="mb-4">
            {post.mediaType === 'video' ? (
              <video 
                controls 
                className="w-full rounded-lg max-h-96"
                data-testid={`video-post-${post.id}`}
              >
                <source src={post.mediaUrls[0]} />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className={`grid gap-2 rounded-lg overflow-hidden ${
                post.mediaUrls.length === 1 ? 'grid-cols-1' :
                post.mediaUrls.length === 2 ? 'grid-cols-2' :
                post.mediaUrls.length === 3 ? 'grid-cols-2' : 'grid-cols-2'
              }`}>
                {post.mediaUrls.slice(0, 4).map((url, index) => (
                  <div key={index} className={post.mediaUrls!.length === 3 && index === 0 ? 'row-span-2' : ''}>
                    <img 
                      src={url} 
                      alt={`Post media ${index + 1}`}
                      className="w-full h-48 object-cover"
                      data-testid={`img-post-media-${post.id}-${index}`}
                    />
                  </div>
                ))}
                {post.mediaUrls.length > 4 && (
                  <div className="relative">
                    <img 
                      src={post.mediaUrls[3]} 
                      alt="More media"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold">
                        +{post.mediaUrls.length - 3} more
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Post Actions - Instagram Style */}
        <div className="pt-3 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLike}
                className={`flex items-center space-x-1 p-1 hover:bg-transparent ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                data-testid={`button-like-post-${post.id}`}
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDislike}
                className={`flex items-center space-x-1 p-1 hover:bg-transparent ${isDisliked ? 'text-blue-500' : 'text-muted-foreground hover:text-blue-500'}`}
                data-testid={`button-dislike-post-${post.id}`}
              >
                <ThumbsDown className={`w-5 h-5 ${isDisliked ? 'fill-current' : ''}`} />
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowComments(!showComments)}
                className="flex items-center space-x-1 p-1 hover:bg-transparent text-muted-foreground hover:text-blue-500" 
                data-testid={`button-comment-post-${post.id}`}
              >
                <MessageCircle className="w-6 h-6" />
              </Button>

              <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center space-x-1 p-1 hover:bg-transparent text-muted-foreground hover:text-green-500" 
                    data-testid={`button-share-post-${post.id}`}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share this post</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => handleShare('instagram')}
                      className="flex items-center space-x-2"
                    >
                      <Instagram className="w-4 h-4" />
                      <span>Instagram</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleShare('facebook')}
                      className="flex items-center space-x-2"
                    >
                      <Facebook className="w-4 h-4" />
                      <span>Facebook</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleShare('twitter')}
                      className="flex items-center space-x-2"
                    >
                      <Twitter className="w-4 h-4" />
                      <span>Twitter</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleShare('copy')}
                      className="flex items-center space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy Link</span>
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Boost Post Button - Only for post owner */}
              {isOwnPost && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowBoostModal(true)}
                  className="flex items-center space-x-1 p-1 hover:bg-transparent text-muted-foreground hover:text-orange-500" 
                  data-testid={`button-boost-post-${post.id}`}
                >
                  <TrendingUp className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Like and interaction counts */}
          <div className="text-sm space-y-1">
            <div className="flex items-center space-x-4">
              <span className="font-semibold">
                {likeCount} likes
              </span>
              {dislikeCount > 0 && (
                <span className="text-muted-foreground">
                  {dislikeCount} dislikes
                </span>
              )}
              <button 
                onClick={() => setShowComments(!showComments)}
                className="text-muted-foreground hover:text-foreground"
              >
                View all {commentCount} comments
              </button>
            </div>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="space-y-3">
              <div className="max-h-60 overflow-y-auto space-y-2">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {comment.author.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-semibold mr-2">{comment.author}</span>
                        {comment.text}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(comment.time)} ago
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add Comment */}
              <div className="flex items-center space-x-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">
                    U
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex items-center space-x-2">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    className="border-none shadow-none focus-visible:ring-0"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="p-1"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    {/* Boost Post Modal */}
    {isOwnPost && (
      <BoostPostModal 
        post={post}
        open={showBoostModal}
        onOpenChange={setShowBoostModal}
      />
    )}
    </>
  );
}
