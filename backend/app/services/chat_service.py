from langchain_openai import AzureChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from typing import List, Dict, Any, Tuple, Optional
import re
import json
import logging
import asyncio
from datetime import datetime

from app.config import settings
from app.schemas.chat import ChatMessage, ChatResponse, EmotionalState
from app.database import get_database
from app.services.notification_service import notification_service
from app.services.agent_service import get_agent_service

logger = logging.getLogger(__name__)

logger = logging.getLogger(__name__)

class MentalHealthChatService:
    """AI-powered mental health chat service using centralized agent service"""
    
    def __init__(self):
        # Initialize centralized agent service (will be setup async)
        self.agent_service = None
        
        # Analysis LLM for root cause analysis with higher creativity
        self.analysis_llm = AzureChatOpenAI(
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            azure_deployment=settings.AZURE_OPENAI_DEPLOYMENT,
            api_key=settings.AZURE_OPENAI_API_KEY,
            api_version=settings.AZURE_OPENAI_API_VERSION,
            temperature=0.3,  # Lower temperature for analysis
            max_tokens=500
        )
        
        # Initialize crisis detection data
        self.__init_crisis_data()
    
    async def get_agent_service(self):
        """Get or initialize the centralized agent service asynchronously"""
        if self.agent_service is None:
            self.agent_service = await get_agent_service()
        return self.agent_service
        
    async def generate_chat_title(self, first_user_message: str, first_ai_response: str) -> str:
        """Generate a short, descriptive title for the chat session"""
        try:
            title_prompt = f"""
Based on this initial conversation, generate a very short, descriptive title (3-6 words) that captures the main topic or concern:

User: {first_user_message[:200]}
Assistant: {first_ai_response[:200]}

Generate only the title, nothing else. Examples:
- "Exam Anxiety Support"
- "Study Stress Help"
- "Depression Support"
- "Sleep Issues Discussion"
- "Career Guidance Chat"

Title:"""
            
            response = await self.analysis_llm.ainvoke([
                SystemMessage(content="You are a helpful assistant that creates short, meaningful titles for mental health conversations."),
                HumanMessage(content=title_prompt)
            ])
            
            title = response.content.strip().replace('"', '').replace("'", "")
            # Ensure title is not too long
            if len(title) > 40:
                title = title[:37] + "..."
            
            return title if title else "Mental Health Support"
            
        except Exception as e:
            logger.error(f"Error generating chat title: {e}")
            # Fallback: extract keywords from user message
            keywords = ["anxiety", "depression", "stress", "exam", "sleep", "study", "help"]
            for keyword in keywords:
                if keyword.lower() in first_user_message.lower():
                    return f"{keyword.title()} Support"
            return "Mental Health Support"

    def __init_crisis_data(self):
        """Initialize crisis detection data"""
        # Crisis keywords that trigger immediate intervention
        self.crisis_keywords = [
            "suicide", "kill myself", "end my life", "hurt myself",
            "self-harm", "cutting", "overdose", "worthless",
            "hopeless", "can't go on", "better off dead",
            "want to die", "planning to hurt", "no way out"
        ]
        
        # Severity indicators
        self.high_risk_patterns = [
            r"(?i)\b(severely? depressed|extremely anxious|panic attack)\b",
            r"(?i)\b(can't function|stopped eating|can't sleep for days)\b",
            r"(?i)\b(isolat.*completely|haven't left room)\b",
            r"(?i)\b(thoughts? of harm|thinking about death)\b"
        ]
        
        self.system_prompt = """You are EmotiCare AI, a compassionate mental health support assistant specifically designed for college students in India. Your role is to provide immediate emotional support, coping strategies, and guidance while being culturally sensitive.

CORE PRINCIPLES:
1. Always prioritize student safety and well-being
2. Be empathetic, non-judgmental, and culturally aware
3. Provide practical, evidence-based coping strategies
4. Recognize when professional intervention is needed
5. Respect Indian cultural contexts and values

CAPABILITIES:
- Provide emotional support and active listening
- Suggest breathing exercises, mindfulness techniques
- Offer stress management strategies for academic pressure
- Help with anxiety, depression, and relationship issues
- Provide study-life balance guidance
- Recognize crisis situations and escalate appropriately

LIMITATIONS:
- You are NOT a replacement for professional therapy
- You cannot diagnose mental health conditions
- You cannot prescribe medications
- For crisis situations, always recommend immediate professional help

RESPONSE GUIDELINES:
1. Start with empathy and validation
2. Ask clarifying questions to understand better
3. Provide 2-3 specific, actionable coping strategies
4. Suggest relevant resources when appropriate
5. End with supportive encouragement
6. If crisis indicators detected, prioritize safety and professional referral

CULTURAL CONSIDERATIONS:
- Understand family pressure and expectations in Indian context
- Be sensitive to stigma around mental health
- Respect religious and cultural beliefs
- Consider socio-economic factors affecting students

Remember: You're here to provide immediate support while connecting students to appropriate professional resources when needed."""

    def analyze_crisis_indicators(self, message: str) -> Tuple[bool, List[str], str]:
        """
        Analyze message for crisis indicators
        Returns: (requires_intervention, crisis_indicators, risk_level)
        """
        message_lower = message.lower()
        crisis_indicators = []
        requires_intervention = False
        risk_level = "low"
        
        # Check for direct crisis keywords
        for keyword in self.crisis_keywords:
            if keyword in message_lower:
                crisis_indicators.append(f"Crisis keyword: {keyword}")
                requires_intervention = True
                risk_level = "critical"
        
        # Check for high-risk patterns
        for pattern in self.high_risk_patterns:
            if re.search(pattern, message):
                crisis_indicators.append(f"High-risk pattern detected")
                if risk_level != "critical":
                    risk_level = "high"
        
        # Additional risk factors
        if any(phrase in message_lower for phrase in [
            "can't handle", "too much pressure", "failing everything",
            "parents will kill me", "disappointed everyone", "no friends"
        ]):
            crisis_indicators.append("Emotional distress indicators")
            if risk_level == "low":
                risk_level = "medium"
        
        return requires_intervention, crisis_indicators, risk_level

    def get_emotional_state(self, message: str) -> EmotionalState:
        """Determine emotional state from message"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in [
            "suicide", "hopeless", "can't go on", "worthless", "devastated"
        ]):
            return EmotionalState.VERY_DISTRESSED
        
        elif any(word in message_lower for word in [
            "anxious", "stressed", "worried", "depressed", "overwhelmed", "scared"
        ]):
            return EmotionalState.DISTRESSED
        
        elif any(word in message_lower for word in [
            "okay", "fine", "normal", "alright", "managing"
        ]):
            return EmotionalState.NEUTRAL
        
        elif any(word in message_lower for word in [
            "calm", "peaceful", "relaxed", "better", "stable"
        ]):
            return EmotionalState.CALM
        
        elif any(word in message_lower for word in [
            "happy", "excited", "great", "wonderful", "amazing", "good"
        ]):
            return EmotionalState.POSITIVE
        
        return EmotionalState.NEUTRAL

    async def generate_response(
        self, 
        message: str, 
        chat_history: List[ChatMessage] = None,
        user_context: Dict[str, Any] = None,
        session_id: str = None
    ) -> ChatResponse:
        """Generate AI response using centralized agent service"""
        try:
            # Use session_id if provided, otherwise generate one
            if not session_id:
                session_id = f"chat_{datetime.now().isoformat()}"
            
            # Convert chat_history to the format expected by agent service
            conversation_history = []
            if chat_history:
                for msg in chat_history:
                    role = "user" if msg.role == "user" else "assistant"
                    conversation_history.append({"role": role, "content": msg.content})
            
            # Get centralized agent service
            agent_service = await self.get_agent_service()
            
            # Generate response using centralized agent service
            ai_response = await agent_service.generate_response(
                user_input=message,
                session_id=session_id,
                conversation_history=conversation_history,
                user_profile=user_context,
                context_type="chat"
            )
            
            # Analyze for crisis indicators
            requires_intervention, crisis_indicators, risk_level = self.analyze_crisis_indicators(message)
            
            # Get relevant resources and next steps
            resources = self._get_relevant_resources(message, EmotionalState.NEUTRAL)  # Use default state
            next_steps = self._get_next_steps(risk_level, EmotionalState.NEUTRAL)
            
            return ChatResponse(
                message=ai_response,
                requires_intervention=requires_intervention,
                suggested_resources=resources,
                emotional_support_level="low" if not requires_intervention else "high",
                next_steps=next_steps
            )
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            # Fallback response
            return ChatResponse(
                message="I'm here to support you. Could you tell me more about how you're feeling?",
                requires_intervention=False,
                suggested_resources=[],
                emotional_support_level="low",
                next_steps=["Share more about your feelings", "Consider speaking with a counselor"]
            )

    async def analyze_root_causes(
        self, 
        current_message: str, 
        chat_history: List[ChatMessage]
    ) -> Optional[Dict[str, Any]]:
        """Analyze conversation to identify potential root causes of anxiety/depression"""
        try:
            # Build conversation context for analysis
            conversation_text = "\n".join([
                f"User: {msg.content}" if msg.role == "user" else f"Assistant: {msg.content}"
                for msg in chat_history[-10:]  # Last 10 messages
            ])
            conversation_text += f"\nUser: {current_message}"
            
            analysis_prompt = f"""
