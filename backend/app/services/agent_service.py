"""
Centralized Agent Service for EmotiCare
Manages a single React agent executor with all tools that can be used across the application
"""
import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from langchain_openai import AzureChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from langchain_mcp_adapters.client import MultiServerMCPClient

from app.config import settings

logger = logging.getLogger(__name__)

# Mental Health Tools for React Agent
@tool
def get_breathing_exercise() -> str:
    """Provides a simple breathing exercise for anxiety and stress relief"""
    return """Try this 4-7-8 breathing technique:
1. Inhale through your nose for 4 counts
2. Hold your breath for 7 counts  
3. Exhale through your mouth for 8 counts
4. Repeat 3-4 times
This activates your parasympathetic nervous system and promotes calm."""

@tool
def get_grounding_technique() -> str:
    """Provides a 5-4-3-2-1 grounding technique for anxiety and panic"""
    return """Use the 5-4-3-2-1 grounding technique:
- 5 things you can SEE around you
- 4 things you can TOUCH 
- 3 things you can HEAR
- 2 things you can SMELL
- 1 thing you can TASTE
This helps bring you back to the present moment and reduces anxiety."""

@tool
def get_study_tips() -> str:
    """Provides evidence-based study tips for academic stress"""
    return """Effective study strategies:
1. Pomodoro Technique: 25min study + 5min break
2. Active recall: Test yourself instead of re-reading
3. Spaced repetition: Review material at increasing intervals
4. Break large tasks into smaller, manageable chunks
5. Create a consistent study schedule
6. Find a quiet, dedicated study space"""

@tool
def assess_crisis_risk(user_message: str) -> str:
    """Assesses if the user needs immediate crisis intervention"""
    crisis_keywords = [
        "suicide", "kill myself", "end it all", "can't go on", 
        "self-harm", "hurt myself", "no point", "better off dead"
    ]
    
    if any(keyword in user_message.lower() for keyword in crisis_keywords):
        return """CRISIS ALERT: Please reach out for immediate support:
• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741
• Emergency Services: 911
• Campus Crisis Hotline: Available 24/7
You are not alone, and help is available right now."""
    
    return "No immediate crisis indicators detected."

@tool
def check_appointment_availability() -> str:
    """Checks if counseling appointments are available"""
    return "Good news! We have counselors available. You can book an appointment through the platform or contact us directly for urgent needs."

async def setup_mcp_client():
    """Setup MCP client and get tools"""
    try:
        client = MultiServerMCPClient({
            "story": {
                "transport": "sse",
                "url": "http://localhost:8001/sse"
            },
        })
        mcp_tools = await client.get_tools()
        logger.info(f"MCP client setup successful, got {len(mcp_tools)} tools")
        return mcp_tools
    except Exception as e:
        logger.warning(f"Failed to setup MCP client: {e}. Continuing with base tools only.")
        return []

