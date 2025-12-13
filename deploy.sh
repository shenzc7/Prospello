#!/bin/bash
set -euo pipefail

echo "🚀 OKRFlow Vercel Deployment"
echo "============================"

if ! command -v vercel >/dev/null 2>&1; then
  echo "❌ Vercel CLI not found. Install it first: npm install -g vercel"
  exit 1
fi

if ! vercel whoami >/dev/null 2>&1; then
  echo "🔐 Login required..."
  vercel login
fi

echo "🔎 Running local verification (lint → tests → build)..."
npm run verify

echo "🗄️ Checking Prisma migrations..."
npx prisma migrate status

echo "🌐 Ensuring Vercel project link..."
vercel pull --yes --environment=production

echo "📦 Building production artifacts locally..."
vercel build --prod

echo "🚀 Deploying prebuilt artifacts..."
vercel deploy --prebuilt --prod --yes

echo "✅ Deployment triggered! Post-deploy checklist:"
echo "  1. Apply database migrations to production (npx prisma migrate deploy)."
echo "  2. Hit https://<your-app>.vercel.app/api/health to confirm dependencies."
echo "  3. Monitor cron endpoints configured in vercel.json."
