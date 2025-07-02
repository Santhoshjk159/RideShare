#!/bin/bash

# CampusCruze Vercel Deployment Script
echo "🚀 Starting CampusCruze deployment to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Function to deploy backend
deploy_backend() {
    echo "📦 Deploying backend..."
    cd backend
    
    # Check if .env exists
    if [ ! -f .env ]; then
        echo "⚠️  Backend .env file not found. Please create it from .env.example"
        exit 1
    fi
    
    # Deploy to Vercel
    vercel --prod --confirm
    
    if [ $? -eq 0 ]; then
        echo "✅ Backend deployed successfully!"
        echo "🔗 Note your backend URL for frontend configuration"
    else
        echo "❌ Backend deployment failed"
        exit 1
    fi
    
    cd ..
}

# Function to deploy frontend
deploy_frontend() {
    echo "🎨 Deploying frontend..."
    cd campus-ride-share
    
    # Check if .env.production exists
    if [ ! -f .env.production ]; then
        echo "⚠️  Frontend .env.production file not found. Please create it from .env.example"
        exit 1
    fi
    
    # Install dependencies
    npm install
    
    # Deploy to Vercel
    vercel --prod --confirm
    
    if [ $? -eq 0 ]; then
        echo "✅ Frontend deployed successfully!"
        echo "🎉 Your CampusCruze app is now live!"
    else
        echo "❌ Frontend deployment failed"
        exit 1
    fi
    
    cd ..
}

# Main deployment process
echo "🔍 Starting deployment process..."

# Deploy backend first
deploy_backend

# Deploy frontend
deploy_frontend

echo ""
echo "🎉 Deployment completed!"
echo "📋 Next steps:"
echo "1. Visit your frontend URL to test the application"
echo "2. Login with admin credentials: admin@campuscruze.com / admin123"
echo "3. Change the admin password in production"
echo "4. Test all major features"
echo ""
echo "📚 For troubleshooting, check VERCEL-DEPLOYMENT-GUIDE.md"
