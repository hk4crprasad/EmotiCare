# EmotiCare - Digital Mental Health Support Platform

<div align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/License-Educational%20Use-green.svg" alt="License">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-success.svg" alt="Status">
</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [Frontend Components](#frontend-components)
- [Backend Services](#backend-services)
- [Environment Configuration](#environment-configuration)
- [Usage Guide](#usage-guide)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

**EmotiCare** is a comprehensive digital mental health and psychological support system designed specifically for students in higher education institutions. The platform provides AI-guided mental health support, psychological assessments, appointment booking, peer support forums, and administrative analytics to help students manage their mental well-being effectively.

### 🌟 Key Highlights

- **24/7 AI Support**: Intelligent chatbot with crisis detection and intervention
- **Confidential & Secure**: End-to-end encryption with role-based access control
- **Multi-language Support**: Culturally sensitive content for diverse student populations
- **Evidence-based**: Clinical assessment tools (PHQ-9, GAD-7) with validated scoring
- **Real-time Analytics**: Administrative dashboard for intervention planning

## 🚀 Features

### 🤖 AI Mental Health Assistant
- **Crisis Detection**: Automatic identification of suicidal ideation and high-risk situations
- **Emotional Analysis**: Real-time assessment of user emotional state
- **Coping Strategies**: Personalized interventions and support techniques
- **Emergency Resources**: Instant access to crisis hotlines and professional help

### 📊 Psychological Assessments
- **PHQ-9 Depression Scale**: Standardized 9-question depression screening
- **GAD-7 Anxiety Assessment**: Clinical anxiety disorder evaluation
- **Stress Level Analysis**: Comprehensive stress measurement tools
- **Progress Tracking**: Historical data visualization and trend analysis

### 📅 Appointment System
- **Counselor Booking**: Schedule sessions with qualified mental health professionals
- **Flexible Scheduling**: Multiple time slots and availability management
- **Secure Communication**: Encrypted messaging between students and counselors
- **Reminder System**: Automated notifications for upcoming appointments

### 👥 Peer Support Platform
- **Anonymous Forums**: Safe spaces for peer-to-peer support
- **Moderated Discussions**: Professional oversight for quality content
- **Resource Sharing**: Community-driven mental health resources
- **Support Groups**: Topic-specific discussion communities

### 📚 Resource Hub
- **Psychoeducational Content**: Evidence-based wellness materials
- **Multimedia Resources**: Videos, audio guides, and interactive content
- **Multi-language Support**: Resources in multiple languages
- **Difficulty Levels**: Content tailored to different user needs

### 🛡️ Administrative Dashboard
- **Usage Analytics**: Platform engagement and feature utilization metrics
- **Risk Assessment**: Population-level mental health trend analysis
- **Intervention Planning**: Data-driven support strategy development
- **User Management**: Role-based access control and user administration

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 6.3.5
- **UI Library**: Radix UI Components
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Hooks and Context API
- **HTTP Client**: Fetch API with custom service layer
- **Notifications**: React Hot Toast
- **Charts**: Recharts for data visualization
- **Markdown**: React Markdown with syntax highlighting

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: JWT tokens with bcrypt hashing
- **AI/ML**: Azure OpenAI + LangChain for intelligent responses
- **Cloud Storage**: Azure Blob Storage for file management
- **Analytics**: Pandas, NumPy, Scikit-learn for data analysis
- **Testing**: Pytest with async support
- **Documentation**: OpenAPI/Swagger automatic generation

### Infrastructure
- **Database**: Azure Cosmos DB (MongoDB API)
- **AI Services**: Azure OpenAI Service
- **Storage**: Azure Blob Storage
- **Authentication**: JWT with role-based access control
- **Security**: HTTPS, CORS, input validation, rate limiting

## 📁 Project Structure

```
EmotiCare/
├── 📂 backend/                          # FastAPI Backend Application
│   ├── 📂 app/
│   │   ├── main.py                      # FastAPI application entry point
│   │   ├── config.py                    # Configuration settings
│   │   ├── database.py                  # Database connection and indexes
│   │   ├── 📂 api/                      # API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                  # Authentication endpoints
│   │   │   ├── chat.py                  # AI chat system endpoints
│   │   │   ├── assessments.py           # Psychological assessment endpoints
│   │   │   ├── appointments.py          # Booking system endpoints
│   │   │   ├── resources.py             # Resource hub endpoints
│   │   │   ├── peer_support.py          # Peer support forum endpoints
│   │   │   ├── posts.py                 # Post management endpoints
│   │   │   ├── voice_chat.py            # Voice assistant endpoints
│   │   │   └── admin.py                 # Administrative endpoints
│   │   ├── 📂 schemas/                  # Pydantic validation schemas
│   │   │   ├── __init__.py
│   │   │   ├── user.py                  # User-related schemas
│   │   │   ├── chat.py                  # Chat session schemas
│   │   │   ├── assessment.py            # Assessment schemas
│   │   │   ├── appointment.py           # Appointment schemas
│   │   │   ├── resource.py              # Resource schemas
│   │   │   ├── peer_support.py          # Peer support schemas
│   │   │   └── admin.py                 # Admin analytics schemas
│   │   ├── 📂 services/                 # Business logic layer
│   │   │   ├── __init__.py
│   │   │   ├── ai_service.py            # Azure OpenAI integration
│   │   │   ├── agent_service.py         # AI agent management
│   │   │   ├── chat_service.py          # Chat session management
│   │   │   ├── assessment_service.py    # Assessment logic
│   │   │   ├── notification_service.py  # Notification system
│   │   │   ├── azure_storage_service.py # File storage management
│   │   │   └── voice_assistant_service.py # Voice interaction
│   │   ├── 📂 utils/                    # Utility functions
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                  # Authentication utilities
│   │   │   └── security.py              # Security helpers
│   │   ├── 📂 models/                   # Database models
│   │   │   └── __init__.py
│   │   └── 📂 tests/                    # Test suite
│   │       └── test_emoticare.py
│   ├── 📂 static/                       # Static file storage
│   │   └── 📂 uploads/
│   │       ├── 📂 posts/                # User-generated content
│   │       └── 📂 resources/            # Resource files
│   ├── 📂 templates/                    # HTML templates
│   ├── requirements.txt                 # Python dependencies
│   ├── setup.sh                         # Setup script
│   └── README.md                        # Backend documentation
├── 📂 frontend/                         # React Frontend Application
│   ├── 📂 src/
│   │   ├── App.tsx                      # Main application component
│   │   ├── main.tsx                     # Application entry point
│   │   ├── index.css                    # Global styles
│   │   ├── 📂 components/               # React components
│   │   │   ├── Header.tsx               # Navigation header
│   │   │   ├── LandingPage.tsx          # Landing page
│   │   │   ├── AuthPage.tsx             # Authentication
│   │   │   ├── Dashboard.tsx            # User dashboard
│   │   │   ├── ChatInterface.tsx        # AI chat interface
│   │   │   ├── Assessment.tsx           # Assessment tools
│   │   │   ├── BookingSystem.tsx        # Appointment booking
│   │   │   ├── ResourceHub.tsx          # Resource library
│   │   │   ├── PeerSupport.tsx          # Forum system
│   │   │   ├── Posts.tsx                # Post management
│   │   │   ├── AdminDashboard.tsx       # Administrative panel
│   │   │   └── 📂 ui/                   # Reusable UI components
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── input.tsx
│   │   │       └── ...
│   │   ├── 📂 services/
│   │   │   └── api.ts                   # API service layer
│   │   ├── 📂 contexts/
│   │   │   └── AuthContext.tsx          # Authentication context
│   │   ├── 📂 styles/
│   │   │   └── globals.css              # Additional styles
│   │   └── 📂 guidelines/
│   │       └── Guidelines.md            # Development guidelines
│   ├── 📂 build/                        # Production build output
│   ├── package.json                     # Node.js dependencies
│   ├── tsconfig.json                    # TypeScript configuration
│   ├── vite.config.ts                   # Vite build configuration
│   └── README.md                        # Frontend documentation
└── README.md                            # This file
```

## 🔧 Installation & Setup

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.9+
- **MongoDB** (local or Azure Cosmos DB)
- **Azure OpenAI** account (for AI features)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd EmotiCare
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
python -m venv venv

# Linux/Mac
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt
```

#### Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**
```env
# Database
MONGODB_URL=mongodb://localhost:27017/emoticare
# or Azure Cosmos DB:
# MONGODB_URL=mongodb://<account>:<key>@<account>.mongo.cosmos.azure.com:10255/emoticare?ssl=true

# JWT Secret
JWT_SECRET_KEY=your-super-secret-jwt-key-here

# Azure OpenAI
AZURE_OPENAI_API_KEY=your-azure-openai-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# Azure Blob Storage (optional)
AZURE_STORAGE_CONNECTION_STRING=your-storage-connection-string
AZURE_STORAGE_CONTAINER_NAME=emoticare-storage

# Application
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### Run Backend Server
```bash
# Development mode
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Environment Configuration (Optional)
```bash
# Create environment file for custom API endpoint
echo "VITE_API_BASE_URL=http://localhost:8000/api/v1" > .env
```

#### Run Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

#### Build for Production
```bash
npm run build
```

## 📚 API Documentation

### Automatic Documentation
Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key API Endpoints

#### Authentication
```http
POST /api/v1/auth/register     # User registration
POST /api/v1/auth/login        # User login
POST /api/v1/auth/refresh      # Token refresh
DELETE /api/v1/auth/logout     # User logout
```

#### AI Chat System
```http
POST /api/v1/chat/sessions                    # Create new chat session
GET /api/v1/chat/sessions/{session_id}        # Get session details
POST /api/v1/chat/sessions/{session_id}/messages # Send message
GET /api/v1/chat/sessions                     # List user sessions
DELETE /api/v1/chat/sessions/{session_id}     # End session
GET /api/v1/chat/emergency-resources          # Get crisis resources
```

#### Psychological Assessments
```http
GET /api/v1/assessments/types                 # Available assessment types
POST /api/v1/assessments                      # Submit assessment
GET /api/v1/assessments/results               # Get user results
GET /api/v1/assessments/results/{result_id}   # Get specific result
```

#### Appointment System
```http
GET /api/v1/appointments/counselors           # Available counselors
POST /api/v1/appointments                     # Book appointment
GET /api/v1/appointments                      # User appointments
PUT /api/v1/appointments/{appointment_id}     # Update appointment
DELETE /api/v1/appointments/{appointment_id}  # Cancel appointment
```

#### Resource Hub
```http
GET /api/v1/resources                         # Browse resources
GET /api/v1/resources/categories              # Resource categories
GET /api/v1/resources/types                   # Resource types
GET /api/v1/resources/{resource_id}           # Get specific resource
POST /api/v1/resources                        # Create resource (admin)
```

#### Peer Support
```http
GET /api/v1/peer-support/posts                # Forum posts
POST /api/v1/peer-support/posts               # Create post
GET /api/v1/peer-support/posts/{post_id}      # Get post details
POST /api/v1/peer-support/posts/{post_id}/replies # Reply to post
```

#### Administrative
```http
GET /api/v1/admin/analytics/overview          # Platform analytics
GET /api/v1/admin/analytics/assessments       # Assessment statistics
GET /api/v1/admin/analytics/usage             # Usage metrics
GET /api/v1/admin/users                       # User management
```

## 🎨 Frontend Components

### Core Components

#### `ChatInterface.tsx`
- **Purpose**: AI-powered mental health chat system
- **Features**: 
  - Real-time messaging with typing indicators
  - Crisis resource integration
  - Session management
  - Message history
  - Emergency escalation
- **Key Props**: None (uses internal state management)

#### `Assessment.tsx`
- **Purpose**: Psychological assessment tools
- **Features**:
  - PHQ-9 depression screening
  - GAD-7 anxiety assessment
  - Custom stress evaluations
  - Progress tracking and visualization
  - Risk level determination
- **Key Props**: None (fetches user-specific data)

#### `BookingSystem.tsx`
- **Purpose**: Appointment scheduling system
- **Features**:
  - Counselor selection
  - Calendar integration
  - Time slot management
  - Appointment confirmation
  - Emergency contact information
- **Key Props**: None (manages booking state internally)

#### `ResourceHub.tsx`
- **Purpose**: Educational resource library
- **Features**:
  - Multi-category resource browsing
  - Search and filter functionality
  - Multi-language support
  - Difficulty level filtering
  - Progress tracking
- **Key Props**: `userRole`, `isAuthenticated`

#### `PeerSupport.tsx`
- **Purpose**: Community forum system
- **Features**:
  - Anonymous posting
  - Category-based discussions
  - Moderated content
  - Reply threads
  - Support group creation
- **Key Props**: None (manages forum state)

#### `AdminDashboard.tsx`
- **Purpose**: Administrative analytics panel
- **Features**:
  - Usage statistics
  - Mental health trend analysis
  - User management
  - Intervention planning
  - Export capabilities
- **Key Props**: None (admin role validation)

### UI Components (`/ui`)
Reusable design system components built with Radix UI:
- `Button`, `Card`, `Input`, `Select`
- `Dialog`, `Tabs`, `Progress`, `Badge`
- `Alert`, `Avatar`, `Separator`
- And more...

## ⚙️ Backend Services

### Core Services

#### `ai_service.py`
- **Azure OpenAI Integration**: LangChain-powered intelligent responses
- **Crisis Detection**: Automatic identification of high-risk keywords
- **Emotional Analysis**: Real-time sentiment assessment
- **Context Management**: Conversation history and user profile integration

#### `chat_service.py`
- **Session Management**: Create, update, and end chat sessions
- **Message Processing**: Handle user inputs and AI responses
- **History Tracking**: Persistent conversation storage
- **Emergency Escalation**: Automatic crisis intervention

#### `assessment_service.py`
- **Clinical Scoring**: PHQ-9 and GAD-7 validated algorithms
- **Risk Assessment**: Multi-factor risk level determination
- **Progress Tracking**: Historical trend analysis
- **Personalized Recommendations**: Context-aware interventions

#### `notification_service.py`
- **Real-time Alerts**: Crisis detection notifications
- **Appointment Reminders**: Automated scheduling notifications
- **System Messages**: Platform updates and announcements
- **Emergency Contacts**: Crisis intervention escalation

#### `azure_storage_service.py`
- **File Management**: Secure upload and download
- **Resource Storage**: Educational content management
- **User Content**: Post attachments and media
- **Backup Systems**: Data redundancy and recovery

### Authentication & Security

#### Role-Based Access Control
- **Student**: Access to all support features
- **Counselor**: Additional appointment management
- **Peer Volunteer**: Forum moderation capabilities
- **Admin**: Full platform analytics and management

#### Security Features
- JWT token authentication with refresh
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting and CORS protection
- Encrypted data transmission

## 🌍 Environment Configuration

### Development Environment
```env
DEBUG=True
ENVIRONMENT=development
LOG_LEVEL=DEBUG
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Production Environment
```env
DEBUG=False
ENVIRONMENT=production
LOG_LEVEL=INFO
CORS_ORIGINS=https://your-domain.com
HTTPS_ONLY=True
```

### Database Configuration
```env
# Local MongoDB
MONGODB_URL=mongodb://localhost:27017/emoticare

# Azure Cosmos DB
MONGODB_URL=mongodb://<account>:<key>@<account>.mongo.cosmos.azure.com:10255/emoticare?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@<account>@
```

### AI Service Configuration
```env
# Azure OpenAI
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Model Configuration
CHAT_MODEL_TEMPERATURE=0.7
CHAT_MODEL_MAX_TOKENS=1000
CRISIS_DETECTION_THRESHOLD=0.8
```

## 📖 Usage Guide

### For Students

1. **Registration**: Create account with institutional email
2. **Assessment**: Complete initial mental health screening
3. **AI Support**: Access 24/7 chat-based support
4. **Resources**: Browse psychoeducational materials
5. **Appointments**: Schedule counselor sessions
6. **Community**: Participate in peer support forums

### For Counselors

1. **Dashboard**: Access appointment schedule and analytics
2. **Client Management**: Review assessment results and history
3. **Session Notes**: Document counseling interactions
4. **Resource Recommendations**: Assign specific resources to clients
5. **Crisis Response**: Receive emergency notifications

### For Administrators

1. **Analytics Dashboard**: Monitor platform usage and trends
2. **User Management**: Manage roles and permissions
3. **Content Moderation**: Oversee forum discussions
4. **Resource Management**: Upload and organize educational content
5. **Crisis Intervention**: Coordinate emergency responses

## 🧪 Testing

### Backend Testing
```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_emoticare.py -v

# Run async tests
pytest -s tests/test_async_endpoints.py
```

### Frontend Testing
```bash
cd frontend

# Run unit tests (if configured)
npm test

# Run E2E tests (if configured)
npm run test:e2e

# Type checking
npm run type-check
```

### Testing Scenarios

#### Critical User Flows
1. **Crisis Detection**: Test AI response to suicidal ideation
2. **Assessment Scoring**: Validate PHQ-9/GAD-7 calculations
3. **Appointment Booking**: End-to-end scheduling process
4. **Emergency Escalation**: Crisis intervention workflow
5. **Data Privacy**: Ensure proper access controls

#### API Testing
Use the provided test files or tools like Postman:
```bash
# Test authentication
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'

# Test AI chat
curl -X POST http://localhost:8000/api/v1/chat/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## 🚀 Deployment

### Backend Deployment

#### Using Docker (Recommended)
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Azure App Service
```bash
# Install Azure CLI
az login

# Create resource group
az group create --name emoticare-rg --location eastus

# Create App Service plan
az appservice plan create --name emoticare-plan --resource-group emoticare-rg --sku B1 --is-linux

# Create web app
az webapp create --resource-group emoticare-rg --plan emoticare-plan --name emoticare-backend --runtime "PYTHON|3.9"

# Deploy code
az webapp deployment source config-zip --resource-group emoticare-rg --name emoticare-backend --src backend.zip
```

### Frontend Deployment

#### Static Site Hosting
```bash
# Build for production
npm run build

# Deploy to Azure Static Web Apps
az staticwebapp create \
  --name emoticare-frontend \
  --resource-group emoticare-rg \
  --source . \
  --location eastus \
  --branch main \
  --app-location "/frontend" \
  --output-location "/frontend/build"
```

#### Environment Variables for Production
```env
# Backend
MONGODB_URL=<production-database-url>
JWT_SECRET_KEY=<strong-production-secret>
AZURE_OPENAI_API_KEY=<production-openai-key>
CORS_ORIGINS=https://your-frontend-domain.com

# Frontend
VITE_API_BASE_URL=https://your-backend-domain.com/api/v1
```

### Health Checks
```http
GET /api/v1/health              # Basic health check
GET /api/v1/health/database     # Database connectivity
GET /api/v1/health/ai           # AI service status
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Make changes and test thoroughly
4. Commit with clear messages: `git commit -m "Add new feature"`
5. Push to branch: `git push origin feature/new-feature`
6. Create Pull Request with detailed description

### Code Standards
- **Python**: Follow PEP 8, use type hints
- **TypeScript**: Strict mode, consistent formatting
- **Testing**: Maintain >80% code coverage
- **Documentation**: Update README and inline docs
- **Security**: Never commit secrets or credentials

### Issue Reporting
When reporting issues, include:
- Steps to reproduce
- Expected vs actual behavior
- Error messages and logs
- Environment details (OS, versions)
- Screenshots if applicable

## 📄 License

This project is licensed for **Educational Use Only**. See the full license terms:

- ✅ Use for learning and educational purposes
- ✅ Modify and adapt for educational projects
- ✅ Share with educational institutions
- ❌ Commercial use without permission
- ❌ Redistribution without attribution

## 🆘 Support & Resources

### Crisis Resources
- **National Suicide Prevention Lifeline**: 988
- **Crisis Text Line**: Text HOME to 741741
- **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/

### Technical Support
- **Documentation**: Check inline code documentation
- **API Reference**: Visit `/docs` endpoint when backend is running
- **Issues**: Report bugs via GitHub Issues
- **Community**: Join our Discord server (if available)

### Additional Resources
- **Mental Health Guidelines**: See `/frontend/src/guidelines/Guidelines.md`
- **Development Guide**: Check `/backend/DEVELOPMENT.md`
- **Architecture Overview**: Review `/backend/AGENT_ARCHITECTURE.md`

---

<div align="center">
  <p><strong>EmotiCare - Supporting Student Mental Health Through Technology</strong></p>
  <p>Built with ❤️ for the global student community</p>
</div>