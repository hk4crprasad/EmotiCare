import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Brain, 
  Heart, 
  Activity, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  BookOpen,
  Target,
  BarChart
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';

interface AssessmentResult {
  score: number;
  severity_level: string;
  interpretation: string;
  recommendations: string[];
  risk_level: string;
  requires_immediate_attention: boolean;
}

interface Assessment {
  id: string;
  user_id: string;
  assessment_type: string;
  responses: Record<string, any>;
  result: AssessmentResult;
  notes?: string;
  created_at: string;
  administered_by?: string;
}

const assessmentTypes = [
  {
    type: 'phq9',
    name: 'PHQ-9 Depression Scale',
    description: 'Assesses depression severity over the past 2 weeks',
    icon: Brain,
    duration: '5-7 minutes',
    questions: [
      { key: 'little_interest', text: 'Little interest or pleasure in doing things' },
      { key: 'feeling_down', text: 'Feeling down, depressed, or hopeless' },
      { key: 'trouble_sleeping', text: 'Trouble falling or staying asleep, or sleeping too much' },
      { key: 'feeling_tired', text: 'Feeling tired or having little energy' },
      { key: 'poor_appetite', text: 'Poor appetite or overeating' },
      { key: 'feeling_bad', text: 'Feeling bad about yourself or that you are a failure or have let yourself or your family down' },
      { key: 'trouble_concentrating', text: 'Trouble concentrating on things, such as reading the newspaper or watching television' },
      { key: 'moving_slowly', text: 'Moving or speaking so slowly that other people could have noticed, or the opposite - being so fidgety or restless that you have been moving around a lot more than usual' },
      { key: 'thoughts_death', text: 'Thoughts that you would be better off dead, or of hurting yourself' }
    ]
  },
  {
    type: 'gad7',
    name: 'GAD-7 Anxiety Scale',
    description: 'Measures anxiety symptoms over the past 2 weeks',
    icon: Heart,
    duration: '3-5 minutes',
    questions: [
      { key: 'feeling_nervous', text: 'Feeling nervous, anxious, or on edge' },
      { key: 'not_able_stop_worry', text: 'Not being able to stop or control worrying' },
      { key: 'worrying_too_much', text: 'Worrying too much about different things' },
      { key: 'trouble_relaxing', text: 'Trouble relaxing' },
      { key: 'restless', text: 'Being so restless that it is hard to sit still' },
      { key: 'easily_annoyed', text: 'Becoming easily annoyed or irritable' },
      { key: 'feeling_afraid', text: 'Feeling afraid, as if something awful might happen' }
    ]
  },
  {
    type: 'stress_scale',
    name: 'Stress Assessment',
    description: 'Evaluates current stress levels and coping mechanisms',
    icon: Activity,
    duration: '4-6 minutes',
    questions: [
      { key: 'work_pressure', text: 'How often do you feel overwhelmed by work or academic pressure?' },
      { key: 'time_management', text: 'How often do you feel you have too much to do and not enough time?' },
      { key: 'financial_stress', text: 'How often do you worry about financial matters?' },
      { key: 'relationship_stress', text: 'How often do you experience stress in relationships?' },
      { key: 'physical_symptoms', text: 'How often do you experience physical symptoms of stress (headaches, muscle tension, etc.)?' },
      { key: 'sleep_disruption', text: 'How often does stress interfere with your sleep?' },
      { key: 'coping_difficulty', text: 'How often do you feel unable to cope with stress?' }
    ]
  }
];

const responseOptions = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' }
];

