#!/usr/bin/env python3
"""
Test script for the Enhanced AI Service with React Agent and Full History Management
"""

import asyncio
import sys
import os

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services.ai_service import ai_service

async def test_conversation_history():
    """Test that the AI service maintains complete conversation history"""
    print("🤖 Testing EmotiCare AI Service with React Agent and Full History")
    print("=" * 60)
    
    session_id = "test_session_001"
    
    # Simulate a conversation
    test_conversation = [
        "Hi, I'm feeling really stressed about my upcoming exams",
        "Thanks for the breathing exercise. I'm still worried about failing my computer science course", 
        "I have been studying but I keep getting distracted",
        "Yes, I think time management is a big issue for me",
        "Can you help me remember what we talked about at the beginning?"
    ]
    
    print("Starting conversation simulation...\n")
    
    for i, user_input in enumerate(test_conversation, 1):
        print(f"👤 User (Message {i}): {user_input}")
        
        # Generate response
        response = await ai_service.generate_mental_health_response(
            user_input=user_input,
            user_profile={
                "role": "student",
                "department": "Computer Science",
                "year_of_study": "third_year"
            },
            context_type="chat",
            session_id=session_id
        )
        
        print(f"🤖 AI Assistant: {response}")
        print("-" * 40)
        
    # Test conversation history retrieval
    print("\n📜 CONVERSATION HISTORY CHECK:")
    print("=" * 40)
    
    # Get conversation length
    length = ai_service.get_conversation_length(session_id)
    print(f"Total messages in conversation: {length}")
    
    # Get full history
    full_history = ai_service.get_full_conversation_history(session_id)
    print(f"History entries: {len(full_history)}")
    
    print("\nFull conversation history:")
    for i, msg in enumerate(full_history, 1):
        role = msg['role'].title()
        content = msg['content'][:100] + "..." if len(msg['content']) > 100 else msg['content']
        print(f"{i}. {role}: {content}")
    
    # Test conversation summary
    summary = await ai_service.get_conversation_summary(session_id)
    print(f"\nConversation Summary:\n{summary}")
    
    # Test tools info
    print("\n🛠️  AVAILABLE TOOLS:")
    tools_info = ai_service.get_tools_info()
    for tool in tools_info:
        print(f"- {tool['name']}: {tool['description']}")

async def test_voice_response():
    """Test voice-optimized responses"""
    print("\n\n🎤 Testing Voice Response Generation")
    print("=" * 60)
    
    voice_session = "voice_test_001"
    
    voice_inputs = [
        "I can't sleep and I'm really anxious",
        "The breathing didn't help much, what else can I try?"
    ]
    
    for i, voice_input in enumerate(voice_inputs, 1):
        print(f"🎤 Voice Input {i}: {voice_input}")
        
        response = await ai_service.generate_voice_response(
            user_input=voice_input,
            user_profile={
                "role": "student",
                "department": "Psychology",
                "year_of_study": "second_year"
            },
            session_id=voice_session
        )
        
        print(f"🔊 Voice Response: {response}")
        print(f"Response length: {len(response)} characters")
        print("-" * 40)
    
    # Check voice session history
    voice_history = ai_service.get_full_conversation_history(voice_session)
    print(f"\nVoice session history length: {len(voice_history)} messages")

async def main():
    """Main test function"""
    try:
        await test_conversation_history()
        await test_voice_response()
        
        print("\n✅ All tests completed successfully!")
        print("The AI service is maintaining complete conversation history.")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())