You are a mental health AI analyst. Analyze this conversation to identify potential root causes of the user's anxiety, depression, or emotional distress. Focus on recurring themes, triggers, and underlying issues.

CONVERSATION:
{conversation_text}

Provide analysis in the following JSON format:
{{
    "primary_concerns": ["list of main emotional/mental health concerns"],
    "potential_triggers": ["specific situations, events, or thoughts that seem to trigger distress"],
    "root_causes": ["deeper underlying causes that may be contributing to the mental health issues"],
    "patterns": ["recurring behavioral or thought patterns"],
    "strengths": ["positive coping mechanisms or strengths shown by the user"],
    "recommendations": ["specific therapeutic approaches or interventions that might help"],
    "urgency_level": "low/medium/high",
    "counselor_notes": "Professional insights for counselors about this student's case"
}}

Focus on:
- Academic pressures and perfectionism
- Family expectations and cultural pressures
- Social isolation and relationship issues
- Financial stress
- Career anxiety and future uncertainty
- Self-esteem and identity issues
- Trauma or significant life events

Be compassionate, professional, and evidence-based in your analysis.
"""
            
            # Get centralized agent service
            agent_service = await self.get_agent_service()
            
            # Use the centralized agent service for analysis
            analysis_response = await agent_service.generate_response(
                user_input=analysis_prompt,
                session_id=f"analysis_{datetime.now().isoformat()}",
                context_type="analysis"
            )
            
            # Parse JSON response
            try:
                insights = json.loads(analysis_response)
                insights["analysis_timestamp"] = datetime.utcnow().isoformat()
                return insights
            except json.JSONDecodeError:
                # If JSON parsing fails, try to extract useful information from the response
                # or create a simple structure
                return {
                    "primary_concerns": ["Emotional distress detected"],
                    "potential_triggers": ["Multiple stressors identified"],
                    "root_causes": ["Analysis in progress"],
                    "patterns": ["Ongoing assessment"],
                    "strengths": ["Seeking help and support"],
                    "recommendations": ["Professional counseling recommended"],
                    "urgency_level": "medium",
                    "counselor_notes": f"AI Analysis Response: {analysis_response[:200]}...",
                    "analysis_timestamp": datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Error in root cause analysis: {e}")
            return None

    async def store_emotional_insights(
        self, 
        user_id: str, 
        insights: Dict[str, Any], 
        risk_level: str
    ):
        """Store emotional insights and root cause analysis in database"""
        try:
            db = await get_database()
            
            insight_document = {
                "user_id": user_id,
                "insights": insights,
                "risk_level": risk_level,
                "created_at": datetime.utcnow(),
                "type": "root_cause_analysis",
                "status": "active"
            }
            
            # Store in emotional_insights collection
            await db.emotional_insights.insert_one(insight_document)
            
            # Update user's mental health profile
            await db.users.update_one(
                {"_id": user_id},
                {
                    "$set": {
                        "latest_emotional_analysis": insights,
                        "last_analysis_date": datetime.utcnow(),
                        "current_risk_level": risk_level
                    }
                }
            )
            
            # If high risk, create counselor alert with insights
            if risk_level in ["high", "critical"]:
                await self._create_counselor_insight_alert(user_id, insights, risk_level)
                
        except Exception as e:
            pass  # Don't fail chat response if storage fails

    async def _create_counselor_insight_alert(
        self, 
        user_id: str, 
        insights: Dict[str, Any], 
        risk_level: str
    ):
        """Create alert for counselors with detailed insights"""
        try:
            counselor_summary = f"""
