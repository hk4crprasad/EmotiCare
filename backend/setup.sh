#!/bin/bash

# EmotiCare Startup Script

echo "🧠 Starting EmotiCare - Digital Mental Health Support System"
echo "=================================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️ Warning: .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "Please edit .env file with your configuration before running the application."
    exit 1
fi

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "API Documentation will be available at:"
echo "http://localhost:8000/docs"
echo ""
echo "Happy coding! 🚀"