class AgentService:
    """Centralized agent service that manages React agent executor with all tools"""
    
    def __init__(self):
        self.agent_executor = None
        self.tools = None
        self.conversations = {}
        self._llm = None
        
    @property
    def llm(self):
        """Lazy initialize LLM"""
        if self._llm is None:
            self._llm = AzureChatOpenAI(
                azure_deployment=settings.AZURE_OPENAI_DEPLOYMENT,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                api_key=settings.AZURE_OPENAI_API_KEY,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                temperature=0.7,
                max_tokens=1000
            )
        return self._llm
    
    async def initialize(self):
        """Initialize the React agent with all tools"""
        if self.agent_executor is not None:
            return self.agent_executor
            
        try:
            # Setup base mental health tools
            base_tools = [
                get_breathing_exercise,
                get_grounding_technique,
                get_study_tips,
                assess_crisis_risk,
                check_appointment_availability
            ]
            
            # Get MCP tools
            mcp_tools = await setup_mcp_client()
            self.tools = base_tools + mcp_tools
            
            # Enable verbose logging for agent execution
            from langchain.globals import set_verbose
            set_verbose(True)
            
            # Create React Agent with memory
            memory = MemorySaver()
            self.agent_executor = create_react_agent(
                self.llm, 
                self.tools, 
                checkpointer=memory
            )
            
            logger.info(f"Agent Service initialized with {len(self.tools)} tools")
            logger.info(f"Available tools: {[tool.name for tool in self.tools]}")
            
            return self.agent_executor
            
        except Exception as e:
            logger.error(f"Failed to initialize agent service: {e}")
            raise
    
    async def get_agent(self):
        """Get the initialized agent executor"""
        if self.agent_executor is None:
            await self.initialize()
        return self.agent_executor
    
    def get_system_message(self, context_type: str = "chat") -> str:
        """Get system message for different contexts"""
        base_message = """You are a compassionate AI mental health assistant for EmotiCare, a university counseling platform.

CORE PRINCIPLES:
1. EMPATHY: Always acknowledge and validate feelings
2. SAFETY: Prioritize user safety and crisis intervention  
3. SUPPORT: Provide practical coping strategies
4. BOUNDARIES: Never diagnose or replace professional therapy
5. EVIDENCE-BASED: Use proven techniques and tools
6. CONTINUITY: Remember and reference previous parts of our conversation

RESPONSE GUIDELINES:
- Use warm, understanding language
- Keep responses concise (under 150 words for voice, longer for text if needed)
- Ask thoughtful follow-up questions
- ALWAYS use available tools when appropriate to provide specific techniques
- Encourage professional help when needed
- Be culturally sensitive and inclusive

MANDATORY TOOL USAGE:
You have access to these tools and MUST use them when relevant:

MENTAL HEALTH TOOLS:
- When user mentions anxiety, stress, or panic: CALL get_breathing_exercise() OR get_grounding_technique()
- When user asks about studying or academic stress: CALL get_study_tips()
- When user mentions harm, suicide, or crisis words: IMMEDIATELY CALL assess_crisis_risk()
- When user asks about counseling appointments: CALL check_appointment_availability()

STORY CREATION TOOLS (MCP):
- When user asks for story creation, story generation, or wants a story: 
  CALL create_story_job_mcp(prompt="detailed story description", num_scenes=3)
  Example: create_story_job_mcp(prompt="A student overcoming exam anxiety through breathing techniques", num_scenes=3)
  ALWAYS share the job_id with the user immediately after calling this tool
- When user asks about story status or job status: CALL get_job_status_mcp(job_id="job_id")
- When user wants to see recent stories: CALL list_recent_jobs_mcp()
- When user asks for download link, PDF link, or wants to download a story: CALL get_job_status_mcp(job_id="job_id") to get the PDF URL

STORY CREATION WORKFLOW:
1. When creating a story: Use create_story_job_mcp() and immediately tell the user their job ID
2. When user asks for download/link: Use get_job_status_mcp() to check if story is ready and get PDF URL
3. If story is still generating: Tell user to wait and check back with their job ID
4. If story is completed: Provide the PDF download URL from the job status

IMPORTANT: You MUST actually call these tools using their exact function names. Do not just provide general advice - use the tools to give specific, actionable help.

Examples of correct tool usage:
- User: "I'm feeling anxious" → CALL get_breathing_exercise()
- User: "Create a story about anxiety" → CALL create_story_job_mcp(prompt="A story about overcoming anxiety", num_scenes=3)
- User: "I need study tips" → CALL get_study_tips()

If a tool call fails, acknowledge the issue briefly and offer alternative support."""

        if context_type == "voice":
            base_message += "\n\nIMPORTANT: Keep responses under 100 words for voice interaction."
            
        return base_message
    
    def build_enhanced_input(
        self, 
        user_input: str, 
        conversation_history: List[Dict[str, str]] = None, 
        user_profile: Dict[str, Any] = None,
        context_type: str = "chat"
    ) -> str:
        """Build enhanced input with context"""
        context_parts = []
        
        # Add user profile context
        if user_profile:
            profile_info = []
            if user_profile.get("role"):
                profile_info.append(f"Role: {user_profile['role']}")
            if user_profile.get("department"):
                profile_info.append(f"Department: {user_profile['department']}")
            if user_profile.get("year_of_study"):
                profile_info.append(f"Year: {user_profile['year_of_study']}")
            
            if profile_info:
                context_parts.append(f"[User Profile: {', '.join(profile_info)}]")
        
        # Add conversation type context
        if context_type == "voice":
            context_parts.append("[Voice conversation - keep response under 100 words, conversational tone]")
        
        # Build conversation history
        if conversation_history and len(conversation_history) > 1:
            history_parts = []
            for msg in conversation_history[:-1]:  # Exclude current message
                role = "Human" if msg["role"] == "user" else "Assistant"
                history_parts.append(f"{role}: {msg['content']}")
            
            if history_parts:
                context_parts.append(f"Previous conversation:\n{chr(10).join(history_parts)}")
        
        # Combine context and current input
        if context_parts:
            enhanced_input = f"{chr(10).join(context_parts)}\n\nCurrent message: {user_input}"
        else:
            enhanced_input = user_input
        
        return enhanced_input
    
    async def generate_response(
        self,
        user_input: str,
        session_id: str = "default",
        conversation_history: List[Dict[str, str]] = None,
        user_profile: Dict[str, Any] = None,
        context_type: str = "chat"
    ) -> str:
        """Generate response using the React agent"""
        try:
            # Get or create conversation history for this session
            if session_id not in self.conversations:
                self.conversations[session_id] = []
            
            # Add current user input to history
            self.conversations[session_id].append({"role": "user", "content": user_input})
            
            # Build enhanced input
            enhanced_input = self.build_enhanced_input(
                user_input=user_input,
                conversation_history=self.conversations[session_id],
                user_profile=user_profile,
                context_type=context_type
            )
            
            # Get agent
            agent_executor = await self.get_agent()
            
            # Prepare messages for React Agent
            messages = []
            
            # Add conversation history as messages
            for msg in self.conversations[session_id][:-1]:  # Exclude current message
                if msg["role"] == "user":
                    messages.append({"role": "user", "content": msg["content"]})
                else:
                    messages.append({"role": "assistant", "content": msg["content"]})
            
            # Add current message with system context if first message
            if not messages:
                system_context = self.get_system_message(context_type)
                current_message = f"SYSTEM CONTEXT: {system_context}\n\nUSER MESSAGE: {enhanced_input}"
            else:
                current_message = enhanced_input
            
            messages.append({"role": "user", "content": current_message})
            
            # Configure agent for this session
            config = {"configurable": {"thread_id": session_id}}
            
            logger.info(f"Processing message for session {session_id}")
            logger.info(f"Total conversation history: {len(self.conversations[session_id])} messages")
            logger.info(f"Context type: {context_type}")
            
            # Run React Agent
            try:
                # Try direct async execution first for better MCP tool support
                result = await agent_executor.ainvoke(
                    {"messages": messages},
                    config=config
                )
            except Exception as async_error:
                logger.warning(f"Async execution failed: {async_error}, falling back to sync executor")
                # Fallback to executor for compatibility
                result = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: agent_executor.invoke(
                        {"messages": messages},
                        config=config
                    )
                )
            
            logger.info(f"Agent execution completed. Result contains {len(result.get('messages', []))} messages")
            
            # Extract response from agent result
            if "messages" in result and result["messages"]:
                logger.info("Extracting response from agent messages")
                # Get the last AI message
                ai_messages = [msg for msg in result["messages"] if hasattr(msg, 'content') and getattr(msg, 'type', None) == 'ai']
                if ai_messages:
                    response = ai_messages[-1].content
                    logger.info(f"Found AI message response: {response[:100]}...")
                else:
                    # Fallback to last message content
                    response = result["messages"][-1].content if hasattr(result["messages"][-1], 'content') else str(result["messages"][-1])
                    logger.info(f"Using fallback response: {response[:100]}...")
            else:
                response = "I'm here to support you. Could you tell me more about how you're feeling?"
                logger.info("Using default fallback response")
            
            # Add assistant response to our conversation history
            self.conversations[session_id].append({"role": "assistant", "content": response})
            logger.info(f"Response added to conversation. Total messages now: {len(self.conversations[session_id])}")
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return "I'm here to support you. Could you tell me more about how you're feeling?"
    
    def get_tools_info(self) -> List[Dict[str, str]]:
        """Get information about available tools"""
        if not self.tools:
            return []
        
        tools_info = []
        for tool in self.tools:
            tools_info.append({
                "name": tool.name,
                "description": tool.description
            })
        return tools_info
    
    def get_conversation_history(self, session_id: str) -> List[Dict[str, str]]:
        """Get conversation history for a session"""
        return self.conversations.get(session_id, [])
    
    async def clear_conversation(self, session_id: str):
        """Clear conversation history for a session"""
        if session_id in self.conversations:
            del self.conversations[session_id]
    
    def get_conversation_length(self, session_id: str) -> int:
        """Get the number of messages in a conversation session"""
        if session_id not in self.conversations:
            return 0
        return len(self.conversations[session_id])

# Global agent service instance
agent_service = AgentService()

async def get_agent_service() -> AgentService:
    """Get the global agent service instance"""
    await agent_service.initialize()
    return agent_service