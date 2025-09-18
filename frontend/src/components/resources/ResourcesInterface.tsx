import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  BookOpen, 
  Play, 
  FileText, 
  Search, 
  Filter,
  Star,
  CheckCircle,
  Download,
  ExternalLink
} from 'lucide-react';
import { api } from '../../lib/api';

interface Resource {
  id: string;
  title: string;
  resource_type: string;
  category: string;
  description?: string;
  content?: string;
  rating_average?: number;
  content_url?: string;
  view_count?: number;
  rating_count?: number;
  created_at?: string;
}

interface Category {
  value: string;
  label: string;
}

interface ResourceType {
  value: string;
  label: string;
}

export function ResourcesInterface() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [recommendedResources, setRecommendedResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (searchQuery || selectedCategory || selectedType) {
      searchResources();
    } else {
      loadResources();
    }
  }, [searchQuery, selectedCategory, selectedType]);

  const loadInitialData = async () => {
    try {
      console.log('Loading initial data...');
      const [categoriesData, typesData, recommended, progress] = await Promise.all([
        api.getResourceCategories(),
        api.getResourceTypes(),
        api.getRecommendedResources(),
        api.getUserProgress()
      ]);

      console.log('Categories:', categoriesData);
      console.log('Types:', typesData);
      console.log('Recommended:', recommended);
      console.log('Progress:', progress);

      setCategories(categoriesData);
      setResourceTypes(typesData);
      setRecommendedResources(recommended);
      setUserProgress(progress);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadResources = async () => {
    setIsLoading(true);
    try {
      console.log('Loading resources...');
      const resources = await api.getResources();
      console.log('Resources loaded:', resources);
      setResources(resources);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchResources = async () => {
    if (!searchQuery && (!selectedCategory || selectedCategory === 'all') && (!selectedType || selectedType === 'all')) {
      loadResources();
      return;
    }

    setIsLoading(true);
    try {
      const results = await api.searchResources(
        searchQuery, 
        (selectedCategory && selectedCategory !== 'all') ? selectedCategory : undefined
      );
      setResources(results);
    } catch (error) {
      console.error('Error searching resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const viewResource = async (resourceId: string) => {
    try {
      const resource = await api.getResource(resourceId);
      setSelectedResource(resource);
    } catch (error) {
      console.error('Error loading resource:', error);
    }
  };

  const rateResource = async (resourceId: string, rating: number) => {
    try {
      await api.rateResource(resourceId, rating);
      // Refresh the resource data
      if (selectedResource?.id === resourceId) {
        await viewResource(resourceId);
      }
    } catch (error) {
      console.error('Error rating resource:', error);
    }
  };

  const markComplete = async (resourceId: string) => {
    try {
      await api.markResourceComplete(resourceId);
      // Refresh user progress
      const progress = await api.getUserProgress();
      setUserProgress(progress);
    } catch (error) {
      console.error('Error marking resource complete:', error);
    }
  };

  const getResourceIcon = (resource_type: string) => {
    switch (resource_type) {
      case 'video': return <Play className="h-5 w-5" />;
      case 'article': return <FileText className="h-5 w-5" />;
      case 'interactive': return <BookOpen className="h-5 w-5" />;
      case 'pdf': return <Download className="h-5 w-5" />;
      default: return <BookOpen className="h-5 w-5" />;
    }
  };

  const getTypeColor = (resource_type: string) => {
    const colors: { [key: string]: string } = {
      video: 'bg-red-100 text-red-800',
      article: 'bg-blue-100 text-blue-800',
      interactive: 'bg-green-100 text-green-800',
      pdf: 'bg-purple-100 text-purple-800'
    };
    return colors[resource_type] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      stress_management: 'bg-orange-100 text-orange-800',
      anxiety: 'bg-yellow-100 text-yellow-800',
      depression: 'bg-blue-100 text-blue-800',
      self_care: 'bg-green-100 text-green-800',
      academic_support: 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const isResourceCompleted = (resourceId: string) => {
    return userProgress.some((progress: any) => 
      progress.resource_id === resourceId && progress.completed
    );
  };

  if (selectedResource) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setSelectedResource(null)}>
            ← Back to Resources
          </Button>
          <div className="flex items-center gap-2">
            {getResourceIcon(selectedResource.resource_type)}
            <Badge className={getTypeColor(selectedResource.resource_type)}>
              {selectedResource.resource_type}
            </Badge>
            <Badge className={getCategoryColor(selectedResource.category)}>
              {selectedResource.category}
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {selectedResource.title}
              {isResourceCompleted(selectedResource.id) && (
                <CheckCircle className="h-6 w-6 text-green-600" />
              )}
            </CardTitle>
            {selectedResource.description && (
              <CardDescription>{selectedResource.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedResource.content && (
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: selectedResource.content }} />
              </div>
            )}

            {selectedResource.content_url && (
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Download className="h-5 w-5" />
                <div>
                  <p className="font-medium">Download Resource</p>
                  <p className="text-sm text-muted-foreground">
                    Access the complete resource file
                  </p>
                </div>
                <Button asChild>
                  <a href={selectedResource.content_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open
                  </a>
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium">Rate this resource</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => rateResource(selectedResource.id, rating)}
                        className="p-1"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            rating <= (selectedResource.rating_average || 0)
                              ? 'fill-current text-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                {selectedResource.rating_average && (
                  <div className="text-sm text-muted-foreground">
                    Average: {selectedResource.rating_average}/5
                  </div>
                )}
              </div>

              {!isResourceCompleted(selectedResource.id) && (
                <Button onClick={() => markComplete(selectedResource.id)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Complete
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1>Mental Health Resources</h1>
        <p className="text-muted-foreground">
          Discover articles, videos, exercises, and tools to support your mental wellness journey.
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category: any) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {resourceTypes.map((type: any) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="progress">My Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : resources.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No resources found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filter criteria.
                </p>
                <Button onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedType('all');
                }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource: any) => (
                <Card key={resource.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getResourceIcon(resource.resource_type)}
                        <CardTitle className="text-base line-clamp-2">
                          {resource.title}
                        </CardTitle>
                      </div>
                      {isResourceCompleted(resource.id) && (
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                    {resource.description && (
                      <CardDescription className="line-clamp-2">
                        {resource.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Badge className={getTypeColor(resource.resource_type)}>
                          {resource.resource_type}
                        </Badge>
                        <Badge className={getCategoryColor(resource.category)}>
                          {resource.category}
                        </Badge>
                      </div>
                      
                      {resource.rating_average && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-current text-yellow-500" />
                          <span className="text-sm">{resource.rating_average}/5</span>
                        </div>
                      )}
                      
                      <Button 
                        onClick={() => viewResource(resource.id)}
                        className="w-full"
                        variant="outline"
                      >
                        View Resource
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommended" className="space-y-4">
          {recommendedResources.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No recommendations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Complete some assessments to get personalized resource recommendations.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedResources.map((resource: any) => (
              <Card key={resource.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getResourceIcon(resource.resource_type)}
                      <CardTitle className="text-base line-clamp-2">
                        {resource.title}
                      </CardTitle>
                    </div>
                    <Badge variant="default">Recommended</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Badge className={getTypeColor(resource.resource_type)}>
                        {resource.resource_type}
                      </Badge>
                      <Badge className={getCategoryColor(resource.category)}>
                        {resource.category}
                      </Badge>
                    </div>
                    
                    <Button 
                      onClick={() => viewResource(resource.id)}
                      className="w-full"
                    >
                      View Resource
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          {userProgress.length > 0 ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Learning Progress</CardTitle>
                  <CardDescription>
                    Track your journey through mental health resources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Completion Rate</span>
                        <span>
                          {Math.round((userProgress.filter((p: any) => p.completed).length / userProgress.length) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={(userProgress.filter((p: any) => p.completed).length / userProgress.length) * 100} 
                        className="h-2" 
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{userProgress.length}</p>
                        <p className="text-sm text-muted-foreground">Resources Accessed</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{userProgress.filter((p: any) => p.completed).length}</p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {userProgress.filter((p: any) => p.rating).length}
                        </p>
                        <p className="text-sm text-muted-foreground">Rated</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userProgress.map((progress: any) => (
                  <Card key={progress.resource_id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{progress.title}</CardTitle>
                        {progress.completed && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {progress.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-current text-yellow-500" />
                            <span className="text-sm">You rated: {progress.rating}/5</span>
                          </div>
                        )}
                        <Button 
                          onClick={() => viewResource(progress.resource_id)}
                          variant="outline"
                          className="w-full"
                        >
                          View Again
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No progress yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start exploring resources to track your learning journey.
                </p>
                <Button onClick={() => setSearchQuery('')}>
                  Explore Resources
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}