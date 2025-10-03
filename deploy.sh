#!/bin/bash

echo "🚀 Prospello Deployment Script for Vercel"
echo "=========================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel:"
    vercel login
fi

echo "📦 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment initiated!"
echo ""
echo "📋 Next Steps:"
echo "1. Go to your Vercel dashboard"
echo "2. Set environment variables in Project Settings"
echo "3. Set up PostgreSQL database (recommended: Vercel Postgres)"
echo "4. Run 'npm run db:seed' to populate demo data"
echo ""
echo "🔗 Your app will be available at the URL shown above"
