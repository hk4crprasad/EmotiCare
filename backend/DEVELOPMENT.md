# EmotiCare Development Guide

## 🚀 Quick Start

### 1. Setup Environment
```bash
# Clone and navigate to project
cd EmotiCare

# Run setup script
./setup.sh

# Activate virtual environment
source venv/bin/activate

# Start the application
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Access the Application
- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 📚 API Endpoints Overview

### Authentication (`/api/v1/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /me` - Get current user info
- `PUT /me` - Update user profile
- `POST /change-password` - Change password
- `POST /logout` - Logout user

### AI Chat Support (`/api/v1/chat`)
- `POST /start-session` - Start new chat session
- `POST /sessions/{session_id}/message` - Send message
- `GET /sessions` - Get user chat sessions
- `GET /sessions/{session_id}` - Get specific session
- `POST /sessions/{session_id}/end` - End chat session
- `GET /emergency-resources` - Get crisis resources

### Psychological Assessments (`/api/v1/assessments`)
- `POST /` - Create new assessment
- `GET /` - Get user assessments
- `GET /{assessment_id}` - Get specific assessment
- `GET /summary/dashboard` - Get assessment summary
- `GET /types/available` - Get available assessment types
- `GET /questions/{assessment_type}` - Get assessment questions
- `GET /admin/high-risk` - Get high-risk assessments (admin)

### Appointments (`/api/v1/appointments`)
- Coming Soon...

### Resources (`/api/v1/resources`)
- Coming Soon...

### Peer Support (`/api/v1/peer-support`)
- Coming Soon...

### Admin Dashboard (`/api/v1/admin`)
- Coming Soon...

## 🧪 Testing

### Run Tests
```bash
# Run basic tests
python app/tests/test_emoticare.py

# Run with pytest (if installed)
pytest app/tests/

# Test specific assessment
python -c "
from app.services.assessment_service import assessment_service
from app.schemas.assessment import AssessmentType

# Test PHQ-9
responses = {
    'little_interest': 1,
    'feeling_down': 2,
    'trouble_sleeping': 1,
    'feeling_tired': 2,
    'poor_appetite': 0,
    'feeling_bad': 1,
    'trouble_concentrating': 2,
    'moving_slowly': 0,
    'thoughts_death': 0
}

result = assessment_service.process_assessment(AssessmentType.PHQ9, responses)
print(f'Score: {result.score}, Severity: {result.severity_level}')
print(f'Recommendations: {result.recommendations[:3]}...')
"
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:8000/health

# Get available assessments
curl http://localhost:8000/api/v1/assessments/types/available

# Get PHQ-9 questions
curl http://localhost:8000/api/v1/assessments/questions/phq9

# Register a user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@college.edu",
    "full_name": "Test Student",
    "password": "SecurePass123!",
    "student_id": "CS2024001",
    "department": "Computer Science",
    "year_of_study": "third_year"
  }'
```

## 🔧 Development Workflow

### 1. Adding New Features

#### Add new assessment type:
1. Add enum to `app/schemas/assessment.py`
2. Add processor to `app/services/assessment_service.py`
3. Add questions to `app/api/assessments.py`
4. Test the implementation

#### Add new API endpoint:
1. Create function in appropriate router (`app/api/`)
2. Add schema models if needed (`app/schemas/`)
3. Update main app router includes
4. Test with FastAPI docs

### 2. Database Operations

#### Add new collection:
1. Create schema in `app/schemas/`
2. Add model to `app/models/`
3. Create indexes in `app/database.py`
4. Add CRUD operations in appropriate API file

### 3. Security Considerations

#### Authentication:
- All sensitive endpoints require JWT token
- Role-based access control implemented
- Password strength validation enforced

#### Data Privacy:
- User data anonymized in admin views
- Sensitive information masked
- Crisis detection triggers appropriate alerts

## 🎯 Key Features Implementation

### 1. AI Chat Support
- **Technology**: LangChain + Azure OpenAI
- **Crisis Detection**: Keyword and pattern matching
- **Intervention**: Automatic escalation for high-risk cases
- **Context**: Maintains conversation history

### 2. Psychological Assessments
- **PHQ-9**: Depression screening (9 questions)
- **GAD-7**: Anxiety assessment (7 questions)
- **Scoring**: Standardized clinical scoring
- **Risk Assessment**: Automated risk level determination

### 3. Security & Privacy
- **JWT Authentication**: Secure token-based auth
- **Role-based Access**: Student/Counselor/Admin roles
- **Data Protection**: Sensitive data masking
- **Crisis Alerts**: Immediate attention flagging

## 🔧 Configuration

### Environment Variables
```bash
# Azure OpenAI (Required)
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# MongoDB (Required)
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/
DATABASE_NAME=emoticare

# JWT Security (Required)
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application
APP_NAME=EmotiCare
DEBUG=True
```

### Assessment Thresholds
```python
# PHQ-9 Depression Thresholds
PHQ9_MILD_THRESHOLD = 5
PHQ9_MODERATE_THRESHOLD = 10
PHQ9_SEVERE_THRESHOLD = 15

# GAD-7 Anxiety Thresholds
GAD7_MILD_THRESHOLD = 5
GAD7_MODERATE_THRESHOLD = 10
GAD7_SEVERE_THRESHOLD = 15
```

## 📊 Data Models

### User Roles
- **Student**: Can take assessments, chat, view resources
- **Counselor**: Can view high-risk cases, manage appointments
- **Admin**: Full system access, analytics, user management
- **Peer Volunteer**: Can moderate peer support forum

### Assessment Types
- **PHQ-9**: Depression screening
- **GAD-7**: Anxiety assessment
- **GHQ**: General health questionnaire
- **Stress Scale**: Perceived stress assessment
- **Sleep Quality**: Sleep disorder screening

### Risk Levels
- **Low**: Normal/minimal symptoms
- **Medium**: Mild to moderate symptoms
- **High**: Severe symptoms requiring attention
- **Critical**: Immediate intervention needed

## 🚀 Deployment Considerations

### Production Setup
1. Use production-grade WSGI server (Gunicorn)
2. Set up reverse proxy (Nginx)
3. Configure SSL certificates
4. Use production MongoDB cluster
5. Set up proper logging and monitoring
6. Configure backup strategies

### Security Checklist
- [ ] Change default SECRET_KEY
- [ ] Use strong database passwords
- [ ] Enable HTTPS in production
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Regular security audits

## 📞 Support & Contact

For development questions or issues:
- Check API documentation at `/docs`
- Review error logs in application
- Test with provided sample data
- Refer to schema documentation

## 🎯 Roadmap

### Phase 1 (Current)
- [x] Basic project structure
- [x] Authentication system
- [x] AI chat support
- [x] Psychological assessments
- [ ] Complete appointment system
- [ ] Resource management
- [ ] Peer support platform
- [ ] Admin dashboard

### Phase 2 (Future)
- [ ] Mobile app integration
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Integration with college systems
- [ ] Telemedicine features
- [ ] Machine learning insights

Happy coding! 🎉