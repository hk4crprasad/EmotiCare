import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { 
  MessageCircle, 
  ClipboardCheck, 
  Calendar, 
  BookOpen,
  TrendingUp,
  Clock,
  Users,
  Activity
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  // Get recent assessments
  const { data: assessments = [] } = useQuery({
    queryKey: ['/api/v1/assessments/'],
    queryFn: api.getAssessments,
  });

  // Get upcoming appointments
  const { data: appointments = [] } = useQuery({
    queryKey: ['/api/v1/appointments/my-appointments'],
    queryFn: api.getMyAppointments,
  });

  // Get chat sessions
  const { data: chatSessions = [] } = useQuery({
    queryKey: ['/api/v1/chat/sessions'],
    queryFn: api.getChatSessions,
  });

  const recentAssessments = assessments.slice(0, 3);
  const upcomingAppointments = appointments.filter((apt: any) => apt.status === 'scheduled').slice(0, 2);

  const stats = [
    {
      title: "Chat Sessions",
      value: chatSessions.length,
      description: "This month",
      icon: MessageCircle,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Assessments",
      value: assessments.length,
      description: "Completed",
      icon: ClipboardCheck,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Appointments",
      value: upcomingAppointments.length,
      description: "Upcoming",
      icon: Calendar,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Wellness Score",
      value: "Good",
      description: "Based on recent activity",
      icon: TrendingUp,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
  ];

  const quickActions = [
    {
      title: "Start AI Chat",
      description: "Get immediate mental health support",
      icon: MessageCircle,
      href: "/chat",
      color: "primary",
    },
    {
      title: "Take Assessment",
      description: "Check your mental health status",
      icon: ClipboardCheck,
      href: "/assessments",
      color: "secondary",
    },
    {
      title: "Book Appointment",
      description: "Schedule time with a counselor",
      icon: Calendar,
      href: "/appointments",
      color: "accent",
    },
    {
      title: "Browse Resources",
      description: "Access articles, videos, and exercises",
      icon: BookOpen,
      href: "/resources",
      color: "chart-2",
    },
  ];

  return (
    <div className="p-6 space-y-8" data-testid="page-dashboard">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-welcome">
          Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}
        </h1>
        <p className="text-muted-foreground">
          How are you feeling today? We're here to support you on your mental wellness journey.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow" data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2">{stat.title}</h3>
                <p className="text-3xl font-bold text-card-foreground mb-1" data-testid={`stat-value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.value}
                </p>
                <p className="text-muted-foreground text-sm">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Start your mental wellness activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.title} href={action.href}>
                      <Button
                        variant="outline"
                        className="h-auto p-4 justify-start text-left hover:bg-muted/50 w-full"
                        data-testid={`button-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-${action.color}/10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-5 h-5 text-${action.color}`} />
                          </div>
                          <div>
                            <p className="font-medium text-card-foreground">{action.title}</p>
                            <p className="text-muted-foreground text-sm">{action.description}</p>
                          </div>
                        </div>
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAssessments.length > 0 ? (
                  recentAssessments.map((assessment: any) => (
                    <div key={assessment.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors" data-testid={`activity-assessment-${assessment.id}`}>
                      <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <ClipboardCheck className="w-5 h-5 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-card-foreground font-medium">
                          {assessment.assessment_type === 'depression_phq9' ? 'PHQ-9 Assessment' : 'GAD-7 Assessment'}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Score: {assessment.score} ({assessment.interpretation})
                        </p>
                        <p className="text-muted-foreground text-xs mt-1">
                          {new Date(assessment.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent activity</p>
                    <p className="text-sm text-muted-foreground">Start by taking an assessment or chatting with our AI assistant</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((appointment: any) => (
                    <div key={appointment.id} className="p-3 bg-accent/10 rounded-lg" data-testid={`appointment-${appointment.id}`}>
                      <p className="font-medium text-card-foreground">{appointment.counselor_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.start_time}
                      </p>
                      <p className="text-sm text-muted-foreground">{appointment.mode}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No upcoming appointments</p>
                    <Link href="/appointments">
                      <Button variant="outline" size="sm" className="mt-2" data-testid="button-book-appointment">
                        Book Appointment
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Wellness Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Wellness Tip</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 bg-chart-2/10 rounded-lg">
                  <h4 className="font-medium text-card-foreground mb-2">Practice Deep Breathing</h4>
                  <p className="text-sm text-muted-foreground">
                    Take 5 minutes to practice deep breathing. Inhale for 4 counts, hold for 4, exhale for 6. This can help reduce anxiety and promote calm.
                  </p>
                </div>
                <Link href="/resources">
                  <Button variant="outline" size="sm" className="w-full" data-testid="button-view-resources">
                    View More Resources
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
