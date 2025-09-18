from decouple import config
import os

class Settings:
    # Azure OpenAI Configuration
    AZURE_OPENAI_ENDPOINT: str = config("AZURE_OPENAI_ENDPOINT")
    AZURE_OPENAI_DEPLOYMENT: str = config("AZURE_OPENAI_DEPLOYMENT")
    AZURE_OPENAI_API_KEY: str = config("AZURE_OPENAI_API_KEY")
    AZURE_OPENAI_API_VERSION: str = config("AZURE_OPENAI_API_VERSION")
    
    # Azure Storage Configuration
    AZURE_STORAGE_CONNECTION_STRING: str = config("AZURE_STORAGE_CONNECTION_STRING")
    AZURE_CONTAINER_NAME: str = config("AZURE_CONTAINER_NAME")
    
    # MongoDB Configuration
    MONGODB_URL: str = config("MONGODB_URL")
    DATABASE_NAME: str = config("DATABASE_NAME", default="emoticare")
    
    # JWT Configuration
    SECRET_KEY: str = config("SECRET_KEY")
    ALGORITHM: str = config("ALGORITHM", default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = config("ACCESS_TOKEN_EXPIRE_MINUTES", default=30, cast=int)
    
    # Application Configuration
    APP_NAME: str = config("APP_NAME", default="EmotiCare")
    APP_VERSION: str = config("APP_VERSION", default="1.0.0")
    DEBUG: bool = config("DEBUG", default=False, cast=bool)
    
    # Email Configuration
    SMTP_HOST: str = config("SMTP_HOST", default="smtp.gmail.com")
    SMTP_PORT: int = config("SMTP_PORT", default=587, cast=int)
    SMTP_USER: str = config("SMTP_USER", default="")
    SMTP_PASSWORD: str = config("SMTP_PASSWORD", default="")
    
    # Voice Chat Configuration
    DEEPGRAM_API_KEY: str = config("DEEPGRAM_API_KEY")
    AZURE_SPEECH_KEY: str = config("AZURE_SPEECH_KEY")
    AZURE_SPEECH_REGION: str = config("AZURE_SPEECH_REGION")
    AZURE_SPEECH_VOICE: str = config("AZURE_SPEECH_VOICE", default="en-US-JennyNeural")
    
    # Psychological Assessment Thresholds
    PHQ9_MILD_THRESHOLD: int = 5
    PHQ9_MODERATE_THRESHOLD: int = 10
    PHQ9_SEVERE_THRESHOLD: int = 15
    
    GAD7_MILD_THRESHOLD: int = 5
    GAD7_MODERATE_THRESHOLD: int = 10
    GAD7_SEVERE_THRESHOLD: int = 15
    
    # File Upload Configuration
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set = {'.pdf', '.doc', '.docx', '.txt', '.mp3', '.mp4', '.avi'}
    
    class Config:
        case_sensitive = True

settings = Settings()