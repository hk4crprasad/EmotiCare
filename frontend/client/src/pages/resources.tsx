import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { 
  BookOpen, 
  Search, 
  Star, 
  Clock, 
  Play, 
  FileText, 
  Activity,
  Filter,
  Eye,
  Heart,
  CheckCircle
} from "lucide-react";

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Get resources
  const { data: resources = [] } = useQuery({
    queryKey: ['/api/v1/resources/', selectedCategory !== 'all' ? selectedCategory : undefined, selectedType !== 'all' ? selectedType : undefined],
    queryFn: () => api.getResources(
      selectedCategory !== 'all' ? selectedCategory : undefined,
      selectedType !== 'all' ? selectedType : undefined
    ),
  });

  // Get resource categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/v1/resources/categories'],
    queryFn: api.getResourceCategories,
  });

  // Get resource types
  const { data: types = [] } = useQuery({
    queryKey: ['/api/v1/resources/types'],
    queryFn: api.getResourceTypes,
  });

  // Get recommended resources
  const { data: recommended = [] } = useQuery({
    queryKey: ['/api/v1/resources/recommended'],
    queryFn: api.getRecommendedResources,
  });

  // Search resources
  const { data: searchResults = [] } = useQuery({
    queryKey: ['/api/v1/resources/search', searchQuery, selectedCategory],
    queryFn: () => api.searchResources(searchQuery, selectedCategory !== 'all' ? selectedCategory : undefined),
    enabled: searchQuery.length > 0,
  });

  const displayedResources = searchQuery ? searchResults : resources;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="w-5 h-5" />;
      case 'video':
        return <Play className="w-5 h-5" />;
      case 'exercise':
        return <Activity className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'article':
        return 'bg-primary/10 text-primary';
      case 'video':
        return 'bg-accent/10 text-accent';
      case 'exercise':
        return 'bg-secondary/10 text-secondary';
      default:
        return 'bg-muted/10 text-muted-foreground';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'stress_management': 'bg-blue-100 text-blue-800',
      'anxiety': 'bg-orange-100 text-orange-800',
      'depression': 'bg-purple-100 text-purple-800',
      'sleep': 'bg-green-100 text-green-800',
      'relationships': 'bg-pink-100 text-pink-800',
      'academic_pressure': 'bg-yellow-100 text-yellow-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getEstimatedTime = (type: string, content?: string) => {
    if (type === 'video') return '5-10 min';
    if (type === 'exercise') return '10-15 min';
    if (type === 'article') return '3-5 min read';
    return '5 min';
  };

  return (
    <div className="p-6 space-y-8" data-testid="page-resources">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Mental Health Resources</h1>
        <p className="text-muted-foreground">
          Explore curated articles, videos, and exercises to support your mental wellbeing journey.
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-resources"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-card-foreground">Category</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                    data-testid="filter-category-all"
                  >
                    All Categories
                  </Button>
                  {categories.map((category: any) => (
                    <Button
                      key={category.name}
                      variant={selectedCategory === category.name ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category.name)}
                      data-testid={`filter-category-${category.name}`}
                    >
                      {category.display_name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-card-foreground">Type</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedType === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType('all')}
                    data-testid="filter-type-all"
                  >
                    All Types
                  </Button>
                  {types.map((type: any) => (
                    <Button
                      key={type.name}
                      variant={selectedType === type.name ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedType(type.name)}
                      data-testid={`filter-type-${type.name}`}
                    >
                      {type.display_name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Resources */}
      {recommended.length > 0 && !searchQuery && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="w-5 h-5 mr-2 text-primary" />
              Recommended for You
            </CardTitle>
            <CardDescription>Personalized resources based on your activity and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommended.slice(0, 3).map((resource: any) => (
                <Card key={resource.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Badge className={getTypeColor(resource.type)}>
                        {getTypeIcon(resource.type)}
                        <span className="ml-1 capitalize">{resource.type}</span>
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-accent fill-current" />
                        <span className="text-sm font-medium">{resource.rating}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <h4 className="font-semibold text-card-foreground mb-2 line-clamp-2">
                      {resource.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {resource.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{getEstimatedTime(resource.type, resource.content)}</span>
                      </div>
                      <Button size="sm" data-testid={`button-view-${resource.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resources Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {searchQuery ? `Search Results (${displayedResources.length})` : 'All Resources'}
          </h2>
        </div>

        {displayedResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedResources.map((resource: any) => (
              <Card key={resource.id} className="hover:shadow-md transition-shadow overflow-hidden" data-testid={`resource-${resource.id}`}>
                {/* Resource image placeholder */}
                <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/80 rounded-lg flex items-center justify-center">
                    {getTypeIcon(resource.type)}
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge className={getTypeColor(resource.type)}>
                      {resource.type}
                    </Badge>
                    {resource.category && (
                      <Badge variant="secondary" className={getCategoryColor(resource.category)}>
                        {resource.category.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-card-foreground mb-2 line-clamp-2">
                    {resource.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {resource.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-accent fill-current" />
                        <span>{resource.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{getEstimatedTime(resource.type, resource.content)}</span>
                      </div>
                    </div>
                    <Button size="sm" data-testid={`button-access-${resource.id}`}>
                      {resource.type === 'video' ? 'Watch' : resource.type === 'exercise' ? 'Start' : 'Read'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              {searchQuery ? 'No resources found' : 'No resources available'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? 'Try adjusting your search terms or filters'
                : 'Resources are being added regularly. Check back soon.'
              }
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')} data-testid="button-clear-search">
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <Card className="bg-chart-2/5 border-chart-2/20">
        <CardHeader>
          <CardTitle className="text-chart-2">💡 Quick Wellness Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-chart-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-card-foreground">Deep Breathing</h4>
                <p className="text-sm text-muted-foreground">Practice 4-7-8 breathing for instant calm</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-chart-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-card-foreground">Mindful Moments</h4>
                <p className="text-sm text-muted-foreground">Take 5 minutes for mindfulness daily</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-chart-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-card-foreground">Stay Connected</h4>
                <p className="text-sm text-muted-foreground">Reach out to friends and family regularly</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
