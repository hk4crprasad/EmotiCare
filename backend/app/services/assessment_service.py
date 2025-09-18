from typing import Dict, List, Any
import logging
from datetime import datetime

from app.schemas.assessment import (
    AssessmentType, SeverityLevel, AssessmentResult,
    PHQ9Response, GAD7Response
)
from app.config import settings

logger = logging.getLogger(__name__)

class AssessmentService:
    """Service for psychological assessments"""
    
    def __init__(self):
        self.assessment_processors = {
            AssessmentType.PHQ9: self._process_phq9,
            AssessmentType.GAD7: self._process_gad7,
            AssessmentType.GHQ: self._process_ghq,
            AssessmentType.STRESS_SCALE: self._process_stress_scale,
            AssessmentType.SLEEP_QUALITY: self._process_sleep_quality
        }
    
    def process_assessment(
        self, 
        assessment_type: AssessmentType, 
        responses: Dict[str, Any]
    ) -> AssessmentResult:
        """Process assessment responses and return results"""
        processor = self.assessment_processors.get(assessment_type)
        if not processor:
            raise ValueError(f"Unsupported assessment type: {assessment_type}")
        
        return processor(responses)
    
    def _process_phq9(self, responses: Dict[str, Any]) -> AssessmentResult:
        """Process PHQ-9 Depression Assessment"""
        # PHQ-9 scoring: 0-4 (Not at all), 1-6 (Several days), 2-9 (More than half the days), 3-14 (Nearly every day)
        
        # Extract responses (should be 0-3 for each question)
        question_scores = [
            responses.get("little_interest", 0),
            responses.get("feeling_down", 0),
            responses.get("trouble_sleeping", 0),
            responses.get("feeling_tired", 0),
            responses.get("poor_appetite", 0),
            responses.get("feeling_bad", 0),
            responses.get("trouble_concentrating", 0),
            responses.get("moving_slowly", 0),
            responses.get("thoughts_death", 0)
        ]
        
        total_score = sum(question_scores)
        
        # Determine severity level
        if total_score <= 4:
            severity = SeverityLevel.MINIMAL
            interpretation = "Minimal or no depression symptoms"
        elif total_score <= 9:
            severity = SeverityLevel.MILD
            interpretation = "Mild depression symptoms"
        elif total_score <= 14:
            severity = SeverityLevel.MODERATE
            interpretation = "Moderate depression symptoms"
        elif total_score <= 19:
            severity = SeverityLevel.MODERATELY_SEVERE
            interpretation = "Moderately severe depression symptoms"
        else:
            severity = SeverityLevel.SEVERE
            interpretation = "Severe depression symptoms"
        
        # Generate recommendations
        recommendations = self._get_phq9_recommendations(total_score, question_scores)
        
        # Determine risk level
        risk_level = self._determine_risk_level(total_score, question_scores, AssessmentType.PHQ9)
        
        # Check for immediate attention (suicidal ideation)
        requires_immediate_attention = question_scores[8] >= 1  # Thoughts of death/self-harm
        
        return AssessmentResult(
            score=total_score,
            severity_level=severity,
            interpretation=interpretation,
            recommendations=recommendations,
            risk_level=risk_level,
            requires_immediate_attention=requires_immediate_attention
        )
    
    def _process_gad7(self, responses: Dict[str, Any]) -> AssessmentResult:
        """Process GAD-7 Anxiety Assessment"""
        
        question_scores = [
            responses.get("feeling_nervous", 0),
            responses.get("not_able_stop_worry", 0),
            responses.get("worrying_too_much", 0),
            responses.get("trouble_relaxing", 0),
            responses.get("restless", 0),
            responses.get("easily_annoyed", 0),
            responses.get("feeling_afraid", 0)
        ]
        
        total_score = sum(question_scores)
        
        # Determine severity level
        if total_score <= 4:
            severity = SeverityLevel.MINIMAL
            interpretation = "Minimal or no anxiety symptoms"
        elif total_score <= 9:
            severity = SeverityLevel.MILD
            interpretation = "Mild anxiety symptoms"
        elif total_score <= 14:
            severity = SeverityLevel.MODERATE
            interpretation = "Moderate anxiety symptoms"
        else:
            severity = SeverityLevel.SEVERE
            interpretation = "Severe anxiety symptoms"
        
        recommendations = self._get_gad7_recommendations(total_score, question_scores)
        risk_level = self._determine_risk_level(total_score, question_scores, AssessmentType.GAD7)
        
        return AssessmentResult(
            score=total_score,
            severity_level=severity,
            interpretation=interpretation,
            recommendations=recommendations,
            risk_level=risk_level,
            requires_immediate_attention=total_score >= 15
        )
    
    def _process_ghq(self, responses: Dict[str, Any]) -> AssessmentResult:
        """Process General Health Questionnaire"""
        # Basic GHQ-12 implementation
        total_score = sum(responses.values())
        
        if total_score <= 3:
            severity = SeverityLevel.MINIMAL
            interpretation = "Good psychological well-being"
        elif total_score <= 6:
            severity = SeverityLevel.MILD
            interpretation = "Mild psychological distress"
        elif total_score <= 9:
            severity = SeverityLevel.MODERATE
            interpretation = "Moderate psychological distress"
        else:
            severity = SeverityLevel.SEVERE
            interpretation = "Severe psychological distress"
        
        recommendations = [
            "Consider speaking with a mental health professional",
            "Practice stress management techniques",
            "Maintain regular exercise and healthy lifestyle"
        ]
        
        return AssessmentResult(
            score=total_score,
            severity_level=severity,
            interpretation=interpretation,
            recommendations=recommendations,
            risk_level="medium" if total_score > 6 else "low",
            requires_immediate_attention=total_score > 9
        )
    
    def _process_stress_scale(self, responses: Dict[str, Any]) -> AssessmentResult:
        """Process Stress Scale Assessment"""
        total_score = sum(responses.values())
        max_possible = len(responses) * 4  # Assuming 0-4 scale
        
        percentage = (total_score / max_possible) * 100
        
        if percentage <= 25:
            severity = SeverityLevel.MINIMAL
            interpretation = "Low stress levels"
        elif percentage <= 50:
            severity = SeverityLevel.MILD
            interpretation = "Mild stress levels"
        elif percentage <= 75:
            severity = SeverityLevel.MODERATE
            interpretation = "Moderate stress levels"
        else:
            severity = SeverityLevel.SEVERE
            interpretation = "High stress levels"
        
        recommendations = [
            "Practice relaxation techniques",
            "Consider time management strategies",
            "Engage in regular physical activity",
            "Seek support from friends and family"
        ]
        
        return AssessmentResult(
            score=total_score,
            severity_level=severity,
            interpretation=interpretation,
            recommendations=recommendations,
            risk_level="high" if percentage > 75 else "medium" if percentage > 50 else "low",
            requires_immediate_attention=percentage > 85
        )
    
    def _process_sleep_quality(self, responses: Dict[str, Any]) -> AssessmentResult:
        """Process Sleep Quality Assessment"""
        total_score = sum(responses.values())
        
        if total_score <= 5:
            severity = SeverityLevel.MINIMAL
            interpretation = "Good sleep quality"
        elif total_score <= 10:
            severity = SeverityLevel.MILD
            interpretation = "Mild sleep difficulties"
        elif total_score <= 15:
            severity = SeverityLevel.MODERATE
            interpretation = "Moderate sleep problems"
        else:
            severity = SeverityLevel.SEVERE
            interpretation = "Severe sleep problems"
        
        recommendations = [
            "Maintain consistent sleep schedule",
            "Create a relaxing bedtime routine",
            "Limit screen time before bed",
            "Consider sleep hygiene practices"
        ]
        
        return AssessmentResult(
            score=total_score,
            severity_level=severity,
            interpretation=interpretation,
            recommendations=recommendations,
            risk_level="medium" if total_score > 10 else "low",
            requires_immediate_attention=False
        )
    
    def _get_phq9_recommendations(self, total_score: int, question_scores: List[int]) -> List[str]:
        """Get specific recommendations based on PHQ-9 scores"""
        recommendations = []
        
        if total_score >= 10:
            recommendations.append("Consider scheduling an appointment with a mental health professional")
        
        if question_scores[8] >= 1:  # Thoughts of death/self-harm
            recommendations.extend([
                "🚨 URGENT: Contact crisis helpline immediately (91-9152987821)",
                "Speak with a trusted adult or counselor right away",
                "Remove any means of self-harm from your environment"
            ])
        
        if question_scores[1] >= 2:  # Feeling down, depressed
            recommendations.extend([
                "Practice daily mood-lifting activities",
                "Maintain social connections with friends and family",
                "Consider joining support groups"
            ])
        
        if question_scores[2] >= 2:  # Sleep problems
            recommendations.append("Focus on sleep hygiene and regular sleep schedule")
        
        if question_scores[3] >= 2:  # Low energy
            recommendations.extend([
                "Engage in light physical activity",
                "Maintain regular meal times",
                "Consider energy-boosting activities"
            ])
        
        if question_scores[6] >= 2:  # Concentration problems
            recommendations.extend([
                "Practice mindfulness and meditation",
                "Break tasks into smaller, manageable parts",
                "Consider study techniques for better focus"
            ])
        
        # General recommendations
        recommendations.extend([
            "Practice daily self-care activities",
            "Stay connected with supportive people",
            "Consider professional counseling"
        ])
        
        return list(set(recommendations))  # Remove duplicates
    
    def _get_gad7_recommendations(self, total_score: int, question_scores: List[int]) -> List[str]:
        """Get specific recommendations based on GAD-7 scores"""
        recommendations = []
        
        if total_score >= 10:
            recommendations.append("Consider professional anxiety treatment")
        
        if question_scores[0] >= 2:  # Feeling nervous
            recommendations.append("Practice deep breathing exercises")
        
        if question_scores[1] >= 2 or question_scores[2] >= 2:  # Excessive worry
            recommendations.extend([
                "Learn worry management techniques",
                "Practice thought challenging exercises",
                "Set aside specific 'worry time' each day"
            ])
        
        if question_scores[3] >= 2:  # Trouble relaxing
            recommendations.extend([
                "Try progressive muscle relaxation",
                "Practice mindfulness meditation",
                "Engage in calming activities"
            ])
        
        if question_scores[4] >= 2:  # Restlessness
            recommendations.extend([
                "Engage in regular physical exercise",
                "Try grounding techniques",
                "Practice calming activities"
            ])
        
        # General anxiety recommendations
        recommendations.extend([
            "Practice relaxation techniques daily",
            "Maintain regular exercise routine",
            "Limit caffeine intake",
            "Consider anxiety management workshops"
        ])
        
        return list(set(recommendations))
    
    def _determine_risk_level(
        self, 
        total_score: int, 
        question_scores: List[int], 
        assessment_type: AssessmentType
    ) -> str:
        """Determine overall risk level"""
        
        if assessment_type == AssessmentType.PHQ9:
            if question_scores[8] >= 1:  # Suicidal ideation
                return "critical"
            elif total_score >= 15:
                return "high"
            elif total_score >= 10:
                return "medium"
            else:
                return "low"
        
        elif assessment_type == AssessmentType.GAD7:
            if total_score >= 15:
                return "high"
            elif total_score >= 10:
                return "medium"
            else:
                return "low"
        
        else:
            # General risk assessment
            if total_score >= 75:  # Assuming percentage-based scoring
                return "high"
            elif total_score >= 50:
                return "medium"
            else:
                return "low"