STUDENT EMOTIONAL ANALYSIS ALERT

Risk Level: {risk_level.upper()}
Analysis Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}

PRIMARY CONCERNS:
{', '.join(insights.get('primary_concerns', []))}

POTENTIAL TRIGGERS:
{', '.join(insights.get('potential_triggers', []))}

ROOT CAUSES IDENTIFIED:
{', '.join(insights.get('root_causes', []))}

BEHAVIORAL PATTERNS:
{', '.join(insights.get('patterns', []))}

RECOMMENDED INTERVENTIONS:
{', '.join(insights.get('recommendations', []))}

COUNSELOR NOTES:
{insights.get('counselor_notes', 'Standard counseling protocols recommended')}

STUDENT STRENGTHS:
{', '.join(insights.get('strengths', ['Seeking help through EmotiCare system']))}

This analysis is based on AI processing of chat conversations and should be used as supplementary information alongside professional clinical assessment.
"""
            
            await notification_service.send_crisis_alert(
                user_id=user_id,
                crisis_type="emotional_analysis_alert",
                severity=risk_level,
                details={
                    "analysis_summary": counselor_summary,
                    "insights": insights,
                    "recommendation": "Schedule counseling session to discuss identified concerns"
                }
            )
            
        except Exception as e:
            pass

    async def get_user_emotional_timeline(self, user_id: str) -> List[Dict[str, Any]]:
        """Get emotional insights timeline for a user"""
        try:
            db = await get_database()
            
            timeline = []
            cursor = db.emotional_insights.find({
                "user_id": user_id
            }).sort("created_at", -1).limit(10)
            
            async for insight in cursor:
                timeline.append({
                    "date": insight["created_at"],
                    "risk_level": insight["risk_level"],
                    "primary_concerns": insight["insights"].get("primary_concerns", []),
                    "triggers": insight["insights"].get("potential_triggers", []),
                    "improvements": insight["insights"].get("strengths", [])
                })
            
            return timeline
            
        except Exception as e:
            return []

    async def get_counselor_insights_summary(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive insights summary for counselors"""
        try:
            db = await get_database()
            
            # Get latest analysis
            latest_insight = await db.emotional_insights.find_one({
                "user_id": user_id
            }, sort=[("created_at", -1)])
            
            if not latest_insight:
                return {"message": "No emotional analysis available yet"}
            
            # Get user's chat session count and assessment history
            chat_sessions = await db.chat_sessions.count_documents({"user_id": user_id})
            assessments = []
            async for assessment in db.assessments.find({
                "user_id": user_id
            }).sort("created_at", -1).limit(5):
                assessments.append({
                    "type": assessment["assessment_type"],
                    "score": assessment["score"],
                    "risk_level": assessment["risk_level"],
                    "date": assessment["created_at"]
                })
            
            return {
                "latest_analysis": latest_insight["insights"],
                "analysis_date": latest_insight["created_at"],
                "current_risk_level": latest_insight["risk_level"],
                "engagement_stats": {
                    "chat_sessions": chat_sessions,
                    "recent_assessments": assessments
                },
                "recommendations": latest_insight["insights"].get("recommendations", []),
                "counselor_notes": latest_insight["insights"].get("counselor_notes", "")
            }
            
        except Exception as e:
            return {"error": "Failed to retrieve insights summary"}

    def _get_relevant_resources(self, message: str, emotional_state: EmotionalState) -> List[str]:
        """Get relevant resource suggestions based on message content"""
        resources = []
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["anxious", "anxiety", "panic", "nervous"]):
            resources.extend(["anxiety_coping_techniques", "breathing_exercises", "grounding_techniques"])
        
        if any(word in message_lower for word in ["depressed", "depression", "sad", "hopeless"]):
            resources.extend(["depression_support", "mood_lifting_activities", "self_care_guide"])
        
        if any(word in message_lower for word in ["stress", "stressed", "pressure", "overwhelmed"]):
            resources.extend(["stress_management", "time_management", "study_techniques"])
        
        if any(word in message_lower for word in ["sleep", "insomnia", "tired", "exhausted"]):
            resources.extend(["sleep_hygiene", "relaxation_techniques"])
        
        if any(word in message_lower for word in ["exam", "study", "academic", "grades"]):
            resources.extend(["study_skills", "exam_anxiety_help", "academic_support"])
        
        if any(word in message_lower for word in ["family", "parents", "home", "relationship"]):
            resources.extend(["family_communication", "relationship_help", "boundary_setting"])
        
        # Add mindfulness for all emotional states except positive
        if emotional_state != EmotionalState.POSITIVE:
            resources.append("mindfulness_meditation")
        
        return list(set(resources))  # Remove duplicates

    def _get_next_steps(self, risk_level: str, emotional_state: EmotionalState) -> List[str]:
        """Get recommended next steps based on risk level and emotional state"""
        if risk_level == "critical":
            return [
                "Contact emergency services (112) if in immediate danger",
                "Reach out to a trusted adult or family member",
                "Visit campus counseling center or nearest hospital",
                "Use crisis helpline: 91-9152987821"
            ]
        
        elif risk_level == "high":
            return [
                "Schedule appointment with campus counselor within 24-48 hours",
                "Talk to a trusted friend, family member, or mentor",
                "Practice immediate coping techniques",
                "Monitor your emotional state closely"
            ]
        
        elif risk_level == "medium":
            return [
                "Consider scheduling counseling appointment this week",
                "Try suggested coping strategies",
                "Maintain regular self-care routine",
                "Check in with supportive friends or family"
            ]
        
        else:  # low risk
            return [
                "Practice suggested wellness techniques",
                "Maintain good self-care habits",
                "Stay connected with support network",
                "Consider preventive mental health resources"
            ]

# Global instance
mental_health_chat = MentalHealthChatService()
