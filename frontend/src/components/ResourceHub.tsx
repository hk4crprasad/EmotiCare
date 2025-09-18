import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { 
  Play, 
  Download, 
  BookOpen, 
  Headphones, 
  Video, 
  Search, 
  Clock, 
  Star,
  Volume2,
  FileText,
  Globe,
  Filter,
  ExternalLink,
  CheckCircle,
  Heart,
  Loader2,
  Plus,
  X
} from 'lucide-react';
import { apiService } from '../services/api';

interface Resource {
  id: string;
  title: string;
  description: string;
  resource_type: 'video' | 'audio' | 'article' | 'pdf' | 'interactive' | 'external_link';
  category: string;
  language: string;
  content_url?: string;
  file_path?: string;
  duration_minutes?: number;
  difficulty_level: number;
  tags: string[];
  is_premium: boolean;
  is_active: boolean;
  view_count: number;
  rating_average: number;
  rating_count: number;
  created_at: string;
}

interface ResourceCategory {
  value: string;
  label: string;
}

interface ResourceType {
  value: string;
  label: string;
}

interface ResourceHubProps {
  userRole?: 'student' | 'counselor' | 'admin';
  isAuthenticated?: boolean;
}

export function ResourceHub({ userRole = 'student', isAuthenticated = false }: ResourceHubProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [recommendedResources, setRecommendedResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'recommended' | 'progress'>('recommended');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    description: '',
    resource_type: 'article',
    category: 'stress_management',
    language: 'english',
    content_url: '',
    duration_minutes: '',
    difficulty_level: 1,
    tags: '',
    is_premium: false
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'all') {
      loadResources();
    }
  }, [selectedCategory, selectedType, selectedDifficulty, activeTab]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [
        categoriesData,
        typesData,
        recommendedData,
        progressData
      ] = await Promise.all([
        apiService.getResourceCategories(),
        apiService.getResourceTypes(),
        apiService.getRecommendedResources(10),
        apiService.getUserResourceProgress().catch(() => [])
      ]);

      setCategories(categoriesData as ResourceCategory[]);
      setResourceTypes(typesData as ResourceType[]);
      setRecommendedResources(recommendedData as Resource[]);
      setUserProgress(progressData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load resource data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadResources = async () => {
    try {
      const params: any = {};
      if (selectedCategory) params.category = selectedCategory;
      if (selectedType) params.resource_type = selectedType;
      if (selectedDifficulty) params.difficulty_level = selectedDifficulty;

      const resourcesData = await apiService.getResources(params);
      setResources(resourcesData as Resource[]);
    } catch (error) {
      console.error('Error loading resources:', error);
      toast.error('Failed to load resources');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    try {
      const searchResults = await apiService.searchResources(searchQuery);
      setResources(searchResults as Resource[]);
      setActiveTab('all');
      toast.success(`Found ${searchResults.length} resources`);
    } catch (error) {
      console.error('Error searching resources:', error);
      toast.error('Search failed');
    }
  };

  const handleResourceView = async (resource: Resource) => {
    try {
      await apiService.getResource(resource.id);
      if (resource.content_url) {
        window.open(resource.content_url, '_blank');
      }
      toast.success(`Viewing: ${resource.title}`);
    } catch (error) {
      console.error('Error viewing resource:', error);
      toast.error('Failed to open resource');
    }
  };

  const handleResourceComplete = async (resourceId: string) => {
    try {
      await apiService.markResourceComplete(resourceId);
      toast.success('Resource marked as completed!');
      // Reload user progress
      const progressData = await apiService.getUserResourceProgress();
      setUserProgress(progressData);
    } catch (error) {
      console.error('Error marking resource complete:', error);
      toast.error('Failed to mark resource as complete');
    }
  };

  const handleResourceRating = async (resourceId: string, rating: number) => {
    try {
      await apiService.rateResource(resourceId, rating);
      toast.success('Rating submitted successfully!');
      // Reload resources to get updated ratings
      if (activeTab === 'all') {
        loadResources();
      } else if (activeTab === 'recommended') {
        const recommendedData = await apiService.getRecommendedResources(10);
        setRecommendedResources(recommendedData as Resource[]);
      }
    } catch (error) {
      console.error('Error rating resource:', error);
      toast.error('Failed to submit rating');
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFormData.title.trim() || !uploadFormData.description.trim()) {
      toast.error('Please fill in title and description');
      return;
    }

    try {
      setIsUploading(true);
      
      // Prepare data according to backend schema
      let finalFormData = { 
        title: uploadFormData.title.trim(),
        description: uploadFormData.description.trim(),
        resource_type: uploadFormData.resource_type,
        category: uploadFormData.category,
        language: uploadFormData.language,
        difficulty_level: uploadFormData.difficulty_level,
        tags: uploadFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        is_premium: uploadFormData.is_premium,
        content_url: uploadFormData.content_url.trim() || undefined,
        duration_minutes: uploadFormData.duration_minutes ? parseInt(uploadFormData.duration_minutes) : undefined
      };

      // Upload file if provided
      if (uploadFile) {
        const uploadResponse = await apiService.uploadResourceFile(uploadFile) as any;
        finalFormData.content_url = uploadResponse.file_url;
      } else if (!finalFormData.content_url) {
        toast.error('Please provide either a file or a URL');
        return;
      }

      // Create resource
      await apiService.createResource(finalFormData);
      
      toast.success('Resource uploaded successfully!');
      setShowUploadModal(false);
      resetUploadForm();
      
      // Reload resources
      if (activeTab === 'all') {
        loadResources();
      }
    } catch (error: any) {
      console.error('Error uploading resource:', error);
      
      // Show more specific error messages
      if (error.response?.status === 422) {
        const errorDetail = error.response?.data?.detail;
        if (Array.isArray(errorDetail)) {
          const fieldErrors = errorDetail.map((err: any) => `${err.loc?.join('.')}: ${err.msg}`).join(', ');
          toast.error(`Validation Error: ${fieldErrors}`);
        } else {
          toast.error(`Validation Error: ${errorDetail || 'Invalid data format'}`);
        }
      } else {
        toast.error('Failed to upload resource');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFormData({
      title: '',
      description: '',
      resource_type: 'article',
      category: 'stress_management',
      language: 'english',
      content_url: '',
      duration_minutes: '',
      difficulty_level: 1,
      tags: '',
      is_premium: false
    });
    setUploadFile(null);
  };

  const canUploadResources = isAuthenticated && (userRole === 'counselor' || userRole === 'admin');

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-5 w-5" />;
      case 'audio': return <Headphones className="h-5 w-5" />;
      case 'article': return <BookOpen className="h-5 w-5" />;
      case 'pdf': return <FileText className="h-5 w-5" />;
      case 'interactive': return <Play className="h-5 w-5" />;
      case 'external_link': return <ExternalLink className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getDifficultyBadge = (level: number) => {
    if (level <= 2) return <Badge className="bg-green-100 text-green-800">Beginner</Badge>;
    if (level <= 3) return <Badge className="bg-yellow-100 text-yellow-800">Intermediate</Badge>;
    return <Badge className="bg-red-100 text-red-800">Advanced</Badge>;
  };

  const ResourceCard = ({ resource, showProgress = false }: { resource: Resource; showProgress?: boolean }) => {
    const progress = userProgress.find(p => p.resource_id === resource.id);
    
    return (
      <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow h-full flex flex-col">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            {getResourceIcon(resource.resource_type)}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base sm:text-lg leading-tight line-clamp-2">{resource.title}</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">{resource.category.replace('_', ' ')}</p>
            </div>
          </div>
          {resource.is_premium && (
            <Badge className="bg-purple-100 text-purple-800 text-xs flex-shrink-0 ml-2">Premium</Badge>
          )}
        </div>

        <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 line-clamp-3 flex-1">{resource.description}</p>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
          {resource.duration_minutes && (
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{resource.duration_minutes} min</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
            <span>{resource.rating_average.toFixed(1)} ({resource.rating_count})</span>
          </div>
          <div className="flex items-center space-x-1">
            <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{resource.language}</span>
            <span className="sm:hidden">{resource.language.slice(0, 3)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3 sm:mb-4">
          {getDifficultyBadge(resource.difficulty_level)}
          <div className="text-xs sm:text-sm text-gray-600">
            {resource.view_count} views
          </div>
        </div>

        {showProgress && progress && (
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
              <span>Progress</span>
              <span>{progress.progress_percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress.progress_percentage}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <Button 
            onClick={() => handleResourceView(resource)}
            className="flex-1 text-sm"
          >
            View Resource
          </Button>
          
          <div className="flex items-center space-x-2 justify-between sm:justify-end">
            {(!progress || progress.progress_percentage < 100) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResourceComplete(resource.id)}
                className="text-xs"
              >
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}

            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleResourceRating(resource.id, star)}
                  className="text-gray-300 hover:text-yellow-400 transition-colors"
                >
                  <Star 
                    className={`h-3 w-3 sm:h-4 sm:w-4 ${star <= Math.round(resource.rating_average) ? 'fill-yellow-400 text-yellow-400' : ''}`} 
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {resource.tags.length > 0 && (
          <div className="mt-3 sm:mt-4 flex flex-wrap gap-1 sm:gap-2">
            {resource.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {resource.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{resource.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto p-3 sm:p-4 lg:p-8 xl:p-12">
      <div className="mb-6 sm:mb-8 lg:mb-12 xl:mb-16 flex flex-col sm:flex-row justify-between items-start space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-bold mb-2 lg:mb-4 xl:mb-6 text-gray-900">Mental Health Resources</h1>
          <p className="text-sm sm:text-base lg:text-xl xl:text-2xl text-gray-600 leading-relaxed max-w-4xl">
            Discover articles, videos, audio guides, and interactive tools to support your mental wellbeing.
          </p>
        </div>
        {canUploadResources && (
          <Button onClick={() => setShowUploadModal(true)} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-sm lg:text-base px-4 lg:px-6 py-2 lg:py-3">
            <Plus className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
            Upload Resource
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-4 sm:mb-6 lg:mb-10 xl:mb-12 space-y-3 sm:space-y-4 lg:space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 lg:h-5 lg:w-5" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 lg:pl-12 text-sm sm:text-base lg:text-lg py-2 lg:py-3"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          <Button onClick={handleSearch} className="w-full sm:w-auto text-sm lg:text-base px-4 lg:px-6 py-2 lg:py-3">
            <Search className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
            Search
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 lg:px-4 py-2 lg:py-3 border rounded-md text-sm lg:text-base flex-1 sm:flex-none min-w-40 lg:min-w-48"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm flex-1 sm:flex-none"
          >
            <option value="">All Types</option>
            {resourceTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty || ''}
            onChange={(e) => setSelectedDifficulty(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 border rounded-md text-sm flex-1 sm:flex-none"
          >
            <option value="">All Levels</option>
            <option value="1">Beginner</option>
            <option value="2">Beginner+</option>
            <option value="3">Intermediate</option>
            <option value="4">Advanced</option>
            <option value="5">Expert</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 lg:mb-8 xl:mb-10 h-auto">
          <TabsTrigger value="recommended" className="text-xs sm:text-sm lg:text-base py-2 lg:py-3">Recommended</TabsTrigger>
          <TabsTrigger value="all" className="text-xs sm:text-sm lg:text-base py-2 lg:py-3">All Resources</TabsTrigger>
          <TabsTrigger value="progress" className="text-xs sm:text-sm lg:text-base py-2 lg:py-3">My Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="mt-0">
          <div className="mb-4 sm:mb-6 lg:mb-8 xl:mb-10">
            <h2 className="text-lg sm:text-xl lg:text-3xl xl:text-4xl font-semibold mb-2 lg:mb-4">Recommended for You</h2>
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-600 leading-relaxed">
              Personalized resources based on your needs and previous assessments.
            </p>
          </div>
          
          {recommendedResources.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 xl:gap-10">
              {recommendedResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 lg:py-16 xl:py-20">
              <Heart className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 xl:h-20 xl:w-20 text-gray-400 mx-auto mb-4 lg:mb-6" />
              <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-600 mb-2">No recommendations available yet.</p>
              <p className="text-xs sm:text-sm lg:text-base text-gray-500">Complete an assessment to get personalized recommendations.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-0">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-2">All Resources</h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Browse our complete library of mental health resources.
            </p>
          </div>

          {resources.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No resources found.</p>
              <p className="text-sm text-gray-500">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">My Progress</h2>
            <p className="text-gray-600">
              Track your progress through resources and continue where you left off.
            </p>
          </div>

          {userProgress.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userProgress.map((progressItem) => {
                // Create a mock resource from progress data for display
                const resource: Resource = {
                  id: progressItem.resource_id,
                  title: progressItem.resource_title,
                  description: `Category: ${progressItem.resource_category}`,
                  resource_type: 'article' as any,
                  category: progressItem.resource_category,
                  language: 'English',
                  duration_minutes: 0,
                  difficulty_level: 1,
                  tags: [],
                  is_premium: false,
                  is_active: true,
                  view_count: 0,
                  rating_average: progressItem.rating || 0,
                  rating_count: 1,
                  created_at: progressItem.started_at
                };
                return (
                  <ResourceCard 
                    key={progressItem.resource_id} 
                    resource={resource} 
                    showProgress={true}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No progress yet.</p>
              <p className="text-sm text-gray-500">Start exploring resources to track your progress.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload Resource Modal */}
      {showUploadModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowUploadModal(false);
              resetUploadForm();
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-auto max-h-[85vh] border border-gray-200 animate-in zoom-in-95 duration-200 m-4 flex flex-col">
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-semibold text-gray-900">Upload New Resource</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 group"
                title="Close"
              >
                <X className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(85vh - 140px)' }}>
              <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={uploadFormData.title}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter resource title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={uploadFormData.description}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this resource offers"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Resource Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={uploadFormData.resource_type}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, resource_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="article">Article</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                    <option value="pdf">PDF</option>
                    <option value="interactive">Interactive</option>
                    <option value="external_link">External Link</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={uploadFormData.category}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))
                    ) : (
                      // Fallback options matching backend enum
                      <>
                        <option value="stress_management">Stress Management</option>
                        <option value="anxiety_coping">Anxiety Coping</option>
                        <option value="depression_support">Depression Support</option>
                        <option value="sleep_hygiene">Sleep Hygiene</option>
                        <option value="mindfulness">Mindfulness</option>
                        <option value="meditation">Meditation</option>
                        <option value="breathing_exercises">Breathing Exercises</option>
                        <option value="study_skills">Study Skills</option>
                        <option value="time_management">Time Management</option>
                        <option value="relationships">Relationships</option>
                        <option value="self_care">Self Care</option>
                        <option value="crisis_help">Crisis Help</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* File Upload or URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <div className="space-y-3">
                  <div>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.mp3,.mp4,.wav,.avi,.mov,.ppt,.pptx"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported: PDF, DOC, DOCX, MP3, MP4, WAV, AVI, MOV, PPT, PPTX (max 50MB)
                    </p>
                  </div>
                  
                  <div className="text-center text-gray-500">
                    — OR —
                  </div>
                  
                  <div>
                    <input
                      type="url"
                      value={uploadFormData.content_url}
                      onChange={(e) => setUploadFormData(prev => ({ ...prev, content_url: e.target.value }))}
                      placeholder="Enter URL (e.g., YouTube, article link)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={uploadFormData.duration_minutes}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                    placeholder="e.g., 15"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={uploadFormData.difficulty_level}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, difficulty_level: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>1 - Beginner</option>
                    <option value={2}>2 - Easy</option>
                    <option value={3}>3 - Intermediate</option>
                    <option value={4}>4 - Advanced</option>
                    <option value={5}>5 - Expert</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={uploadFormData.tags}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g., meditation, anxiety, stress (comma-separated)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Premium */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={uploadFormData.is_premium}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, is_premium: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Mark as premium content</span>
                </label>
              </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }}
                className="px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleFileUpload}
                disabled={isUploading || !uploadFormData.title.trim() || !uploadFormData.description.trim()}
                className="px-6 py-2 bg-green-600 hover:bg-green-700"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Resource'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}