# Global instance
assessment_service = AssessmentService()

async def assess_user_needs(user_id, db) -> Dict[str, Any]:
    """Assess user needs based on recent assessment results"""
    try:
        from bson import ObjectId
        from datetime import datetime, timedelta
        
        # Get recent assessments (last 30 days)
        recent_date = datetime.utcnow() - timedelta(days=30)
        
        assessments = await db.assessments.find({
            "user_id": user_id,
            "created_at": {"$gte": recent_date}
        }).sort("created_at", -1).to_list(10)
        
        needs_assessment = {
            "stress_level": 0,
            "anxiety_level": 0,
            "depression_indicators": 0,
            "sleep_issues": 0,
            "overall_risk": "low"
        }
        
        if not assessments:
            return needs_assessment
        
        # Analyze latest assessments
        for assessment in assessments:
            assessment_type = assessment.get("assessment_type")
            score = assessment.get("score", 0)
            
            if assessment_type == "PHQ9":
                needs_assessment["depression_indicators"] = max(
                    needs_assessment["depression_indicators"], score
                )
            elif assessment_type == "GAD7":
                needs_assessment["anxiety_level"] = max(
                    needs_assessment["anxiety_level"], score
                )
            elif assessment_type == "STRESS_SCALE":
                needs_assessment["stress_level"] = max(
                    needs_assessment["stress_level"], score
                )
            elif assessment_type == "SLEEP_QUALITY":
                needs_assessment["sleep_issues"] = max(
                    needs_assessment["sleep_issues"], score
                )
        
        # Determine overall risk level
        max_score = max(
            needs_assessment["stress_level"],
            needs_assessment["anxiety_level"], 
            needs_assessment["depression_indicators"]
        )
        
        if max_score >= 15:
            needs_assessment["overall_risk"] = "high"
        elif max_score >= 10:
            needs_assessment["overall_risk"] = "medium"
        else:
            needs_assessment["overall_risk"] = "low"
            
        return needs_assessment
        
    except Exception as e:
        logger.error(f"Error assessing user needs: {e}")
        return {
            "stress_level": 0,
            "anxiety_level": 0,
            "depression_indicators": 0,
            "sleep_issues": 0,
            "overall_risk": "low"
        }