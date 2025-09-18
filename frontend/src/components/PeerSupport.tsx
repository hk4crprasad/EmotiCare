import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  MessageCircle, 
  Heart, 
  Reply, 
  Flag, 
  Shield, 
  Users, 
  Plus,
  Search,
  Clock,
  TrendingUp,
  User
} from 'lucide-react';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  authorType: 'student' | 'volunteer' | 'moderator';
  timestamp: Date;
  category: string;
  likes: number;
  replies: number;
  isAnonymous: boolean;
  tags: string[];
  isHelpful?: boolean;
}

interface Reply {
  id: string;
  postId: string;
  content: string;
  author: string;
  authorType: 'student' | 'volunteer' | 'moderator';
  timestamp: Date;
  likes: number;
  isAnonymous: boolean;
}

const mockPosts: ForumPost[] = [
  {
    id: '1',
    title: 'Dealing with exam anxiety - need support',
    content: "Hi everyone, I have my finals coming up next week and I'm feeling really overwhelmed. The anxiety is making it hard to focus while studying. Has anyone experienced this? What helped you get through it?",
    author: 'Anonymous Student',
    authorType: 'student',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    category: 'Academic Stress',
    likes: 15,
    replies: 8,
    isAnonymous: true,
    tags: ['anxiety', 'exams', 'studying'],
    isHelpful: true
  },
  {
    id: '2',
    title: 'Feeling isolated in college',
    content: "I'm a first-year student and I'm really struggling to make friends. Everyone seems to have their groups already formed. I feel really lonely and it's affecting my mood. Any advice?",
    author: 'StudentHelper23',
    authorType: 'student',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    category: 'Social Issues',
    likes: 12,
    replies: 6,
    isAnonymous: false,
    tags: ['loneliness', 'friends', 'first-year']
  },
  {
    id: '3',
    title: 'Sleep schedule completely messed up',
    content: "I've been staying up until 3-4 AM every night and then feeling exhausted during the day. This is really affecting my classes and my mental health. How do you maintain a healthy sleep schedule with a heavy course load?",
    author: 'Anonymous Student',
    authorType: 'student',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    category: 'Sleep & Wellness',
    likes: 8,
    replies: 4,
    isAnonymous: true,
    tags: ['sleep', 'schedule', 'wellness']
  }
];

const mockReplies: Reply[] = [
  {
    id: '1',
    postId: '1',
    content: "I totally understand this! What helped me was breaking my study sessions into smaller chunks and practicing deep breathing exercises between them. Also, talking to the counseling center about exam anxiety techniques was really helpful.",
    author: 'Peer Volunteer Sarah',
    authorType: 'volunteer',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    likes: 5,
    isAnonymous: false
  },
  {
    id: '2',
    postId: '1',
    content: "You're not alone in this! I found that creating a study schedule and sticking to it helped reduce my anxiety because I felt more in control. Also, remember that it's okay to take breaks.",
    author: 'Anonymous Student',
    authorType: 'student',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    likes: 3,
    isAnonymous: true
  }
];

