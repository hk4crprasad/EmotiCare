# EmotiCare - Digital Mental Health Support System

A comprehensive digital mental health and psychological support system designed specifically for students in higher education institutions.

## Features

- **AI-guided First-Aid Support**: Interactive chatbot with coping strategies
- **Confidential Booking System**: Appointment scheduling with counselors
- **Psychoeducational Resources**: Multilingual wellness content
- **Peer Support Platform**: Moderated community forum
- **Admin Dashboard**: Analytics and intervention planning

## Tech Stack

- **Backend**: FastAPI, Python
- **AI/ML**: LangChain, Azure OpenAI
- **Database**: MongoDB (Azure Cosmos DB)
- **Authentication**: JWT tokens with role-based access
- **Analytics**: Pandas, NumPy, Scikit-learn

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the application:
```bash
uvicorn app.main:app --reload
```

## API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation.

## Project Structure

```
EmotiCare/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration settings
│   ├── database.py             # Database connection
│   ├── models/                 # Database models
│   ├── schemas/                # Pydantic schemas
│   ├── api/                    # API routes
│   ├── services/               # Business logic
│   ├── utils/                  # Utility functions
│   └── tests/                  # Test files
├── static/                     # Static files
├── templates/                  # HTML templates
├── requirements.txt            # Python dependencies
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## License

Open Source - Educational Use