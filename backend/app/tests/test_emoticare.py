import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.assessment_service import assessment_service
from app.schemas.assessment import AssessmentType

client = TestClient(app)

class TestEmotiCareAPI:
    """Test suite for EmotiCare API"""
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        assert "EmotiCare" in response.json()["message"]
    
    def test_assessment_types(self):
        """Test available assessment types endpoint"""
        response = client.get("/api/v1/assessments/types/available")
        assert response.status_code == 200
        assessments = response.json()
        assert len(assessments) > 0
        assert any(a["type"] == "phq9" for a in assessments)
    
    def test_phq9_questions(self):
        """Test PHQ-9 questions endpoint"""
        response = client.get("/api/v1/assessments/questions/phq9")
        assert response.status_code == 200
        questions = response.json()
        assert questions["title"] == "PHQ-9 Depression Screening"
        assert len(questions["questions"]) == 9
    
    def test_emergency_resources(self):
        """Test emergency resources endpoint"""
        response = client.get("/api/v1/chat/emergency-resources")
        assert response.status_code == 200
        resources = response.json()
        assert "crisis_hotlines" in resources
        assert "immediate_coping" in resources

class TestAssessmentService:
    """Test assessment processing service"""
    
    def test_phq9_minimal(self):
        """Test PHQ-9 assessment with minimal scores"""
        responses = {
            "little_interest": 0,
            "feeling_down": 0,
            "trouble_sleeping": 1,
            "feeling_tired": 1,
            "poor_appetite": 0,
            "feeling_bad": 0,
            "trouble_concentrating": 0,
            "moving_slowly": 0,
            "thoughts_death": 0
        }
        
        result = assessment_service.process_assessment(AssessmentType.PHQ9, responses)
        
        assert result.score == 2
        assert result.severity_level.value == "minimal"
        assert result.risk_level == "low"
        assert not result.requires_immediate_attention
    
    def test_phq9_severe_with_suicidal_ideation(self):
        """Test PHQ-9 assessment with high scores and suicidal ideation"""
        responses = {
            "little_interest": 3,
            "feeling_down": 3,
            "trouble_sleeping": 3,
            "feeling_tired": 3,
            "poor_appetite": 2,
            "feeling_bad": 3,
            "trouble_concentrating": 2,
            "moving_slowly": 1,
            "thoughts_death": 2  # Suicidal ideation
        }
        
        result = assessment_service.process_assessment(AssessmentType.PHQ9, responses)
        
        assert result.score == 22
        assert result.severity_level.value == "severe"
        assert result.risk_level == "critical"
        assert result.requires_immediate_attention
        assert any("URGENT" in rec for rec in result.recommendations)
    
    def test_gad7_moderate(self):
        """Test GAD-7 assessment with moderate anxiety"""
        responses = {
            "feeling_nervous": 2,
            "not_able_stop_worry": 2,
            "worrying_too_much": 2,
            "trouble_relaxing": 1,
            "restless": 1,
            "easily_annoyed": 2,
            "feeling_afraid": 1
        }
        
        result = assessment_service.process_assessment(AssessmentType.GAD7, responses)
        
        assert result.score == 11
        assert result.severity_level.value == "moderate"
        assert result.risk_level == "medium"
        assert "breathing" in " ".join(result.recommendations).lower()

class TestChatService:
    """Test chat service functionality"""
    
    def test_crisis_detection(self):
        """Test crisis keyword detection"""
        from app.services.chat_service import mental_health_chat
        
        crisis_message = "I want to hurt myself"
        requires_intervention, indicators, risk_level = mental_health_chat.analyze_crisis_indicators(crisis_message)
        
        assert requires_intervention
        assert risk_level == "critical"
        assert len(indicators) > 0
    
    def test_emotional_state_detection(self):
        """Test emotional state detection"""
        from app.services.chat_service import mental_health_chat
        from app.schemas.chat import EmotionalState
        
        distressed_message = "I'm feeling really anxious about my exams"
        state = mental_health_chat.get_emotional_state(distressed_message)
        assert state == EmotionalState.DISTRESSED
        
        positive_message = "I'm feeling great today!"
        state = mental_health_chat.get_emotional_state(positive_message)
        assert state == EmotionalState.POSITIVE

# Sample data for testing
SAMPLE_STUDENT_DATA = {
    "email": "test.student@college.edu",
    "full_name": "Test Student",
    "password": "SecurePassword123!",
    "student_id": "CS2021001",
    "department": "Computer Science",
    "year_of_study": "third_year",
    "gender": "prefer_not_to_say",
    "age": 21
}

SAMPLE_PHQ9_RESPONSES = {
    "little_interest": 1,
    "feeling_down": 2,
    "trouble_sleeping": 1,
    "feeling_tired": 2,
    "poor_appetite": 0,
    "feeling_bad": 1,
    "trouble_concentrating": 2,
    "moving_slowly": 0,
    "thoughts_death": 0
}

if __name__ == "__main__":
    # Run basic tests
    print("🧪 Running EmotiCare Tests...")
    
    # Test assessment service
    assessment_service_test = TestAssessmentService()
    try:
        assessment_service_test.test_phq9_minimal()
        print("✅ PHQ-9 minimal test passed")
        
        assessment_service_test.test_gad7_moderate()
        print("✅ GAD-7 moderate test passed")
        
        assessment_service_test.test_phq9_severe_with_suicidal_ideation()
        print("✅ PHQ-9 crisis detection test passed")
        
    except Exception as e:
        print(f"❌ Assessment service test failed: {e}")
    
    # Test chat service
    chat_service_test = TestChatService()
    try:
        chat_service_test.test_crisis_detection()
        print("✅ Crisis detection test passed")
        
        chat_service_test.test_emotional_state_detection()
        print("✅ Emotional state detection test passed")
        
    except Exception as e:
        print(f"❌ Chat service test failed: {e}")
    
    print("🎉 Basic tests completed!")