import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Brain, 
  Heart, 
  Activity, 
  TrendingUp, 
  Target,
  Calendar,
  Award,
  Zap,
  BookOpen,
  Users,
  MessageCircle,
  Star,
  ArrowRight,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';

interface DashboardStats {
  totalAssessments: number;
  latestScores: {
    phq9?: number;
    gad7?: number;
    stress_scale?: number;
  };
  improvements: {
    depression: 'improving' | 'stable' | 'worsening';
    anxiety: 'improving' | 'stable' | 'worsening';
    stress: 'improving' | 'stable' | 'worsening';
  };
  streakDays: number;
  resourcesCompleted: number;
  chatSessions: number;
}

interface MotivationalResource {
  id: string;
  type: 'quote' | 'tip' | 'exercise' | 'achievement';
  title: string;
  content: string;
  icon: any;
  color: string;
  actionText?: string;
  actionUrl?: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [motivationalResources, setMotivationalResources] = useState<MotivationalResource[]>([]);

  useEffect(() => {
    loadDashboardData();
    loadMotivationalResources();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load assessment data
      const assessmentData = await apiService.getUserAssessments();
      setAssessments(assessmentData);
      
      // Calculate dashboard stats
      const dashboardStats = calculateDashboardStats(assessmentData);
      setStats(dashboardStats);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateDashboardStats = (assessmentData: any[]): DashboardStats => {
    const totalAssessments = assessmentData.length;
    
    // Get latest scores for each assessment type
    const latestScores: any = {};
    const assessmentTypes = ['phq9', 'gad7', 'stress_scale'];
    
    assessmentTypes.forEach(type => {
      const typeAssessments = assessmentData
        .filter(a => a.assessment_type === type)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      if (typeAssessments.length > 0) {
        latestScores[type] = typeAssessments[0].result.score;
      }
    });

    // Calculate improvement trends
    const improvements: any = {};
    assessmentTypes.forEach(type => {
      const typeAssessments = assessmentData
        .filter(a => a.assessment_type === type)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 2);
      
      if (typeAssessments.length >= 2) {
        const latest = typeAssessments[0].result.score;
        const previous = typeAssessments[1].result.score;
        
        if (latest < previous) {
          improvements[type] = 'improving';
        } else if (latest > previous) {
          improvements[type] = 'worsening';
        } else {
          improvements[type] = 'stable';
        }
      } else {
        improvements[type] = 'stable';
      }
    });

    // Calculate streak (days with activity)
    const streakDays = calculateStreakDays(assessmentData);

    return {
      totalAssessments,
      latestScores,
      improvements: {
        depression: improvements.phq9 || 'stable',
        anxiety: improvements.gad7 || 'stable',
        stress: improvements.stress_scale || 'stable'
      },
      streakDays,
      resourcesCompleted: Math.floor(totalAssessments * 2.5), // Mock data
      chatSessions: Math.floor(totalAssessments * 1.8) // Mock data
    };
  };

  const calculateStreakDays = (assessmentData: any[]): number => {
    if (assessmentData.length === 0) return 0;
    
    const dates = assessmentData
      .map(a => new Date(a.created_at).toDateString())
      .filter((date, index, array) => array.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let streak = 0;
    let currentDate = new Date();
    
    for (const dateStr of dates) {
      const assessmentDate = new Date(dateStr);
      const diffDays = Math.floor((currentDate.getTime() - assessmentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
        currentDate = assessmentDate;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const loadMotivationalResources = () => {
    const resources: MotivationalResource[] = [
      {
        id: '1',
        type: 'quote',
        title: 'Daily Inspiration',
        content: 'Progress, not perfection. Every small step forward is a victory worth celebrating.',
        icon: Star,
        color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
      },
      {
        id: '2',
        type: 'tip',
        title: 'Wellness Tip',
        content: 'Take 5 deep breaths when feeling overwhelmed. This simple technique can help reset your nervous system.',
        icon: Heart,
        color: 'bg-pink-50 border-pink-200 text-pink-800',
        actionText: 'Try Now',
        actionUrl: '/resources'
      },
      {
        id: '3',
        type: 'exercise',
        title: 'Quick Exercise',
        content: '3-Minute Gratitude Practice: Write down 3 things you are grateful for today.',
        icon: BookOpen,
        color: 'bg-blue-50 border-blue-200 text-blue-800',
        actionText: 'Start Exercise',
        actionUrl: '/resources'
      },
      {
        id: '4',
        type: 'achievement',
        title: 'Your Progress',
        content: `You have completed ${stats?.totalAssessments || 0} assessments! Keep up the great work.`,
        icon: Award,
        color: 'bg-green-50 border-green-200 text-green-800'
      }
    ];
    
    setMotivationalResources(resources);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'minimal': return 'text-green-600';
      case 'mild': return 'text-yellow-600';
      case 'moderate': return 'text-orange-600';
      case 'moderately_severe': return 'text-red-600';
      case 'severe': return 'text-red-700';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '↓';
      case 'worsening': return '↑';
      default: return '→';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'worsening': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Wellness Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your mental health journey and celebrate your progress</p>
        </div>
        <Button className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Take Assessment
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assessments</p>
                <p className="text-2xl font-bold">{stats?.totalAssessments || 0}</p>
              </div>
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold">{stats?.streakDays || 0} days</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resources Used</p>
                <p className="text-2xl font-bold">{stats?.resourcesCompleted || 0}</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chat Sessions</p>
                <p className="text-2xl font-bold">{stats?.chatSessions || 0}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Assessment Scores</TabsTrigger>
          <TabsTrigger value="motivation">Daily Motivation</TabsTrigger>
          <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Latest Assessment Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Latest Assessment Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Depression (PHQ-9)</span>
                    <span className={getTrendColor(stats?.improvements.depression || 'stable')}>
                      {getTrendIcon(stats?.improvements.depression || 'stable')}
                    </span>
                  </div>
                  <div className="text-2xl font-bold">{stats?.latestScores.phq9 ?? 'N/A'}</div>
                  <Progress value={stats?.latestScores.phq9 ? (stats.latestScores.phq9 / 27) * 100 : 0} />
                  <p className="text-xs text-gray-500">
                    {stats?.improvements.depression === 'improving' ? 'Improving' : 
                     stats?.improvements.depression === 'worsening' ? 'Needs attention' : 'Stable'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Anxiety (GAD-7)</span>
                    <span className={getTrendColor(stats?.improvements.anxiety || 'stable')}>
                      {getTrendIcon(stats?.improvements.anxiety || 'stable')}
                    </span>
                  </div>
                  <div className="text-2xl font-bold">{stats?.latestScores.gad7 ?? 'N/A'}</div>
                  <Progress value={stats?.latestScores.gad7 ? (stats.latestScores.gad7 / 21) * 100 : 0} />
                  <p className="text-xs text-gray-500">
                    {stats?.improvements.anxiety === 'improving' ? 'Improving' : 
                     stats?.improvements.anxiety === 'worsening' ? 'Needs attention' : 'Stable'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Stress Level</span>
                    <span className={getTrendColor(stats?.improvements.stress || 'stable')}>
                      {getTrendIcon(stats?.improvements.stress || 'stable')}
                    </span>
                  </div>
                  <div className="text-2xl font-bold">{stats?.latestScores.stress_scale ?? 'N/A'}</div>
                  <Progress value={stats?.latestScores.stress_scale ? (stats.latestScores.stress_scale / 21) * 100 : 0} />
                  <p className="text-xs text-gray-500">
                    {stats?.improvements.stress === 'improving' ? 'Improving' : 
                     stats?.improvements.stress === 'worsening' ? 'Needs attention' : 'Stable'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto p-4 flex items-center gap-3">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Take Assessment</div>
                    <div className="text-sm text-gray-500">Monitor your progress</div>
                  </div>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">Chat Support</div>
                    <div className="text-sm text-gray-500">Get immediate help</div>
                  </div>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  <div className="text-left">
                    <div className="font-medium">Explore Resources</div>
                    <div className="text-sm text-gray-500">Learn new techniques</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment History & Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-500 mb-2">No assessments yet</h3>
                  <p className="text-gray-400 mb-4">Take your first assessment to start tracking your mental health.</p>
                  <Button>Take Assessment</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {assessments.slice(0, 5).map((assessment, index) => (
                    <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Brain className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{assessment.assessment_type.toUpperCase()}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(assessment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">{assessment.result.score}</div>
                        <Badge variant="outline" className={getSeverityColor(assessment.result.severity_level)}>
                          {assessment.result.severity_level}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="motivation" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {motivationalResources.map((resource) => {
              const Icon = resource.icon;
              return (
                <Card key={resource.id} className={`border-2 ${resource.color}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-white/50 rounded-lg">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{resource.title}</h3>
                        <p className="text-sm mb-4 leading-relaxed">{resource.content}</p>
                        {resource.actionText && (
                          <Button size="sm" variant="outline" className="flex items-center gap-2">
                            {resource.actionText}
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Your Wellness Journey
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Achievements</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">First Assessment</p>
                        <p className="text-sm text-gray-600">Completed your first mental health screening</p>
                      </div>
                    </div>
                    
                    {(stats?.streakDays || 0) >= 3 && (
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                        <Award className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="font-medium">3-Day Streak</p>
                          <p className="text-sm text-gray-600">Consistent engagement with your wellness</p>
                        </div>
                      </div>
                    )}
                    
                    {(stats?.totalAssessments || 0) >= 5 && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <Star className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Assessment Champion</p>
                          <p className="text-sm text-gray-600">Completed 5+ assessments</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Goals</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Weekly Assessment</span>
                        <span className="text-sm text-gray-500">1/1</span>
                      </div>
                      <Progress value={100} />
                    </div>
                    
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Try 3 Resources</span>
                        <span className="text-sm text-gray-500">2/3</span>
                      </div>
                      <Progress value={67} />
                    </div>
                    
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Join Peer Discussion</span>
                        <span className="text-sm text-gray-500">0/1</span>
                      </div>
                      <Progress value={0} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;