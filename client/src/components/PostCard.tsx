import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MapPin, MoreHorizontal, Flag, Heart, MessageCircle, Share, Eye, EyeOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import type { Post } from "@shared/schema";

interface PostCardProps {
  post: Post;
  compact?: boolean;
}

export function PostCard({ post, compact = false }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
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
          <span className="text-sm font-medium" data-testid={`text-post-author-${post.id}`}>
            @{post.userId}
          </span>
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
                <span className="font-semibold text-card-foreground" data-testid={`text-post-author-name-${post.id}`}>
                  @{post.userId}
                </span>
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" data-testid={`button-post-menu-${post.id}`}>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem data-testid={`button-report-post-${post.id}`}>
                <Flag className="w-4 h-4 mr-2" />
                Report Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center space-x-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLike}
              className={`flex items-center space-x-1 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
              data-testid={`button-like-post-${post.id}`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-muted-foreground" data-testid={`button-comment-post-${post.id}`}>
              <MessageCircle className="w-4 h-4" />
              <span>0</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-muted-foreground" data-testid={`button-share-post-${post.id}`}>
              <Share className="w-4 h-4" />
              <span>Share</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
