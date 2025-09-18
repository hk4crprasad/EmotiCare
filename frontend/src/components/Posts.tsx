import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  PlusIcon, 
  PhotoIcon, 
  VideoCameraIcon, 
  LinkIcon,
  HashtagIcon,
  HeartIcon,
  BookmarkIcon,
  ShareIcon,
  ChatBubbleLeftIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
  UserCircleIcon,
  CalendarIcon,
  MapPinIcon,
  EyeIcon,
  GlobeAltIcon,
  UsersIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

interface Post {
  _id: string;
  title?: string;
  content: string;
  post_type: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string;
  image_url?: string;
  image_alt_text?: string;
  video_url?: string;
  link_url?: string;
  link_title?: string;
  link_description?: string;
  hashtags: string[];
  mentions: string[];
  visibility: string;
  allow_comments: boolean;
  allow_shares: boolean;
  is_anonymous: boolean;
  location?: string;
  likes_count: number;
  bookmarks_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  user_liked: boolean;
  user_bookmarked: boolean;
  created_at: string;
  updated_at: string;
}

interface CreatePostData {
  title?: string;
  content: string;
  post_type: string;
  image_url?: string;
  image_alt_text?: string;
  video_url?: string;
  link_url?: string;
  link_title?: string;
  link_description?: string;
  hashtags: string[];
  mentions: string[];
  visibility: string;
  allow_comments: boolean;
  allow_shares: boolean;
  is_anonymous: boolean;
  location?: string;
}

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [feedType, setFeedType] = useState<'public' | 'following' | 'trending'>('public');
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingHashtags, setTrendingHashtags] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [createPostData, setCreatePostData] = useState<CreatePostData>({
    content: '',
    post_type: 'text',
    hashtags: [],
    mentions: [],
    visibility: 'public',
    allow_comments: true,
    allow_shares: true,
    is_anonymous: false
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPosts();
    loadTrendingHashtags();
  }, [feedType]);

  const loadPosts = async (append = false) => {
    try {
      setLoading(!append);
      const currentOffset = append ? offset : 0;
      
      let response;
      if (searchQuery) {
        response = await apiService.searchPosts({
          q: searchQuery,
          limit: 20,
          offset: currentOffset
        });
      } else {
        response = await apiService.getPostFeed({
          feed_type: feedType,
          limit: 20,
          offset: currentOffset
        });
      }

      const newPosts = response.posts || [];
      
      if (append) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      
      setHasMore(newPosts.length === 20);
      setOffset(currentOffset + newPosts.length);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingHashtags = async () => {
    try {
      const response = await apiService.getTrendingHashtags(10);
      setTrendingHashtags(response.hashtags || []);
    } catch (error) {
      console.error('Error loading trending hashtags:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!createPostData.content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    try {
      setUploading(true);
      let finalPostData = { ...createPostData };

      // Upload image if selected
      if (imageFile) {
        const uploadResponse = await apiService.uploadPostImage(imageFile);
        finalPostData.image_url = uploadResponse.url;
      }

      // Extract hashtags from content
      const hashtagMatches = finalPostData.content.match(/#[\w]+/g);
      if (hashtagMatches) {
        finalPostData.hashtags = [...new Set([...finalPostData.hashtags, ...hashtagMatches.map(tag => tag.slice(1))])];
      }

      // Extract mentions from content
      const mentionMatches = finalPostData.content.match(/@[\w]+/g);
      if (mentionMatches) {
        finalPostData.mentions = [...new Set([...finalPostData.mentions, ...mentionMatches.map(mention => mention.slice(1))])];
      }

      await apiService.createPost(finalPostData);
      
      toast.success('Post created successfully!');
      setShowCreatePost(false);
      resetCreatePostForm();
      loadPosts(); // Reload posts
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  const resetCreatePostForm = () => {
    setCreatePostData({
      content: '',
      post_type: 'text',
      hashtags: [],
      mentions: [],
      visibility: 'public',
      allow_comments: true,
      allow_shares: true,
      is_anonymous: false
    });
    setImageFile(null);
  };

  const handleLikePost = async (postId: string) => {
    try {
      await apiService.likePost(postId);
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              user_liked: !post.user_liked,
              likes_count: post.user_liked ? post.likes_count - 1 : post.likes_count + 1
            }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  const handleBookmarkPost = async (postId: string) => {
    try {
      await apiService.bookmarkPost(postId);
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              user_bookmarked: !post.user_bookmarked,
              bookmarks_count: post.user_bookmarked ? post.bookmarks_count - 1 : post.bookmarks_count + 1
            }
          : post
      ));
    } catch (error) {
      console.error('Error bookmarking post:', error);
      toast.error('Failed to bookmark post');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    loadPosts();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Image size must be less than 10MB');
        return;
      }
      setImageFile(file);
      setCreatePostData(prev => ({ ...prev, post_type: 'image' }));
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <GlobeAltIcon className="h-4 w-4" />;
      case 'friends': return <UsersIcon className="h-4 w-4" />;
      case 'private': return <LockClosedIcon className="h-4 w-4" />;
      default: return <GlobeAltIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Community Posts</h1>
        <button
          onClick={() => setShowCreatePost(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Create Post
        </button>
      </div>

      {/* Feed Filter and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          {(['public', 'following', 'trending'] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                setFeedType(type);
                setOffset(0);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                feedType === type
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts, hashtags, or users..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Trending Hashtags */}
      {trendingHashtags.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <HashtagIcon className="h-5 w-5" />
            Trending Hashtags
          </h3>
          <div className="flex flex-wrap gap-2">
            {trendingHashtags.map((hashtag) => (
              <button
                key={hashtag}
                onClick={() => {
                  setSearchQuery(`#${hashtag}`);
                  handleSearch({ preventDefault: () => {} } as React.FormEvent);
                }}
                className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
              >
                #{hashtag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-6">
        {loading && offset === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <UserCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No posts found</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="bg-white rounded-lg shadow-md border border-gray-200">
              {/* Post Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {post.author_avatar ? (
                      <img
                        src={post.author_avatar}
                        alt={post.author_name || 'User'}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="h-10 w-10 text-gray-400" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {post.is_anonymous ? 'Anonymous User' : (post.author_name || 'Unknown User')}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{formatTimeAgo(post.created_at)}</span>
                        {getVisibilityIcon(post.visibility)}
                        {post.location && (
                          <>
                            <MapPinIcon className="h-4 w-4" />
                            <span>{post.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <EllipsisHorizontalIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Post Content */}
              <div className="p-4">
                {post.title && (
                  <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                )}
                
                <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

                {/* Image */}
                {post.image_url && (
                  <div className="mb-4">
                    <img
                      src={post.image_url}
                      alt={post.image_alt_text || 'Post image'}
                      className="w-full max-h-96 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Link Preview */}
                {post.link_url && (
                  <div className="mb-4 border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <LinkIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                      <div>
                        {post.link_title && (
                          <h4 className="font-medium text-gray-900">{post.link_title}</h4>
                        )}
                        {post.link_description && (
                          <p className="text-sm text-gray-600 mt-1">{post.link_description}</p>
                        )}
                        <p className="text-sm text-indigo-600 mt-1">{post.link_url}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hashtags */}
                {post.hashtags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {post.hashtags.map((hashtag) => (
                        <span
                          key={hashtag}
                          className="text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          #{hashtag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Post Actions */}
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => handleLikePost(post._id)}
                      className={`flex items-center gap-2 transition-colors ${
                        post.user_liked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                      }`}
                    >
                      {post.user_liked ? (
                        <HeartSolidIcon className="h-5 w-5" />
                      ) : (
                        <HeartIcon className="h-5 w-5" />
                      )}
                      <span className="text-sm">{post.likes_count}</span>
                    </button>

                    <button
                      onClick={() => handleBookmarkPost(post._id)}
                      className={`flex items-center gap-2 transition-colors ${
                        post.user_bookmarked ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'
                      }`}
                    >
                      {post.user_bookmarked ? (
                        <BookmarkSolidIcon className="h-5 w-5" />
                      ) : (
                        <BookmarkIcon className="h-5 w-5" />
                      )}
                      <span className="text-sm">{post.bookmarks_count}</span>
                    </button>

                    <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
                      <ChatBubbleLeftIcon className="h-5 w-5" />
                      <span className="text-sm">{post.comments_count}</span>
                    </button>

                    {post.allow_shares && (
                      <button className="flex items-center gap-2 text-gray-500 hover:text-green-600 transition-colors">
                        <ShareIcon className="h-5 w-5" />
                        <span className="text-sm">{post.shares_count}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <EyeIcon className="h-4 w-4" />
                    <span>{post.views_count}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Load More Button */}
        {hasMore && posts.length > 0 && (
          <div className="text-center">
            <button
              onClick={() => loadPosts(true)}
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Create Post</h2>
              <button
                onClick={() => {
                  setShowCreatePost(false);
                  resetCreatePostForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Post Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post Type
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'text', icon: ChatBubbleLeftIcon, label: 'Text' },
                    { value: 'image', icon: PhotoIcon, label: 'Image' },
                    { value: 'video', icon: VideoCameraIcon, label: 'Video' },
                    { value: 'link', icon: LinkIcon, label: 'Link' }
                  ].map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setCreatePostData(prev => ({ ...prev, post_type: value }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                        createPostData.post_type === value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={createPostData.title || ''}
                  onChange={(e) => setCreatePostData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Give your post a title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  value={createPostData.content}
                  onChange={(e) => setCreatePostData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="What's on your mind? Use #hashtags and @mentions..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Image Upload */}
              {createPostData.post_type === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image
                  </label>
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors"
                    >
                      <PhotoIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">
                        {imageFile ? imageFile.name : 'Click to select an image'}
                      </p>
                    </button>
                    {imageFile && (
                      <input
                        type="text"
                        value={createPostData.image_alt_text || ''}
                        onChange={(e) => setCreatePostData(prev => ({ ...prev, image_alt_text: e.target.value }))}
                        placeholder="Image description (for accessibility)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Link Fields */}
              {createPostData.post_type === 'link' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link URL *
                    </label>
                    <input
                      type="url"
                      value={createPostData.link_url || ''}
                      onChange={(e) => setCreatePostData(prev => ({ ...prev, link_url: e.target.value }))}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link Title
                    </label>
                    <input
                      type="text"
                      value={createPostData.link_title || ''}
                      onChange={(e) => setCreatePostData(prev => ({ ...prev, link_title: e.target.value }))}
                      placeholder="Title of the linked content"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link Description
                    </label>
                    <textarea
                      value={createPostData.link_description || ''}
                      onChange={(e) => setCreatePostData(prev => ({ ...prev, link_description: e.target.value }))}
                      placeholder="Brief description of the linked content"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visibility
                  </label>
                  <select
                    value={createPostData.visibility}
                    onChange={(e) => setCreatePostData(prev => ({ ...prev, visibility: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={createPostData.location || ''}
                    onChange={(e) => setCreatePostData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Add location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createPostData.allow_comments}
                    onChange={(e) => setCreatePostData(prev => ({ ...prev, allow_comments: e.target.checked }))}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Allow comments</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createPostData.allow_shares}
                    onChange={(e) => setCreatePostData(prev => ({ ...prev, allow_shares: e.target.checked }))}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Allow shares</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createPostData.is_anonymous}
                    onChange={(e) => setCreatePostData(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Post anonymously</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreatePost(false);
                  resetCreatePostForm();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={uploading || !createPostData.content.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {uploading ? 'Creating...' : 'Create Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}