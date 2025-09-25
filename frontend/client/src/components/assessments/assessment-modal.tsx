import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface AssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentType: string | null;
}

export default function AssessmentModal({ open, onOpenChange, assessmentType }: AssessmentModalProps) {
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [currentStep, setCurrentStep] = useState<'questions' | 'results'>('questions');
  const [submittedAssessment, setSubmittedAssessment] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get assessment questions
  const { data: questionsData, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['/api/v1/assessments/questions', assessmentType],
    queryFn: () => assessmentType ? api.getAssessmentQuestions(assessmentType) : null,
    enabled: !!assessmentType && open,
  });

  // Submit assessment
  const submitMutation = useMutation({
    mutationFn: api.submitAssessment,
    onSuccess: (data) => {
      setSubmittedAssessment(data);
      setCurrentStep('results');
      queryClient.invalidateQueries({ queryKey: ['/api/v1/assessments/'] });
      toast({
        title: "Assessment completed",
        description: "Your results are ready.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit assessment",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (open) {
      setResponses({});
      setCurrentStep('questions');
      setSubmittedAssessment(null);
    }
  }, [open, assessmentType]);

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: parseInt(value)
    }));
  };

  const handleSubmit = () => {
    if (!assessmentType) return;
    
    const allQuestionsAnswered = questionsData?.questions?.every(
      (q: any) => responses[q.id] !== undefined
    );

    if (!allQuestionsAnswered) {
      toast({
        title: "Please answer all questions",
        description: "All questions must be completed before submitting.",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate({
      assessment_type: assessmentType,
      responses,
    });
  };

  const getAssessmentTitle = (type: string | null) => {
    if (type === 'depression_phq9') return 'PHQ-9 Depression Assessment';
    if (type === 'anxiety_gad7') return 'GAD-7 Anxiety Assessment';
    return 'Mental Health Assessment';
  };

  const getScoreInterpretation = (score: number, assessmentType: string) => {
    if (assessmentType === 'depression_phq9') {
      if (score <= 4) return { level: 'Minimal', color: 'bg-chart-2/10 text-chart-2', description: 'Minimal or no depression' };
      if (score <= 9) return { level: 'Mild', color: 'bg-secondary/10 text-secondary', description: 'Mild depression' };
      if (score <= 14) return { level: 'Moderate', color: 'bg-accent/10 text-accent', description: 'Moderate depression' };
      if (score <= 19) return { level: 'Moderately Severe', color: 'bg-orange-100 text-orange-800', description: 'Moderately severe depression' };
      return { level: 'Severe', color: 'bg-destructive/10 text-destructive', description: 'Severe depression' };
    }
    
    if (assessmentType === 'anxiety_gad7') {
      if (score <= 4) return { level: 'Minimal', color: 'bg-chart-2/10 text-chart-2', description: 'Minimal anxiety' };
      if (score <= 9) return { level: 'Mild', color: 'bg-secondary/10 text-secondary', description: 'Mild anxiety' };
      if (score <= 14) return { level: 'Moderate', color: 'bg-accent/10 text-accent', description: 'Moderate anxiety' };
      return { level: 'Severe', color: 'bg-destructive/10 text-destructive', description: 'Severe anxiety' };
    }
    
    return { level: 'Unknown', color: 'bg-muted/10 text-muted-foreground', description: 'Assessment complete' };
  };

  const progressPercentage = questionsData?.questions?.length 
    ? (Object.keys(responses).length / questionsData.questions.length) * 100 
    : 0;

  if (!assessmentType) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto assessment-modal">
        <DialogHeader>
          <DialogTitle>{getAssessmentTitle(assessmentType)}</DialogTitle>
          <DialogDescription>
            {currentStep === 'questions' 
              ? 'Please answer all questions honestly based on how you\'ve been feeling over the past 2 weeks.'
              : 'Here are your assessment results and recommendations.'
            }
          </DialogDescription>
          {currentStep === 'questions' && (
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Object.keys(responses).length} of {questionsData?.questions?.length || 0}</span>
                </div>
                <Progress value={progressPercentage} className="w-full" />
              </div>
            </div>
          )}
        </DialogHeader>

        {isLoadingQuestions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : currentStep === 'questions' ? (
          <div className="space-y-6" data-testid="assessment-questions">
            {questionsData?.questions?.filter(Boolean).map((question: any, index: number) => (
              <Card key={`question-${question?.id || `q${index}`}-${index}`} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-sm font-medium text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <Label className="text-base font-medium text-card-foreground">
                        {question.text}
                      </Label>
                    </div>
                  </div>
                  
                  <RadioGroup
                    value={responses[question.id]?.toString() || ''}
                    onValueChange={(value) => handleResponseChange(question.id, value)}
                    className="grid gap-3 ml-9"
                  >
                    {question.options?.filter(Boolean).map((option: string, optionIndex: number) => (
                      <div key={`${question?.id || `q${index}`}-option-${optionIndex}-${option.slice(0, 5)}`} className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value={optionIndex.toString()} 
                          id={`${question.id}-${optionIndex}`}
                          data-testid={`radio-${question.id}-${optionIndex}`}
                        />
                        <Label 
                          htmlFor={`${question.id}-${optionIndex}`}
                          className="text-sm text-muted-foreground cursor-pointer"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </Card>
            ))}

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending || Object.keys(responses).length !== questionsData?.questions?.length}
                data-testid="button-submit-assessment"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Assessment'
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Results view
          <div className="space-y-6" data-testid="assessment-results">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-chart-2 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-card-foreground mb-2">Assessment Complete</h3>
              <p className="text-muted-foreground">Here are your results and recommendations</p>
            </div>

            {submittedAssessment && (
              <>
                <Card className="p-6">
                  <div className="text-center space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Your Score</p>
                      <p className="text-4xl font-bold text-card-foreground" data-testid="score-value">
                        {submittedAssessment.score}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        out of {assessmentType === 'depression_phq9' ? '27' : '21'}
                      </p>
                    </div>
                    
                    <div>
                      <Badge 
                        className={getScoreInterpretation(submittedAssessment.score, assessmentType).color}
                        data-testid="interpretation-badge"
                      >
                        {submittedAssessment.interpretation}
                      </Badge>
                    </div>
                  </div>
                </Card>

                {submittedAssessment.recommendations?.length > 0 && (
                  <Card className="p-6">
                    <h4 className="font-semibold text-card-foreground mb-4 flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2 text-primary" />
                      Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {submittedAssessment.recommendations.map((rec: string, index: number) => (
                        <li key={`recommendation-${index}-${rec.slice(0, 10)}`} className="flex items-start">
                          <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-muted-foreground">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Important:</strong> This assessment is a screening tool and not a diagnostic instrument. 
                    If you're concerned about your mental health, please consider speaking with a mental health professional.
                  </p>
                </div>
              </>
            )}

            <div className="flex justify-center space-x-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close">
                Close
              </Button>
              <Button onClick={() => setCurrentStep('questions')} data-testid="button-retake">
                Take Another Assessment
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
