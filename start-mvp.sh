#!/bin/bash

echo "🚀 Starting Pricing Power Portfolio MVP..."
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

echo "📦 Installing backend dependencies..."
cd backend
pip3 install -r requirements.txt

echo ""
echo "🗄️ Initializing database..."
cd ..

echo ""
echo "🎯 Starting FastAPI backend server..."
cd backend
python3 -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

echo ""
echo "⏳ Waiting for backend to start..."
sleep 5

echo ""
echo "🎨 Starting React frontend..."
npm install
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ MVP is running!"
echo ""
echo "📊 Backend API: http://localhost:8000"
echo "📊 API Docs: http://localhost:8000/docs"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Shutting down...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait