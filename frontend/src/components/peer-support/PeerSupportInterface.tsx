import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Users, 
  Heart, 
  MessageCircle, 
  TrendingUp,
  Plus,
  Hash,
  Bookmark,
  Share,
  Image as ImageIcon,
  X,
  Upload
} from 'lucide-react';
import { api } from '../../lib/api';

interface Post {
  id: string;
  author: string;
  content: string;
  likes: number;
  comments_count?: number;
  hashtags?: string[];
  created_at: string;
  anonymous?: boolean;
  image_url?: string;
  post_type?: 'text' | 'image';
}

interface TrendingHashtag {
  hashtag: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

export function PeerSupportInterface() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [peerPosts, setPeerPosts] = useState<Post[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [newPost, setNewPost] = useState('');
  const [newPeerPost, setNewPeerPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPosts();
    loadPeerPosts();
    loadTrendingHashtags();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await api.getPosts();
      setPosts(Array.isArray(response.posts) ? response.posts : []);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    }
  };

  const loadPeerPosts = async () => {
    try {
      const posts = await api.getPeerSupportPosts();
      setPeerPosts(Array.isArray(posts) ? posts : []);
    } catch (error) {
      console.error('Error loading peer posts:', error);
      setPeerPosts([]);
    }
  };

  const loadTrendingHashtags = async () => {
    try {
      const hashtags = await api.getTrendingHashtags();
      setTrendingHashtags(Array.isArray(hashtags) ? hashtags : []);
    } catch (error) {
      console.error('Error loading trending hashtags:', error);
      setTrendingHashtags([]);
    }
  };

  const createPost = async () => {
    if (!newPost.trim()) return;

    setIsPosting(true);
    try {
      let imageUrl = null;
      
      // Upload image if selected
      if (selectedImage) {
        setIsUploading(true);
        const uploadResult = await api.uploadPostImage(selectedImage);
        imageUrl = uploadResult.url;
      }

      // Create post with or without image
      const postData = {
        content: newPost,
        hashtags: selectedHashtags,
        post_type: imageUrl ? 'image' : 'text',
        image_url: imageUrl,
        visibility: 'public'
      };

      await api.createPostWithImage(postData);
      setNewPost('');
      setSelectedHashtags([]);
      clearImage();
      await loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsPosting(false);
      setIsUploading(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('Image size should be less than 10MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const createPeerPost = async () => {
    if (!newPeerPost.trim()) return;

    setIsPosting(true);
    try {
      await api.createPeerSupportPost(newPeerPost, isAnonymous);
      setNewPeerPost('');
      await loadPeerPosts();
    } catch (error) {
      console.error('Error creating peer post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const likePost = async (postId: string) => {
    try {
      await api.likePost(postId);
      await loadPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const bookmarkPost = async (postId: string) => {
    try {
      await api.bookmarkPost(postId);
    } catch (error) {
      console.error('Error bookmarking post:', error);
    }
  };

  const toggleHashtag = (hashtag: string) => {
    setSelectedHashtags(prev => 
      prev.includes(hashtag) 
        ? prev.filter(h => h !== hashtag)
        : [...prev, hashtag]
    );
  };

  const extractHashtags = (text: string) => {
    return text.match(/#\w+/g) || [];
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1>Peer Support Community</h1>
        <p className="text-muted-foreground">
          Connect with fellow students, share experiences, and support each other's mental health journey.
        </p>
      </div>

      <Tabs defaultValue="feed" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feed">Community Feed</TabsTrigger>
          <TabsTrigger value="support">Support Group</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Create Post */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Share Your Thoughts
                  </CardTitle>
                  <CardDescription>
                    Share motivational content, study tips, or wellness insights
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="What's on your mind? Use #hashtags to categorize your post..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="min-h-[100px]"
                    disabled={isPosting || isUploading}
                  />
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="max-w-full h-auto max-h-64 rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={clearImage}
                        className="absolute top-2 right-2"
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Hidden file input */}
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Suggested Tags
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['motivation', 'study', 'selfcare', 'mentalhealth', 'wellness'].map((tag) => (
                          <Badge
                            key={tag}
                            variant={selectedHashtags.includes(tag) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => toggleHashtag(tag)}
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {selectedHashtags.length > 0 && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Selected Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {selectedHashtags.map((tag) => (
                            <Badge key={tag} variant="default">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isPosting || isUploading}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        {selectedImage ? 'Change Image' : 'Add Image'}
                      </Button>
                      
                      {isUploading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Upload className="h-4 w-4 animate-spin" />
                          Uploading...
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={createPost} 
                      disabled={isPosting || isUploading || (!newPost.trim() && !selectedImage)}
                      className="min-w-[120px]"
                    >
                      {isPosting ? 'Posting...' : 'Share Post'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Posts Feed */}
              <div className="space-y-4">
                {Array.isArray(posts) && posts.length > 0 ? posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{post.author}</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatTimeAgo(post.created_at)}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm">{post.content}</p>

                        {/* Display post image if exists */}
                        {post.image_url && (
                          <div className="mt-3">
                            <img 
                              src={post.image_url} 
                              alt="Post image" 
                              className="max-w-full h-auto max-h-96 rounded-lg border object-cover"
                            />
                          </div>
                        )}

                        {post.hashtags && Array.isArray(post.hashtags) && post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {post.hashtags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => likePost(post.id)}
                              className="flex items-center gap-1"
                            >
                              <Heart className="h-4 w-4" />
                              {post.likes}
                            </Button>
                            <Button variant="ghost" size="sm" className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              {post.comments_count || 0}
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => bookmarkPost(post.id)}
                            >
                              <Bookmark className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Share className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-medium mb-2">No posts yet</h3>
                      <p className="text-sm text-muted-foreground">Be the first to share something with the community!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Trending Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.isArray(trendingHashtags) && trendingHashtags.slice(0, 5).map((item) => (
                      <div key={item.hashtag} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{item.hashtag}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{item.count}</span>
                          <span className="text-xs">{getTrendIcon(item.trend)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Community Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Be respectful and supportive</p>
                    <p>• Share positive and helpful content</p>
                    <p>• Protect privacy and confidentiality</p>
                    <p>• Report inappropriate content</p>
                    <p>• Seek professional help for crises</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Anonymous Support Post */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Share Anonymously
                  </CardTitle>
                  <CardDescription>
                    Share your struggles and experiences in a safe, anonymous space
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Share what's on your mind. You can be completely anonymous here..."
                    value={newPeerPost}
                    onChange={(e) => setNewPeerPost(e.target.value)}
                    className="min-h-[120px]"
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="anonymous"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                      />
                      <label htmlFor="anonymous" className="text-sm">
                        Post anonymously
                      </label>
                    </div>
                    <Button 
                      onClick={createPeerPost} 
                      disabled={isPosting || !newPeerPost.trim()}
                    >
                      {isPosting ? 'Posting...' : 'Share Anonymously'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Anonymous Posts */}
              <div className="space-y-4">
                {Array.isArray(peerPosts) && peerPosts.length > 0 ? peerPosts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">
                              {post.anonymous ? 'Anonymous Student' : post.author}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {formatTimeAgo(post.created_at)}
                            </p>
                          </div>
                          {post.anonymous && (
                            <Badge variant="secondary">Anonymous</Badge>
                          )}
                        </div>

                        <p className="text-sm">{post.content}</p>

                        <div className="flex items-center gap-4 pt-3 border-t">
                          <Button variant="ghost" size="sm" className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {post.likes}
                          </Button>
                          <Button variant="ghost" size="sm" className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            Support
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-medium mb-2">No anonymous posts yet</h3>
                      <p className="text-sm text-muted-foreground">Share something anonymously to get support from peers.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Safe Space</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      This is a judgment-free zone where you can share your experiences 
                      and get support from peers who understand.
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span>All posts are moderated for safety</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Crisis Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium">Crisis Hotline</p>
                      <p className="text-muted-foreground">988 - Available 24/7</p>
                    </div>
                    <div>
                      <p className="font-medium">Campus Counseling</p>
                      <p className="text-muted-foreground">Book emergency appointment</p>
                    </div>
                    <Button size="sm" variant="outline" className="w-full">
                      Get Immediate Help
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(trendingHashtags) && trendingHashtags.map((item) => (
              <Card key={item.hashtag}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">#{item.hashtag}</h3>
                      <span className="text-2xl">{getTrendIcon(item.trend)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {item.count} posts
                      </span>
                      <Badge 
                        variant={
                          item.trend === 'up' ? 'default' : 
                          item.trend === 'down' ? 'destructive' : 'secondary'
                        }
                      >
                        {item.trend}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Explore Topic
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}