export function PeerSupport() {
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('General');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  const categories = ['All', 'Academic Stress', 'Social Issues', 'Sleep & Wellness', 'Mental Health', 'General Support'];

  const getAuthorIcon = (authorType: string) => {
    switch (authorType) {
      case 'volunteer':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'moderator':
        return <Shield className="h-4 w-4 text-green-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAuthorBadge = (authorType: string) => {
    switch (authorType) {
      case 'volunteer':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Peer Volunteer</Badge>;
      case 'moderator':
        return <Badge className="bg-green-100 text-green-800 text-xs">Moderator</Badge>;
      default:
        return null;
    }
  };

  const handleCreatePost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return;
    
    // Simulate post creation
    setShowNewPostForm(false);
    setNewPostTitle('');
    setNewPostContent('');
    setNewPostCategory('General');
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-gray-900">Peer Support Community</h1>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          Connect with fellow students in a safe, moderated environment. Share experiences, 
          get support, and help others on their mental health journey.
        </p>
      </div>

      {/* Community Guidelines */}
      <Card className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center space-x-2 mb-2 sm:mb-3">
          <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          <span className="font-medium text-sm sm:text-base text-blue-800">Community Guidelines</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm text-blue-700">
          <div>• Be respectful and supportive</div>
          <div>• No medical advice or diagnosis</div>
          <div>• Maintain confidentiality</div>
          <div>• Report concerning content</div>
        </div>
      </Card>

      <Tabs defaultValue="forum" className="mb-4 sm:mb-6">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="forum" className="text-xs sm:text-sm py-2 sm:py-3">Discussion Forum</TabsTrigger>
          <TabsTrigger value="groups" className="text-xs sm:text-sm py-2 sm:py-3">Support Groups</TabsTrigger>
          <TabsTrigger value="volunteers" className="text-xs sm:text-sm py-2 sm:py-3">Peer Volunteers</TabsTrigger>
        </TabsList>

        <TabsContent value="forum" className="mt-4 sm:mt-6">
          {selectedPost ? (
            /* Post Detail View */
            <div className="space-y-4 sm:space-y-6">
              <Button 
                variant="outline" 
                onClick={() => setSelectedPost(null)}
                className="mb-3 sm:mb-4 text-sm"
              >
                ← Back to Forum
              </Button>
              
              <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                      {getAuthorIcon(selectedPost.authorType)}
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm sm:text-base">{selectedPost.author}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{formatTimeAgo(selectedPost.timestamp)}</div>
                    </div>
                    <div className="hidden sm:block">
                      {getAuthorBadge(selectedPost.authorType)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="sm:hidden">
                      {getAuthorBadge(selectedPost.authorType)}
                    </div>
                    <Badge variant="outline" className="text-xs">{selectedPost.category}</Badge>
                  </div>
                </div>
                
                <h1 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 leading-tight">{selectedPost.title}</h1>
                <p className="text-sm sm:text-base text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed">{selectedPost.content}</p>
                
                <div className="flex items-center space-x-4 text-xs sm:text-sm text-gray-500 mb-4">
                  <button className="flex items-center space-x-1 hover:text-red-500 transition-colors">
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{selectedPost.likes}</span>
                  </button>
                  <span className="flex items-center space-x-1">
                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{selectedPost.replies} replies</span>
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {selectedPost.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </Card>

              {/* Replies */}
              <div className="space-y-4">
                <h2 className="text-xl">Replies ({mockReplies.filter(r => r.postId === selectedPost.id).length})</h2>
                {mockReplies
                  .filter(reply => reply.postId === selectedPost.id)
                  .map(reply => (
                    <Card key={reply.id} className="p-4 ml-8">
                      <div className="flex items-start space-x-3 mb-3">
                        <Avatar className="w-8 h-8">
                          {getAuthorIcon(reply.authorType)}
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">{reply.author}</span>
                            {getAuthorBadge(reply.authorType)}
                            <span className="text-xs text-gray-500">{formatTimeAgo(reply.timestamp)}</span>
                          </div>
                          <p className="text-gray-700 text-sm">{reply.content}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-11">
                        <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500">
                          <Heart className="h-3 w-3" />
                          <span>{reply.likes}</span>
                        </button>
                        <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500">
                          <Reply className="h-3 w-3" />
                          <span>Reply</span>
                        </button>
                      </div>
                    </Card>
                  ))
                }
                
                {/* Reply Form */}
                <Card className="p-3 sm:p-4 ml-4 sm:ml-8">
                  <h3 className="font-medium text-sm sm:text-base mb-3">Add a supportive reply</h3>
                  <Textarea
                    placeholder="Share your experience or offer support..."
                    className="mb-3 text-sm"
                    rows={3}
                  />
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                    <label className="flex items-center space-x-2 text-xs sm:text-sm">
                      <input type="checkbox" defaultChecked className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Post anonymously</span>
                    </label>
                    <Button size="sm" className="text-sm">Post Reply</Button>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            /* Forum List View */
            <div className="space-y-4 sm:space-y-6">
              {/* Search and Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  <Input
                    placeholder="Search discussions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:pl-10 text-sm"
                  />
                </div>
                <Button 
                  onClick={() => setShowNewPostForm(true)} 
                  className="w-full sm:w-auto text-sm"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  New Discussion
                </Button>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {categories.map(category => (
                  <Badge 
                    key={category} 
                    variant="outline" 
                    className="cursor-pointer text-xs hover:bg-primary hover:text-white transition-colors"
                  >
                    {category}
                  </Badge>
                ))}
              </div>

              {/* New Post Form */}
              {showNewPostForm && (
                <Card className="p-4 sm:p-6 border-primary/20">
                  <h3 className="font-medium text-base sm:text-lg mb-4">Start a New Discussion</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Title</label>
                      <Input
                        placeholder="What would you like to discuss?"
                        value={newPostTitle}
                        onChange={(e) => setNewPostTitle(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Category</label>
                      <select 
                        value={newPostCategory} 
                        onChange={(e) => setNewPostCategory(e.target.value)}
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        {categories.slice(1).map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Content</label>
                      <Textarea
                        placeholder="Share your thoughts, experiences, or questions. Remember our community guidelines."
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        rows={4}
                        className="text-sm resize-none"
                      />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                      <label className="flex items-center space-x-2 text-xs sm:text-sm">
                        <input 
                          type="checkbox" 
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="w-3 h-3 sm:w-4 sm:h-4"
                        />
                        <span>Post anonymously</span>
                      </label>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowNewPostForm(false)}
                          className="text-sm"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreatePost}
                          disabled={!newPostTitle.trim() || !newPostContent.trim()}
                          className="text-sm"
                        >
                          Post Discussion
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Forum Posts */}
              <div className="space-y-3 sm:space-y-4">
                {mockPosts.map(post => (
                  <Card 
                    key={post.id} 
                    className="p-3 sm:p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedPost(post)}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                          {getAuthorIcon(post.authorType)}
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm sm:text-base">{post.author}</div>
                          <div className="text-xs sm:text-sm text-gray-500">{formatTimeAgo(post.timestamp)}</div>
                        </div>
                        <div className="hidden sm:block">
                          {getAuthorBadge(post.authorType)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="sm:hidden">
                          {getAuthorBadge(post.authorType)}
                        </div>
                        <Badge variant="outline" className="text-xs">{post.category}</Badge>
                      </div>
                    </div>
                    
                    <h3 className="font-medium text-sm sm:text-lg mb-2 leading-tight line-clamp-2">{post.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">{post.content}</p>
                    
                    <div className="flex flex-wrap items-center justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{post.likes}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{post.replies}</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2 sm:mt-0">
                        {post.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                        {post.tags.length > 2 && (
                          <span className="text-xs text-gray-500">+{post.tags.length - 2}</span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                <Card className="p-6">
                  <h2 className="text-xl mb-4">Create New Post</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Title</label>
                      <Input
                        value={newPostTitle}
                        onChange={(e) => setNewPostTitle(e.target.value)}
                        placeholder="What would you like to discuss?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Category</label>
                      <select 
                        value={newPostCategory}
                        onChange={(e) => setNewPostCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      >
                        {categories.slice(1).map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Content</label>
                      <Textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="Share your thoughts, experiences, or questions..."
                        rows={4}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                        />
                        <span className="text-sm">Post anonymously</span>
                      </label>
                      <div className="space-x-2">
                        <Button variant="outline" onClick={() => setShowNewPostForm(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreatePost}>
                          Create Post
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Forum Posts */}
              <div className="space-y-4">
                {mockPosts.map(post => (
                  <Card 
                    key={post.id} 
                    className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedPost(post)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          {getAuthorIcon(post.authorType)}
                        </Avatar>
                        <div>
                          <div className="font-medium">{post.author}</div>
                          <div className="text-sm text-gray-500">{formatTimeAgo(post.timestamp)}</div>
                        </div>
                        {getAuthorBadge(post.authorType)}
                        {post.isHelpful && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Helpful</Badge>
                        )}
                      </div>
                      <Badge variant="outline">{post.category}</Badge>
                    </div>
                    
                    <h3 className="text-lg font-medium mb-2">{post.title}</h3>
                    <p className="text-gray-600 mb-3 line-clamp-2">{post.content}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Heart className="h-4 w-4" />
                          <span>{post.likes}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.replies}</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="groups" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-2">Anxiety Support Circle</h3>
              <p className="text-gray-600 text-sm mb-4">
                Weekly group sessions for students dealing with anxiety and panic disorders.
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>12 members</span>
                </span>
                <Button size="sm">Join Group</Button>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-2">First-Year Transition</h3>
              <p className="text-gray-600 text-sm mb-4">
                Support group for first-year students navigating college life and independence.
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>8 members</span>
                </span>
                <Button size="sm">Join Group</Button>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-2">Study Stress Management</h3>
              <p className="text-gray-600 text-sm mb-4">
                Learn effective strategies for managing academic pressure and exam stress.
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>15 members</span>
                </span>
                <Button size="sm">Join Group</Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="volunteers" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="w-12 h-12">
                  <User className="h-6 w-6" />
                </Avatar>
                <div>
                  <h3 className="font-medium">Sarah M.</h3>
                  <p className="text-sm text-gray-600">Peer Volunteer</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Available</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Psychology major with training in anxiety and stress management. 
                Available for chat support and study group facilitation.
              </p>
              <div className="space-y-2 text-xs text-gray-500 mb-4">
                <div>• Anxiety Support</div>
                <div>• Academic Stress</div>
                <div>• Study Skills</div>
              </div>
              <Button size="sm" className="w-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}