const Assessment: React.FC = () => {
  const [currentView, setCurrentView] = useState<'overview' | 'take' | 'results' | 'history'>('overview');
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [recentResult, setRecentResult] = useState<Assessment | null>(null);

  useEffect(() => {
    loadAssessmentHistory();
  }, []);

  const loadAssessmentHistory = async () => {
    try {
      setLoading(true);
      const data = await apiService.getUserAssessments();
      setAssessments(data);
    } catch (error) {
      console.error('Failed to load assessments:', error);
      toast.error('Failed to load assessment history');
    } finally {
      setLoading(false);
    }
  };

  const startAssessment = (assessmentType: any) => {
    setSelectedAssessment(assessmentType);
    setResponses({});
    setCurrentQuestion(0);
    setNotes('');
    setCurrentView('take');
  };

  const handleResponse = (questionKey: string, value: number) => {
    setResponses(prev => ({ ...prev, [questionKey]: value }));
  };

  const nextQuestion = () => {
    if (currentQuestion < selectedAssessment.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const submitAssessment = async () => {
    try {
      setLoading(true);
      const result = await apiService.createAssessment(
        selectedAssessment.type,
        responses,
        notes
      );
      
      setRecentResult(result);
      setCurrentView('results');
      toast.success('Assessment completed successfully!');
      await loadAssessmentHistory();
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      toast.error('Failed to submit assessment');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'minimal': return 'bg-green-100 text-green-800';
      case 'mild': return 'bg-yellow-100 text-yellow-800';
      case 'moderate': return 'bg-orange-100 text-orange-800';
      case 'moderately_severe': return 'bg-red-100 text-red-800';
      case 'severe': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isAssessmentComplete = () => {
    return selectedAssessment && 
           selectedAssessment.questions.every((q: any) => 
             responses.hasOwnProperty(q.key) && responses[q.key] !== undefined
           );
  };

  const currentQuestionResponse = selectedAssessment?.questions[currentQuestion]?.key;
  const progress = selectedAssessment ? ((currentQuestion + 1) / selectedAssessment.questions.length) * 100 : 0;

  if (currentView === 'overview') {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mental Health Assessments</h1>
            <p className="text-gray-600 mt-2">
              Track your mental health with evidence-based screening tools
            </p>
          </div>
          <Button 
            onClick={() => setCurrentView('history')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <BarChart className="h-4 w-4" />
            View History
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessmentTypes.map((assessment) => {
            const Icon = assessment.icon;
            const recentAssessment = assessments
              .filter(a => a.assessment_type === assessment.type)
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

            return (
              <Card key={assessment.type} className="cursor-pointer transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{assessment.name}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Clock className="h-3 w-3" />
                          {assessment.duration}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-sm">{assessment.description}</p>
                  
                  {recentAssessment && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Last Assessment</span>
                        <Badge className={getSeverityColor(recentAssessment.result.severity_level)}>
                          {recentAssessment.result.severity_level}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(recentAssessment.created_at)}
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Score: {recentAssessment.result.score}</span>
                          <span className={getRiskColor(recentAssessment.result.risk_level)}>
                            {recentAssessment.result.risk_level} risk
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => startAssessment(assessment)}
                    className="w-full"
                  >
                    {recentAssessment ? 'Retake Assessment' : 'Take Assessment'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {assessments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {assessmentTypes.map(type => {
                  const typeAssessments = assessments
                    .filter(a => a.assessment_type === type.type)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 2);

                  if (typeAssessments.length === 0) return null;

                  const latest = typeAssessments[0];
                  const previous = typeAssessments[1];
                  const trend = previous ? 
                    (latest.result.score < previous.result.score ? 'improving' : 
                     latest.result.score > previous.result.score ? 'worsening' : 'stable') : 'stable';

                  return (
                    <div key={type.type} className="p-4 border rounded-lg">
                      <h4 className="font-medium text-sm">{type.name}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-2xl font-bold">{latest.result.score}</span>
                        <Badge className={getSeverityColor(latest.result.severity_level)}>
                          {latest.result.severity_level}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs">
                        <span className={
                          trend === 'improving' ? 'text-green-600' :
                          trend === 'worsening' ? 'text-red-600' : 'text-gray-600'
                        }>
                          {trend === 'improving' && '↓ Improving'}
                          {trend === 'worsening' && '↑ Needs attention'}
                          {trend === 'stable' && '→ Stable'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (currentView === 'take' && selectedAssessment) {
    const question = selectedAssessment.questions[currentQuestion];
    
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedAssessment.name}</CardTitle>
                <p className="text-gray-600 mt-1">
                  Question {currentQuestion + 1} of {selectedAssessment.questions.length}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setCurrentView('overview')}
              >
                Exit
              </Button>
            </div>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-medium mb-4">
                Over the last 2 weeks, how often have you been bothered by:
              </h2>
              <p className="text-lg text-gray-800 mb-6">
                {question.text}
              </p>
            </div>

            <div className="space-y-3">
              {responseOptions.map((option) => (
                <div key={option.value} className="w-full">
                  <Button
                    variant={responses[question.key] === option.value ? "default" : "outline"}
                    className="w-full h-auto p-4 text-left justify-start"
                    onClick={() => handleResponse(question.key, option.value)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        responses[question.key] === option.value 
                          ? 'bg-blue-600 border-blue-600' 
                          : 'border-gray-300'
                      }`}>
                        {responses[question.key] === option.value && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                      <span className="font-medium">{option.label}</span>
                    </div>
                  </Button>
                </div>
              ))}
            </div>

            {currentQuestion === selectedAssessment.questions.length - 1 && (
              <div className="space-y-4">
                <Separator />
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional context you would like to share..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={previousQuestion}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              
              {currentQuestion === selectedAssessment.questions.length - 1 ? (
                <Button 
                  onClick={submitAssessment}
                  disabled={!isAssessmentComplete() || loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Submitting...' : 'Complete Assessment'}
                </Button>
              ) : (
                <Button 
                  onClick={nextQuestion}
                  disabled={responses[question.key] === undefined}
                >
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentView === 'results' && recentResult) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-2xl">Assessment Complete</CardTitle>
              <p className="text-gray-600 mt-2">
                Your {assessmentTypes.find(t => t.type === recentResult.assessment_type)?.name} results
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{recentResult.result.score}</div>
                <div className="text-sm text-gray-600">Total Score</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Badge className={getSeverityColor(recentResult.result.severity_level)}>
                  {recentResult.result.severity_level}
                </Badge>
                <div className="text-sm text-gray-600 mt-2">Severity Level</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-lg font-semibold ${getRiskColor(recentResult.result.risk_level)}`}>
                  {recentResult.result.risk_level.toUpperCase()}
                </div>
                <div className="text-sm text-gray-600">Risk Level</div>
              </div>
            </div>

            {recentResult.result.requires_immediate_attention && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Your assessment indicates you may benefit from immediate professional support. 
                  Please consider speaking with a mental health professional or counselor.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Interpretation
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {recentResult.result.interpretation}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recommendations
              </h3>
              <ul className="space-y-2">
                {recentResult.result.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={() => setCurrentView('overview')} className="flex-1">
                Back to Assessments
              </Button>
              <Button 
                onClick={() => setCurrentView('history')} 
                variant="outline"
                className="flex-1"
              >
                View History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentView === 'history') {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assessment History</h1>
            <p className="text-gray-600 mt-2">
              Track your mental health progress over time
            </p>
          </div>
          <Button 
            onClick={() => setCurrentView('overview')}
            variant="outline"
          >
            Take New Assessment
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Assessments</TabsTrigger>
            <TabsTrigger value="phq9">Depression (PHQ-9)</TabsTrigger>
            <TabsTrigger value="gad7">Anxiety (GAD-7)</TabsTrigger>
            <TabsTrigger value="stress_scale">Stress Scale</TabsTrigger>
          </TabsList>

          {['all', 'phq9', 'gad7', 'stress_scale'].map(tab => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {assessments
                .filter(a => tab === 'all' || a.assessment_type === tab)
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map(assessment => {
                  const assessmentType = assessmentTypes.find(t => t.type === assessment.assessment_type);
                  const Icon = assessmentType?.icon || Brain;
                  
                  return (
                    <Card key={assessment.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Icon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {assessmentType?.name || assessment.assessment_type}
                              </h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(assessment.created_at)}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span>Score: {assessment.result.score}</span>
                                  <Badge className={getSeverityColor(assessment.result.severity_level)}>
                                    {assessment.result.severity_level}
                                  </Badge>
                                </div>
                                <span className={getRiskColor(assessment.result.risk_level)}>
                                  {assessment.result.risk_level} risk
                                </span>
                              </div>
                              
                              {assessment.result.requires_immediate_attention && (
                                <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                                  <AlertTriangle className="h-3 w-3" />
                                  Requires attention
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRecentResult(assessment);
                              setCurrentView('results');
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              
              {assessments.filter(a => tab === 'all' || a.assessment_type === tab).length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-500 mb-2">
                      No assessments yet
                    </h3>
                    <p className="text-gray-400 mb-4">
                      {tab === 'all' 
                        ? 'Take your first assessment to start tracking your mental health.'
                        : `No ${assessmentTypes.find(t => t.type === tab)?.name} assessments found.`
                      }
                    </p>
                    <Button onClick={() => setCurrentView('overview')}>
                      Take Assessment
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    );
  }

  return null;
};

export default Assessment;