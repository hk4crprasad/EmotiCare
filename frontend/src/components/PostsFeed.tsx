import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Camera, Hash, MapPin, Plus, Search, TrendingUp } from 'lucide-react';
import apiService from '../services/api';

interface Post {
  _id: string;
  title?: string;
  content: string;
  author_id: string;
  author_name?: string;
  post_type: string;
  image_url?: string;
  image_alt_text?: string;
  video_url?: string;
  link_url?: string;
  link_title?: string;
  link_description?: string;
  hashtags: string[];
  mentions: string[];
  like_count: number;
  comment_count: number;
  share_count: number;
  bookmark_count: number;
  visibility: string;
  allow_comments: boolean;
  allow_shares: boolean;
  is_anonymous: boolean;
  location?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CreatePostData {
  title?: string;
  content: string;
  post_type?: string;
  image_url?: string;
  image_alt_text?: string;
  hashtags?: string[];
  location?: string;
  is_anonymous?: boolean;
  visibility?: string;
}

const PostsFeed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState<CreatePostData>({
    content: '',
    post_type: 'text',
    hashtags: [],
    visibility: 'public',
    is_anonymous: false
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedType, setFeedType] = useState<'public' | 'following' | 'trending'>('public');
  const [trendingHashtags, setTrendingHashtags] = useState<string[]>([]);

  useEffect(() => {
    loadPosts();
    loadTrendingHashtags();
  }, [feedType]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPostFeed({
        limit: 20,
        offset: 0,
        feed_type: feedType
      });
      setPosts(response.posts || []);
    } catch (error) {
      console.error('Error loading posts:', error);
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
    if (!newPost.content.trim()) return;

    try {
      await apiService.createPost(newPost);
      setNewPost({
        content: '',
        post_type: 'text',
        hashtags: [],
        visibility: 'public',
        is_anonymous: false
      });
      setShowCreatePost(false);
      loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const response = await apiService.uploadPostImage(file);
      setNewPost(prev => ({
        ...prev,
        image_url: response.image_url,
        image_alt_text: `Uploaded image: ${file.name}`,
        post_type: 'image'
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      await apiService.likePost(postId);
      // Update local state
      setPosts(posts.map(post => 
        post._id === postId 
          ? { ...post, like_count: post.like_count + 1 }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleBookmarkPost = async (postId: string) => {
    try {
      await apiService.bookmarkPost(postId);
      // Update local state
      setPosts(posts.map(post => 
        post._id === postId 
          ? { ...post, bookmark_count: post.bookmark_count + 1 }
          : post
      ));
    } catch (error) {
      console.error('Error bookmarking post:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadPosts();
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.searchPosts({
        q: searchQuery,
        limit: 20,
        offset: 0
      });
      setPosts(response.posts || []);
    } catch (error) {
      console.error('Error searching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractHashtags = (content: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  };

  const handleContentChange = (content: string) => {
    const hashtags = extractHashtags(content);
    setNewPost(prev => ({
      ...prev,
      content,
      hashtags
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Community Posts</h1>
        <button
          onClick={() => setShowCreatePost(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Post
        </button>
      </div>

      {/* Feed Type Selector */}
      <div className="flex gap-2">
        {(['public', 'following', 'trending'] as const).map(type => (
          <button
            key={type}
            onClick={() => setFeedType(type)}
            className={`px-4 py-2 rounded-lg capitalize ${
              feedType === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type === 'trending' && <TrendingUp className="w-4 h-4 inline mr-1" />}
            {type}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Search
        </button>
      </div>

      {/* Trending Hashtags */}
      {trendingHashtags.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Trending Hashtags
          </h3>
          <div className="flex flex-wrap gap-2">
            {trendingHashtags.map(hashtag => (
              <button
                key={hashtag}
                onClick={() => {
                  setSearchQuery(`#${hashtag}`);
                  handleSearch();
                }}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
              >
                #{hashtag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Post</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's on your mind?
                </label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Share your thoughts... Use #hashtags to categorize your post"
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {newPost.image_url && (
                <div className="relative">
                  <img
                    src={newPost.image_url}
                    alt={newPost.image_alt_text}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setNewPost(prev => ({ ...prev, image_url: '', image_alt_text: '', post_type: 'text' }))}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  <Camera className="w-5 h-5" />
                  <span className="text-sm">
                    {uploadingImage ? 'Uploading...' : 'Add Photo'}
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Add location"
                    value={newPost.location || ''}
                    onChange={(e) => setNewPost(prev => ({ ...prev, location: e.target.value }))}
                    className="text-sm border-none outline-none"
                  />
                </label>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newPost.is_anonymous}
                    onChange={(e) => setNewPost(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                  />
                  <span className="text-sm">Post anonymously</span>
                </label>

                <select
                  value={newPost.visibility}
                  onChange={(e) => setNewPost(prev => ({ ...prev, visibility: e.target.value }))}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="public">Public</option>
                  <option value="followers">Followers Only</option>
                  <option value="private">Private</option>
                </select>
              </div>

              {newPost.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newPost.hashtags.map(hashtag => (
                    <span key={hashtag} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      #{hashtag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreatePost(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!newPost.content.trim() || uploadingImage}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No posts found. Be the first to share something!</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post._id} className="bg-white rounded-lg shadow p-6">
              {/* Post Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {post.is_anonymous ? 'A' : (post.author_name?.[0] || 'U')}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {post.is_anonymous ? 'Anonymous' : (post.author_name || 'Unknown User')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(post.created_at).toLocaleDateString()}
                      {post.location && (
                        <span className="ml-2 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {post.location}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Post Title */}
              {post.title && (
                <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
              )}

              {/* Post Content */}
              <div className="mb-4">
                <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Post Image */}
              {post.image_url && (
                <div className="mb-4">
                  <img
                    src={post.image_url}
                    alt={post.image_alt_text || 'Post image'}
                    className="w-full max-h-96 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Hashtags */}
              {post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.hashtags.map(hashtag => (
                    <button
                      key={hashtag}
                      onClick={() => {
                        setSearchQuery(`#${hashtag}`);
                        handleSearch();
                      }}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
                    >
                      #{hashtag}
                    </button>
                  ))}
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => handleLikePost(post._id)}
                    className="flex items-center gap-2 text-gray-600 hover:text-red-600"
                  >
                    <Heart className="w-5 h-5" />
                    <span className="text-sm">{post.like_count}</span>
                  </button>
                  
                  <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">{post.comment_count}</span>
                  </button>
                  
                  {post.allow_shares && (
                    <button className="flex items-center gap-2 text-gray-600 hover:text-green-600">
                      <Share2 className="w-5 h-5" />
                      <span className="text-sm">{post.share_count}</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleBookmarkPost(post._id)}
                  className="flex items-center gap-2 text-gray-600 hover:text-yellow-600"
                >
                  <Bookmark className="w-5 h-5" />
                  <span className="text-sm">{post.bookmark_count}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PostsFeed;