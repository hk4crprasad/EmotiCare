# EmotiCare Agent Service Architecture

## Overview
The EmotiCare application now uses a simplified, centralized agent service architecture that provides better organization, reduced code duplication, and easier maintenance.

## Architecture Components

### 1. Centralized Agent Service (`app/services/agent_service.py`)
- **Purpose**: Single source of truth for React agent executor with all tools
- **Features**:
  - Manages React agent with LangGraph
  - Handles all 9 tools (5 base mental health tools + 4 MCP tools)
  - Provides conversation management
  - Handles both chat and voice contexts
  - Manages MCP client connection for external tools

**Key Tools Available:**
- `get_breathing_exercise` - 4-7-8 breathing technique for anxiety
- `get_grounding_technique` - 5-4-3-2-1 grounding technique
- `get_study_tips` - Evidence-based study strategies
- `assess_crisis_risk` - Crisis intervention detection
- `check_appointment_availability` - Counselor appointment checking
- `create_story_job_mcp` - Story creation via MCP
- `get_job_status_mcp` - Job status checking via MCP
- `list_recent_jobs_mcp` - Recent jobs listing via MCP
- `get_pdf_download_url_mcp` - PDF download URL generation via MCP

### 2. Simplified AI Service (`app/services/ai_service.py`)
- **Purpose**: Wrapper around centralized agent service for backward compatibility
- **Features**:
  - Delegates all agent operations to centralized service
  - Maintains existing API interface
  - Provides conversation management methods
  - Supports both mental health and voice responses

### 3. Simplified Chat Service (`app/services/chat_service.py`)
- **Purpose**: Mental health chat service using centralized agent
- **Features**:
  - Uses centralized agent service for AI responses
  - Maintains crisis detection and analysis
  - Provides resource suggestions and next steps
  - Handles chat session management
  - Generates chat titles

## Benefits of New Architecture

### 1. **Simplified Maintenance**
- Single place to manage React agent configuration
- Centralized tool management
- Reduced code duplication

### 2. **Better Organization**
- Clear separation of concerns
- Centralized agent logic
- Consistent tool usage across services

### 3. **Improved Performance**
- Single agent instance shared across services
- Reduced memory usage
- Faster initialization

### 4. **Enhanced Reliability**
- Centralized error handling
- Consistent MCP client management
- Single point for verbose logging

### 5. **Easier Testing**
- Centralized test point for agent functionality
- Consistent behavior across services
- Simpler debugging

## Usage Examples

### Direct Agent Service Usage
```python
from app.services.agent_service import get_agent_service

agent_service = await get_agent_service()
response = await agent_service.generate_response(
    user_input="I need breathing exercises",
    session_id="user_123"
)
```

### AI Service Usage (Backward Compatible)
```python
from app.services.ai_service import get_ai_service

ai_service = await get_ai_service()
response = await ai_service.generate_mental_health_response(
    user_input="Help with anxiety",
    session_id="session_456"
)
```

### Chat Service Usage (Full Mental Health Features)
```python
from app.services.chat_service import mental_health_chat

response = await mental_health_chat.generate_response(
    message="I'm feeling stressed about exams",
    session_id="chat_789"
)
# Returns ChatResponse with crisis analysis, resources, etc.
```

## MCP Integration
- **Connection**: localhost:8001/sse
- **Tools**: 4 additional tools for story creation, job management, and PDF handling
- **Error Handling**: Graceful fallback if MCP server unavailable
- **Logging**: Detailed MCP client status logging

## Configuration
- **LLM**: Azure OpenAI GPT-4.1 with temperature 0.7
- **Memory**: LangGraph MemorySaver for conversation persistence
- **Verbose**: Enabled for detailed agent execution logging
- **Max Tokens**: 1000 for chat, 500 for analysis

## Monitoring & Debugging
- Comprehensive logging at INFO level
- Agent execution step tracking
- Tool usage monitoring
- MCP client status reporting
- Error handling with fallback responses

This architecture provides a robust, scalable foundation for EmotiCare's AI mental health support system.