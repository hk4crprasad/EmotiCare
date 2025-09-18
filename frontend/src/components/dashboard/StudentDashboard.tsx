import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  MessageCircle, 
  Calendar, 
  BookOpen, 
  Users, 
  Brain, 
  Activity,
  Clock,
  TrendingUp
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

interface DashboardData {
  recentAssessments: any[];
  upcomingAppointments: any[];
  recommendedResources: any[];
  chatSessions: any[];
}

export function StudentDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    recentAssessments: [],
    upcomingAppointments: [],
    recommendedResources: [],
    chatSessions: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [assessments, appointments, resources, sessions] = await Promise.all([
        api.getUserAssessments(),
        api.getMyAppointments(),
        api.getRecommendedResources(),
        api.getChatSessions()
      ]);

      setData({
        recentAssessments: assessments.slice(0, 3),
        upcomingAppointments: appointments.filter((apt: any) => apt.status === 'scheduled').slice(0, 3),
        recommendedResources: resources.slice(0, 4),
        chatSessions: sessions.slice(0, 3)
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWellnessScore = () => {
    if (data.recentAssessments.length === 0) return 0;
    const latestAssessment = data.recentAssessments[0];
    // Simple wellness score calculation (inverse of assessment score)
    return Math.max(0, 100 - (latestAssessment.score * 5));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1>Welcome back, {user?.full_name}</h1>
        <p className="text-muted-foreground">
          Here's your mental wellness overview for today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Wellness Score</p>
                <p className="text-2xl font-semibold">{getWellnessScore()}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Chat Sessions</p>
                <p className="text-2xl font-semibold">{data.chatSessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Assessments</p>
                <p className="text-2xl font-semibold">{data.recentAssessments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Next Appointment</p>
                <p className="text-2xl font-semibold">
                  {data.upcomingAppointments.length > 0 ? 'Soon' : 'None'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Start your mental wellness journey
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => onNavigate('chat')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Start AI Chat Session
                </Button>
                <Button 
                  onClick={() => onNavigate('assessments')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Take Mental Health Assessment
                </Button>
                <Button 
                  onClick={() => onNavigate('appointments')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Book Counselor Appointment
                </Button>
                <Button 
                  onClick={() => onNavigate('peer-support')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Join Peer Support
                </Button>
              </CardContent>
            </Card>

            {/* Recent Chat Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Chat Sessions</CardTitle>
                <CardDescription>
                  Your latest AI support conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.chatSessions.length > 0 ? (
                  <div className="space-y-3">
                    {data.chatSessions.map((session: any) => (
                      <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">
                            {session.emotional_state || 'General Support'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.message_count} messages
                          </p>
                        </div>
                        <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                          {session.status}
                        </Badge>
                      </div>
                    ))}
                    <Button 
                      onClick={() => onNavigate('chat')} 
                      variant="outline" 
                      className="w-full"
                    >
                      View All Sessions
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">
                      No chat sessions yet. Start one to get support!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>
                  Your scheduled counselor sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.upcomingAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {data.upcomingAppointments.map((appointment: any) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{appointment.counselor_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {appointment.appointment_date} at {appointment.start_time}
                          </p>
                        </div>
                        <Badge>{appointment.appointment_type}</Badge>
                      </div>
                    ))}
                    <Button 
                      onClick={() => onNavigate('appointments')} 
                      variant="outline" 
                      className="w-full"
                    >
                      Manage Appointments
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">
                      No upcoming appointments. Book one with a counselor!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommended Resources */}
            <Card>
              <CardHeader>
                <CardTitle>Recommended Resources</CardTitle>
                <CardDescription>
                  Personalized content for your wellness journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.recommendedResources.length > 0 ? (
                  <div className="space-y-3">
                    {data.recommendedResources.map((resource: any) => (
                      <div key={resource.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{resource.title}</p>
                          <p className="text-xs text-muted-foreground">{resource.type}</p>
                        </div>
                        <Badge variant="outline">{resource.category}</Badge>
                      </div>
                    ))}
                    <Button 
                      onClick={() => onNavigate('resources')} 
                      variant="outline" 
                      className="w-full"
                    >
                      Explore All Resources
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">
                      No recommendations yet. Complete an assessment to get personalized resources!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Wellness Progress</CardTitle>
              <CardDescription>
                Track your mental health journey over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Wellness Score</span>
                    <span>{getWellnessScore()}%</span>
                  </div>
                  <Progress value={getWellnessScore()} className="h-2" />
                </div>
                
                {data.recentAssessments.length > 0 && (
                  <div>
                    <h4 className="mb-3">Recent Assessment Results</h4>
                    <div className="space-y-3">
                      {data.recentAssessments.map((assessment: any) => (
                        <div key={assessment.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="text-sm font-medium">{assessment.assessment_type}</p>
                            <p className="text-xs text-muted-foreground">{assessment.interpretation}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">Score: {assessment.score}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(assessment.completed_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recommendedResources.map((resource: any) => (
              <Card key={resource.id}>
                <CardHeader>
                  <CardTitle className="text-base">{resource.title}</CardTitle>
                  <CardDescription>{resource.type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">{resource.category}</Badge>
                    <Button size="sm" onClick={() => onNavigate('resources')}>
                      View
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