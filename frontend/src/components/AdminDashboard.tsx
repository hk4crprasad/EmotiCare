import React, { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  MessageCircle, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  Download,
  Eye,
  Filter,
  BookOpen
} from 'lucide-react';

// Mock data for analytics
const usageData = [
  { month: 'Jan', sessions: 120, newUsers: 45, crisisInterventions: 8 },
  { month: 'Feb', sessions: 150, newUsers: 52, crisisInterventions: 12 },
  { month: 'Mar', sessions: 180, newUsers: 68, crisisInterventions: 15 },
  { month: 'Apr', sessions: 200, newUsers: 75, crisisInterventions: 10 },
  { month: 'May', sessions: 240, newUsers: 85, crisisInterventions: 18 },
  { month: 'Jun', sessions: 280, newUsers: 95, crisisInterventions: 22 }
];

const mentalHealthTrends = [
  { category: 'Anxiety', count: 145, percentage: 35 },
  { category: 'Depression', count: 98, percentage: 24 },
  { category: 'Academic Stress', count: 87, percentage: 21 },
  { category: 'Sleep Issues', count: 52, percentage: 13 },
  { category: 'Social Isolation', count: 28, percentage: 7 }
];

const dailyActivity = [
  { hour: '6AM', interactions: 5 },
  { hour: '8AM', interactions: 12 },
  { hour: '10AM', interactions: 25 },
  { hour: '12PM', interactions: 35 },
  { hour: '2PM', interactions: 40 },
  { hour: '4PM', interactions: 38 },
  { hour: '6PM', interactions: 45 },
  { hour: '8PM', interactions: 50 },
  { hour: '10PM', interactions: 42 },
  { hour: '12AM', interactions: 28 }
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

interface Alert {
  id: string;
  type: 'crisis' | 'high-usage' | 'system' | 'trend';
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'crisis',
    message: 'Crisis intervention triggered - Student ID: ANON_001',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    severity: 'critical',
    resolved: false
  },
  {
    id: '2',
    type: 'trend',
    message: 'Significant increase in anxiety-related queries (40% above average)',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    severity: 'high',
    resolved: false
  },
  {
    id: '3',
    type: 'high-usage',
    message: 'Peak usage detected - Consider additional counselor availability',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    severity: 'medium',
    resolved: true
  }
];

