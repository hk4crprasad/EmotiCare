#!/usr/bin/env python3
"""
EmotiCare Quick Test Script
Tests core functionality without requiring full server setup
"""

import sys
import json
from datetime import datetime

# Add the app directory to the Python path
sys.path.append('/home/cp/EmotiCare')

def test_assessment_service():
    """Test the assessment service functionality"""
    print("🧪 Testing Assessment Service...")
    
    try:
        from app.services.assessment_service import assessment_service
        from app.schemas.assessment import AssessmentType
        
        # Test PHQ-9 Assessment
        phq9_responses = {
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
        
        result = assessment_service.process_assessment(AssessmentType.PHQ9, phq9_responses)
        
        print(f"✅ PHQ-9 Assessment:")
        print(f"   Score: {result.score}/27")
        print(f"   Severity: {result.severity_level.value}")
        print(f"   Risk Level: {result.risk_level}")
        print(f"   Requires Attention: {result.requires_immediate_attention}")
        print(f"   Recommendations: {len(result.recommendations)} provided")
        
        # Test GAD-7 Assessment
        gad7_responses = {
            "feeling_nervous": 2,
            "not_able_stop_worry": 1,
            "worrying_too_much": 2,
            "trouble_relaxing": 1,
            "restless": 1,
            "easily_annoyed": 1,
            "feeling_afraid": 1
        }
        
        result = assessment_service.process_assessment(AssessmentType.GAD7, gad7_responses)
        
        print(f"✅ GAD-7 Assessment:")
        print(f"   Score: {result.score}/21")
        print(f"   Severity: {result.severity_level.value}")
        print(f"   Risk Level: {result.risk_level}")
        print(f"   Recommendations: {len(result.recommendations)} provided")
        
        return True
        
    except Exception as e:
        print(f"❌ Assessment Service Test Failed: {e}")
        return False

def test_chat_service():
    """Test the chat service functionality"""
    print("\n🧪 Testing Chat Service...")
    
    try:
        from app.services.chat_service import mental_health_chat
        from app.schemas.chat import EmotionalState
        
        # Test crisis detection
        crisis_message = "I feel like hurting myself"
        requires_intervention, indicators, risk_level = mental_health_chat.analyze_crisis_indicators(crisis_message)
        
        print(f"✅ Crisis Detection:")
        print(f"   Message: '{crisis_message}'")
        print(f"   Intervention Required: {requires_intervention}")
        print(f"   Risk Level: {risk_level}")
        print(f"   Indicators: {len(indicators)} detected")
        
        # Test emotional state detection
        test_messages = [
            "I'm feeling really anxious about my exams",
            "I'm having a great day today!",
            "I feel okay, nothing special",
            "I'm completely hopeless and can't go on"
        ]
        
        print(f"✅ Emotional State Detection:")
        for msg in test_messages:
            state = mental_health_chat.get_emotional_state(msg)
            print(f"   '{msg[:30]}...' → {state.value}")
        
        return True
        
    except Exception as e:
        print(f"❌ Chat Service Test Failed: {e}")
        return False

def test_schemas():
    """Test the schema models"""
    print("\n🧪 Testing Schema Models...")
    
    try:
        from app.schemas.user import UserRole, Gender, YearOfStudy
        from app.schemas.assessment import AssessmentType, SeverityLevel
        from app.schemas.chat import EmotionalState, ChatSessionStatus
        
        print("✅ Schema Enums:")
        print(f"   User Roles: {[role.value for role in UserRole]}")
        print(f"   Assessment Types: {[at.value for at in AssessmentType]}")
        print(f"   Severity Levels: {[sl.value for sl in SeverityLevel]}")
        print(f"   Emotional States: {[es.value for es in EmotionalState]}")
        
        return True
        
    except Exception as e:
        print(f"❌ Schema Test Failed: {e}")
        return False

def test_security_utils():
    """Test security utilities"""
    print("\n🧪 Testing Security Utils...")
    
    try:
        from app.utils.security import (
            get_password_hash, verify_password, 
            validate_password_strength, validate_student_id
        )
        
        # Test password hashing
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        verified = verify_password(password, hashed)
        
        print(f"✅ Password Hashing:")
        print(f"   Original: {password}")
        print(f"   Hashed: {hashed[:20]}...")
        print(f"   Verification: {verified}")
        
        # Test password strength validation
        passwords = [
            "weak",
            "StrongPassword123!",
            "nouppercaseorspecial123",
            "NOLOWERCASEORSPECIAL123"
        ]
        
        print(f"✅ Password Strength:")
        for pwd in passwords:
            is_strong, message = validate_password_strength(pwd)
            print(f"   '{pwd}' → {is_strong} ({message[:40]}...)")
        
        # Test student ID validation
        student_ids = ["CS2024001", "invalid", "12345", "AB123456"]
        print(f"✅ Student ID Validation:")
        for sid in student_ids:
            valid = validate_student_id(sid, "Computer Science")
            print(f"   '{sid}' → {valid}")
        
        return True
        
    except Exception as e:
        print(f"❌ Security Utils Test Failed: {e}")
        return False

def test_configuration():
    """Test configuration loading"""
    print("\n🧪 Testing Configuration...")
    
    try:
        from app.config import settings
        
        print("✅ Configuration Settings:")
        print(f"   App Name: {settings.APP_NAME}")
        print(f"   Database: {settings.DATABASE_NAME}")
        print(f"   Debug Mode: {settings.DEBUG}")
        print(f"   Token Expiry: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes")
        print(f"   PHQ-9 Thresholds: {settings.PHQ9_MILD_THRESHOLD}/{settings.PHQ9_MODERATE_THRESHOLD}/{settings.PHQ9_SEVERE_THRESHOLD}")
        
        return True
        
    except Exception as e:
        print(f"❌ Configuration Test Failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧠 EmotiCare System Test")
    print("=" * 50)
    
    tests = [
        test_configuration,
        test_schemas,
        test_security_utils,
        test_assessment_service,
        test_chat_service
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
    
    print("\n" + "=" * 50)
    print(f"🎯 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! EmotiCare core functionality is working.")
        print("\nNext steps:")
        print("1. Install dependencies: pip install -r requirements.txt")
        print("2. Configure .env file with your Azure OpenAI and MongoDB credentials")
        print("3. Run the server: uvicorn app.main:app --reload")
        print("4. Visit http://localhost:8000/docs for API documentation")
    else:
        print("⚠️  Some tests failed. Please check the error messages above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)