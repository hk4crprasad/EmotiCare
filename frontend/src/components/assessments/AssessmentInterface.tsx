import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Brain, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  Heart
} from 'lucide-react';
import { api } from '../../lib/api';

interface Assessment {
  type: string;
  name: string;
  description: string;
}

interface Question {
  id: string;
  text: string;
  options: string[];
}

interface UserAssessment {
  id: string;
  assessment_type: string;
  score: number;
  interpretation: string;
  completed_at: string;
  recommendations?: string[];
}

export function AssessmentInterface() {
  const [availableAssessments, setAvailableAssessments] = useState<Assessment[]>([]);
  const [userAssessments, setUserAssessments] = useState<UserAssessment[]>([]);
  const [currentAssessment, setCurrentAssessment] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<{ [key: string]: number }>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  useEffect(() => {
    loadAvailableAssessments();
    loadUserAssessments();
  }, []);

  const loadAvailableAssessments = async () => {
    try {
      const assessments = await api.getAvailableAssessments();
      setAvailableAssessments(assessments);
    } catch (error) {
      console.error('Error loading assessments:', error);
    }
  };

  const loadUserAssessments = async () => {
    try {
      const assessments = await api.getUserAssessments();
      setUserAssessments(assessments);
    } catch (error) {
      console.error('Error loading user assessments:', error);
    }
  };

  const startAssessment = async (assessmentType: string) => {
    try {
      const questionsData = await api.getAssessmentQuestions(assessmentType);
      setQuestions(questionsData.questions);
      setCurrentAssessment(assessmentType);
      setCurrentQuestion(0);
      setResponses({});
      setShowResults(false);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const submitResponse = (questionId: string, value: number) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      submitAssessment();
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const submitAssessment = async () => {
    if (!currentAssessment) return;

    setIsSubmitting(true);
    try {
      const result = await api.submitAssessment(currentAssessment, responses);
      setLastResult(result);
      setShowResults(true);
      await loadUserAssessments();
    } catch (error) {
      console.error('Error submitting assessment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = (score: number, maxScore: number = 27) => {
    const percentage = (score / maxScore) * 100;
    if (percentage < 30) return 'text-green-600';
    if (percentage < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityBadge = (interpretation: string) => {
    const lower = interpretation.toLowerCase();
    if (lower.includes('minimal') || lower.includes('mild')) {
      return <Badge className="bg-green-100 text-green-800">Mild</Badge>;
    }
    if (lower.includes('moderate')) {
      return <Badge className="bg-yellow-100 text-yellow-800">Moderate</Badge>;
    }
    if (lower.includes('severe')) {
      return <Badge className="bg-red-100 text-red-800">Severe</Badge>;
    }
    return <Badge variant="outline">{interpretation}</Badge>;
  };

  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  if (showResults && lastResult) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Assessment Complete</CardTitle>
            <CardDescription>
              Your {currentAssessment} assessment has been submitted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold" className={getScoreColor(lastResult.score)}>
                {lastResult.score}/27
              </p>
              <p className="text-muted-foreground">Your score</p>
              {getSeverityBadge(lastResult.interpretation)}
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Interpretation</h4>
              <p className="text-sm text-muted-foreground">
                {lastResult.interpretation}
              </p>
            </div>

            {lastResult.recommendations && lastResult.recommendations.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Recommendations</h4>
                <ul className="space-y-2">
                  {lastResult.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <Heart className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  setShowResults(false);
                  setCurrentAssessment(null);
                }}
                className="flex-1"
              >
                Take Another Assessment
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setShowResults(false);
                  setCurrentAssessment(null);
                }}
              >
                View History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentAssessment && questions.length > 0) {
    const question = questions[currentQuestion];
    const hasResponse = responses[question.id] !== undefined;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mental Health Assessment</CardTitle>
                <CardDescription>
                  Question {currentQuestion + 1} of {questions.length}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-lg font-semibold">{Math.round(progress)}%</p>
              </div>
            </div>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">{question.text}</h3>
              <RadioGroup
                value={responses[question.id]?.toString()}
                onValueChange={(value) => submitResponse(question.id, parseInt(value))}
              >
                {question.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              <Button
                onClick={nextQuestion}
                disabled={!hasResponse || isSubmitting}
              >
                {currentQuestion === questions.length - 1 
                  ? (isSubmitting ? 'Submitting...' : 'Submit Assessment')
                  : 'Next Question'
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1>Mental Health Assessments</h1>
        <p className="text-muted-foreground">
          Take standardized assessments to understand your mental health better.
        </p>
      </div>

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">Available Assessments</TabsTrigger>
          <TabsTrigger value="history">Your History</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableAssessments.map((assessment) => (
              <Card key={assessment.type}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{assessment.name}</CardTitle>
                      <CardDescription>{assessment.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>5-10 minutes</span>
                    </div>
                    <Button 
                      onClick={() => startAssessment(assessment.type)}
                      className="w-full"
                    >
                      Start Assessment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {userAssessments.length > 0 ? (
            <div className="space-y-4">
              {userAssessments.map((assessment) => (
                <Card key={assessment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium">{assessment.assessment_type}</h3>
                        <p className="text-sm text-muted-foreground">
                          Completed on {new Date(assessment.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-2xl font-bold" className={getScoreColor(assessment.score)}>
                          {assessment.score}
                        </p>
                        {getSeverityBadge(assessment.interpretation)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No assessments yet</h3>
                <p className="text-muted-foreground mb-4">
                  Take your first mental health assessment to get personalized insights.
                </p>
                <Button onClick={() => {
                  const firstAssessment = availableAssessments[0];
                  if (firstAssessment) startAssessment(firstAssessment.type);
                }}>
                  Take Your First Assessment
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Progress Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {userAssessments.length > 0 
                    ? `You've completed ${userAssessments.length} assessment(s). Keep tracking your mental health journey.`
                    : 'Start taking assessments to track your mental health progress over time.'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Important Note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  These assessments are screening tools and not diagnostic. 
                  Always consult with a mental health professional for proper evaluation.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}