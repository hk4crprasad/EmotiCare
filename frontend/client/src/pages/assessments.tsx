import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import AssessmentModal from "@/components/assessments/assessment-modal";
import { ClipboardCheck, Eye, TrendingUp, Calendar } from "lucide-react";

export default function Assessments() {
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get assessment types
  const { data: assessmentTypes = [] } = useQuery({
    queryKey: ['/api/v1/assessments/types/available'],
    queryFn: api.getAssessmentTypes,
  });

  // Get user's assessments
  const { data: assessments = [] } = useQuery({
    queryKey: ['/api/v1/assessments/'],
    queryFn: api.getAssessments,
  });

  const handleStartAssessment = (assessmentType: string) => {
    setSelectedAssessment(assessmentType);
    setShowModal(true);
  };

  const getAssessmentTypeInfo = (type: string) => {
    const typeMap: Record<string, { name: string; description: string; questions: number; icon: any }> = {
      'depression_phq9': {
        name: 'PHQ-9 Depression Assessment',
        description: 'A validated tool for screening, diagnosing, monitoring and measuring the severity of depression.',
        questions: 9,
        icon: ClipboardCheck,
      },
      'anxiety_gad7': {
        name: 'GAD-7 Anxiety Assessment',
        description: 'A validated tool for screening and measuring the severity of generalized anxiety disorder.',
        questions: 7,
        icon: ClipboardCheck,
      },
    };
    return typeMap[type] || typeMap['depression_phq9'];
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage < 25) return "text-chart-2";
    if (percentage < 50) return "text-accent";
    if (percentage < 75) return "text-orange-600";
    return "text-destructive";
  };

  const getInterpretationColor = (interpretation: string) => {
    const lower = interpretation.toLowerCase();
    if (lower.includes('minimal') || lower.includes('none')) return "bg-chart-2/10 text-chart-2";
    if (lower.includes('mild')) return "bg-secondary/10 text-secondary";
    if (lower.includes('moderate')) return "bg-accent/10 text-accent";
    if (lower.includes('severe')) return "bg-destructive/10 text-destructive";
    return "bg-muted/10 text-muted-foreground";
  };

  const lastAssessments = assessmentTypes.map((type: any) => {
    const userAssessments = assessments.filter((a: any) => a.assessment_type === type.type);
    return userAssessments.length > 0 ? userAssessments[userAssessments.length - 1] : null;
  });

  return (
    <div className="p-6 space-y-8" data-testid="page-assessments">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Mental Health Assessments</h1>
        <p className="text-muted-foreground">
          Take standardized assessments to track your mental health and get personalized recommendations.
        </p>
      </div>

      {/* Assessment Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {assessmentTypes.map((type: any) => {
          const info = getAssessmentTypeInfo(type.type);
          const Icon = info.icon;
          const lastAssessment = assessments
            .filter((a: any) => a.assessment_type === type.type)
            .sort((a: any, b: any) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];

          return (
            <Card key={type.type} className="hover:shadow-md transition-shadow" data-testid={`assessment-card-${type.type}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{info.name}</CardTitle>
                      <CardDescription>{info.questions} questions • 5-10 minutes</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">{info.questions} questions</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{info.description}</p>
                
                {lastAssessment ? (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-card-foreground">Last Assessment:</span>
                      <span className={`text-lg font-bold ${getScoreColor(lastAssessment.score, info.questions * 3)}`}>
                        {lastAssessment.score}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className={getInterpretationColor(lastAssessment.interpretation)}>
                        {lastAssessment.interpretation}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(lastAssessment.completed_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-dashed border-border">
                    <div className="text-center text-muted-foreground text-sm">
                      No previous assessment taken
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  onClick={() => handleStartAssessment(type.type)}
                  data-testid={`button-start-${type.type}`}
                >
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Take Assessment
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Assessment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Assessment History
          </CardTitle>
          <CardDescription>Track your progress over time</CardDescription>
        </CardHeader>
        <CardContent>
          {assessments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Assessment</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Score</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Result</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments
                    .sort((a: any, b: any) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
                    .map((assessment: any) => {
                      const info = getAssessmentTypeInfo(assessment.assessment_type);
                      return (
                        <tr 
                          key={assessment.id} 
                          className="border-b border-border hover:bg-muted/20"
                          data-testid={`assessment-row-${assessment.id}`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-card-foreground">{info.name.split(' ')[0]}</span>
                              <Badge variant="outline" className="text-xs">
                                {assessment.assessment_type === 'depression_phq9' ? 'Depression' : 'Anxiety'}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-sm">
                            {new Date(assessment.completed_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-lg font-semibold ${getScoreColor(assessment.score, info.questions * 3)}`}>
                              {assessment.score}
                            </span>
                            <span className="text-muted-foreground text-sm">/{info.questions * 3}</span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getInterpretationColor(assessment.interpretation)}>
                              {assessment.interpretation}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              data-testid={`button-view-${assessment.id}`}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No assessments completed yet</p>
              <p className="text-sm text-muted-foreground">Take your first assessment to start tracking your mental health</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assessment Modal */}
      <AssessmentModal
        open={showModal}
        onOpenChange={setShowModal}
        assessmentType={selectedAssessment}
      />
    </div>
  );
}