export function AdminDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('6months');
  const [alerts, setAlerts] = useState(mockAlerts);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const markAlertResolved = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  const unresolvedAlerts = alerts.filter(alert => !alert.resolved);

  return (
    <div className="min-h-screen max-w-7xl mx-auto p-3 sm:p-4 lg:p-8 xl:p-12">
      <div className="mb-4 sm:mb-6 lg:mb-10 xl:mb-12">
        <h1 className="text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-bold mb-2 lg:mb-4 xl:mb-6 text-gray-900">Mental Health Analytics Dashboard</h1>
        <p className="text-sm sm:text-base lg:text-xl xl:text-2xl text-gray-600 leading-relaxed max-w-4xl">
          Monitor platform usage, identify trends, and track intervention outcomes to improve student mental health support.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 xl:gap-10 mb-6 sm:mb-8 lg:mb-12 xl:mb-16">
        <Card className="p-4 sm:p-6 lg:p-8 xl:p-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-gray-600">Total Users</p>
              <p className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-bold">1,247</p>
              <p className="text-xs sm:text-sm lg:text-base text-green-600">↑ 12% this month</p>
            </div>
            <Users className="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 xl:h-16 xl:w-16 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 sm:p-6 lg:p-8 xl:p-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-gray-600">Active Sessions</p>
              <p className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-bold">280</p>
              <p className="text-xs sm:text-sm lg:text-base text-green-600">↑ 8% this week</p>
            </div>
            <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 xl:h-16 xl:w-16 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 sm:p-6 lg:p-8 xl:p-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-gray-600">Appointments</p>
              <p className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-bold">156</p>
              <p className="text-xs sm:text-sm lg:text-base text-blue-600">32 this week</p>
            </div>
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 xl:h-16 xl:w-16 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4 sm:p-6 lg:p-8 xl:p-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-gray-600">Crisis Alerts</p>
              <p className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-bold text-red-600">3</p>
              <p className="text-xs sm:text-sm lg:text-base text-red-600">Requires attention</p>
            </div>
            <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 xl:h-16 xl:w-16 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Alerts Section */}
      {unresolvedAlerts.length > 0 && (
        <Card className="p-4 sm:p-6 mb-6 sm:mb-8 border-red-200 bg-red-50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-medium text-red-800">Active Alerts</h2>
            <Badge className="bg-red-100 text-red-800 text-xs">
              {unresolvedAlerts.length} unresolved
            </Badge>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {unresolvedAlerts.map(alert => (
              <div key={alert.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-white rounded-lg border space-y-2 sm:space-y-0">
                <div className="flex-1 w-full sm:w-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                    <Badge className={getSeverityColor(alert.severity) + ' text-xs'}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{alert.message}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => markAlertResolved(alert.id)}
                  className="w-full sm:w-auto text-xs"
                >
                  Resolve
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Tabs defaultValue="overview" className="mb-4 sm:mb-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="trends" className="text-xs sm:text-sm">Trends</TabsTrigger>
          <TabsTrigger value="usage" className="text-xs sm:text-sm">Usage</TabsTrigger>
          <TabsTrigger value="interventions" className="text-xs sm:text-sm">Interventions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 sm:mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-medium">Platform Usage Trends</h3>
                <select 
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="px-3 py-1 border rounded-md text-xs sm:text-sm bg-background w-full sm:w-auto"
                >
                  <option value="1month">Last Month</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={250} className="sm:h-80">
                <LineChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="sessions" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="newUsers" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium mb-4">Mental Health Categories</h3>
              <ResponsiveContainer width="100%" height={250} className="sm:h-80">
                <PieChart>
                  <Pie
                    data={mentalHealthTrends}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                    outerRadius={window.innerWidth < 640 ? 60 : 80}
                    fill="#8884d8"
                    dataKey="count"
                    fontSize={12}
                  >
                    {mentalHealthTrends.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="p-4 sm:p-6 mt-4 sm:mt-6">
            <h3 className="text-base sm:text-lg font-medium mb-4">Daily Activity Pattern</h3>
            <ResponsiveContainer width="100%" height={250} className="sm:h-80">
              <BarChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="interactions" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-4 sm:mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium mb-4">Weekly Trend Analysis</h3>
              <div className="space-y-3 sm:space-y-4">
                {mentalHealthTrends.map((trend) => (
                  <div key={trend.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-sm sm:text-base">{trend.category}</span>
                      <div className="text-xs sm:text-sm text-gray-600">{trend.count} reports this week</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-medium">{trend.percentage}%</div>
                      <div className="text-sm text-green-600">↑ 5%</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Risk Assessment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span>High Risk Students</span>
                  <Badge className="bg-red-100 text-red-800">12</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span>Medium Risk Students</span>
                  <Badge className="bg-yellow-100 text-yellow-800">45</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span>Low Risk Students</span>
                  <Badge className="bg-green-100 text-green-800">189</Badge>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Feature Usage</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">AI Chat Support</span>
                  <span className="font-medium">75%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Appointment Booking</span>
                  <span className="font-medium">45%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Resource Hub</span>
                  <span className="font-medium">60%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Peer Support Forum</span>
                  <span className="font-medium">35%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-600 h-2 rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">User Demographics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">First Year</span>
                    <span className="font-medium">40%</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Second Year</span>
                    <span className="font-medium">25%</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Third Year</span>
                    <span className="font-medium">20%</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Final Year</span>
                    <span className="font-medium">15%</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Language Usage</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">English</span>
                  <span className="font-medium">65%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Hindi</span>
                  <span className="font-medium">20%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Spanish</span>
                  <span className="font-medium">10%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Others</span>
                  <span className="font-medium">5%</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="interventions" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Crisis Intervention Outcomes</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">18</div>
                    <div className="text-sm text-gray-600">Successful</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">5</div>
                    <div className="text-sm text-gray-600">Follow-up</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">12</div>
                    <div className="text-sm text-gray-600">Referred</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Response Times</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Crisis Response</span>
                  <span className="font-medium">&lt; 2 min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">AI Chat Response</span>
                  <span className="font-medium">&lt; 5 sec</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Counselor Response</span>
                  <span className="font-medium">&lt; 2 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Appointment Booking</span>
                  <span className="font-medium">&lt; 1 min</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Export and Actions */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Data Export & Actions</h3>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View Detailed Logs
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Custom Filter
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}