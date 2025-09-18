#!/usr/bin/env python3
"""
Test React Agent Tool Calling and Memory
"""
import asyncio
import sys
import os

# Add the project root to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.services.ai_service import AIService

async def test_tool_calling():
    """Test React Agent tool calling functionality"""
    print("🛠️  Testing React Agent Tool Calling")
    print("=" * 60)
    
    # Initialize AI service
    ai_service = AIService()
    session_id = "tool_test_session"
    
    # Test cases that should trigger specific tools
    test_cases = [
        {
            "input": "I'm feeling really anxious and my heart is racing. Can you help?",
            "expected_tool": "breathing exercise or grounding technique"
        },
        {
            "input": "I need help with studying for my finals. Any tips?",
            "expected_tool": "study tips"
        },
        {
            "input": "I'm having thoughts of hurting myself",
            "expected_tool": "crisis assessment"
        },
        {
            "input": "Can I schedule an appointment with a counselor?",
            "expected_tool": "appointment availability"
        },
        {
            "input": "What did we talk about before?",
            "expected_tool": "conversation history recall"
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 Test {i}: {test_case['expected_tool']}")
        print(f"📝 User Input: {test_case['input']}")
        
        try:
            response = await ai_service.generate_mental_health_response(
                user_input=test_case['input'],
                session_id=session_id
            )
            
            print(f"🤖 AI Response: {response[:200]}{'...' if len(response) > 200 else ''}")
            print(f"✅ Tool expectation: {test_case['expected_tool']}")
            print("-" * 50)
            
        except Exception as e:
            print(f"❌ Error in test {i}: {e}")
            print("-" * 50)
    
    # Check conversation history
    print(f"\n📚 Session History: {len(ai_service.conversations.get(session_id, []))} messages")
    
    # Test if agent can recall all previous interactions
    print("\n🧠 Testing Conversation Memory:")
    recall_response = await ai_service.generate_mental_health_response(
        user_input="Can you summarize everything we've discussed in this session?",
        session_id=session_id
    )
    print(f"📝 Memory Response: {recall_response}")
    
    print(f"\n✅ Final session length: {len(ai_service.conversations.get(session_id, []))} messages")

if __name__ == "__main__":
    asyncio.run(test_tool_calling())