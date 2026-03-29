# Vercel Deployment Guide for NeuroSync

This guide provides detailed instructions for deploying NeuroSync to Vercel.

## Table of Contents

- [Frontend Deployment](#frontend-deployment)
  - [Option 1: Deploy via Vercel Dashboard](#option-1-deploy-via-vercel-dashboard)
  - [Option 2: Deploy via Vercel CLI](#option-2-deploy-via-vercel-cli)
  - [Option 3: Deploy via GitHub Integration](#option-3-deploy-via-github-integration)
- [Backend Deployment](#backend-deployment)
  - [Option 1: Vercel Serverless Functions](#option-1-vercel-serverless-functions)
  - [Option 2: Vercel with External Backend](#option-2-vercel-with-external-backend)
- [Environment Variables](#environment-variables)
- [Custom Domain](#custom-domain)
- [Troubleshooting](#troubleshooting)

---

## Frontend Deployment

### Prerequisites

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Install Vercel CLI (optional):
   ```bash
   npm install -g vercel
   ```

### Option 1: Deploy via Vercel Dashboard

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"

2. **Import Your Repository**
   - Connect your GitHub/GitLab/Bitbucket account
   - Select your NeuroSync repository

3. **Configure Project**
   - **Framework Preset**: Select "Other"
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build:web`
   - **Output Directory**: `web-build`
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   ```
   EXPO_PUBLIC_API_URL=https://your-backend-url.com
   EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   ```

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your app
   - You'll get a URL like: `https://neurosync-app.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Navigate to Frontend Directory**
   ```bash
   cd frontend
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Follow the Prompts**
   - Set up and deploy: `Y`
   - Which scope: Select your account
   - Link to existing project: `N`
   - Project name: `neurosync-app` (or your preferred name)
   - Directory: `./` (current directory)
   - Override settings: `N`

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Option 3: Deploy via GitHub Integration

1. **Connect GitHub Repository**
   - In Vercel Dashboard, go to "Settings" → "Git"
   - Connect your GitHub account
   - Select your repository

2. **Configure Auto-Deploy**
   - Vercel will automatically deploy on every push to main branch
   - Preview deployments are created for pull requests

3. **Configure Build Settings**
   - Go to "Settings" → "General"
   - Set:
     - Framework Preset: Other
     - Root Directory: `frontend`
     - Build Command: `npm run build:web`
     - Output Directory: `web-build`

---

## Backend Deployment

### Option 1: Vercel Serverless Functions

Vercel supports serverless functions, which can work for your Express backend with some modifications.

#### Steps:

1. **Create `api` Directory**
   Create a new directory structure in your backend:
   ```
   backend/
   ├── api/
   │   ├── ai/
   │   │   └── [...route].js
   │   └── users/
   │       └── [...route].js
   ├── src/
   ├── vercel.json
   └── package.json
   ```

2. **Create `vercel.json`**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "src/server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "src/server.js"
       }
     ]
   }
   ```

3. **Create API Route Handler**
   Create `api/[...route].js`:
   ```javascript
   import express from 'express';
   import cors from 'cors';
   import dotenv from 'dotenv';
   
   dotenv.config();
   
   const app = express();
   
   app.use(cors());
   app.use(express.json());
   
   // Import your routes
   import aiRoutes from '../src/routes/ai.js';
   import userRoutes from '../src/routes/users.js';
   
   app.use('/api/ai', aiRoutes);
   app.use('/api/users', userRoutes);
   
   export default app;
   ```

4. **Deploy Backend**
   ```bash
   cd backend
   vercel --prod
   ```

5. **Set Environment Variables**
   In Vercel Dashboard:
   - Go to your backend project
   - Settings → Environment Variables
   - Add all backend environment variables

### Option 2: Vercel with External Backend

For a more robust backend, deploy to a dedicated backend platform and use Vercel only for frontend.

#### Recommended Backend Platforms:

1. **Railway** (Recommended)
   - Free tier available
   - Easy deployment
   - Good for Node.js apps
   ```bash
   cd backend
   railway up
   ```

2. **Render**
   - Free tier available
   - Automatic deploys from GitHub
   - Good for Node.js apps

3. **Heroku**
   - Paid plans only
   - Well-established platform
   - Good documentation

4. **DigitalOcean App Platform**
   - Affordable
   - Good performance
   - Easy scaling

#### Configuration:

1. **Deploy Backend to Railway**
   ```bash
   cd backend
   npm install -g @railway/cli
   railway login
   railway up
   ```

2. **Get Backend URL**
   Railway will provide a URL like: `https://neurosync-api.railway.app`

3. **Update Frontend Environment Variable**
   In Vercel Dashboard:
   - Go to your frontend project
   - Settings → Environment Variables
   - Update `EXPO_PUBLIC_API_URL` to your Railway backend URL

---

## Environment Variables

### Frontend Environment Variables

Set these in Vercel Dashboard → Your Project → Settings → Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | `https://neurosync-api.railway.app` |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase API key | `AIza...` |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `neurosync-prod.firebaseapp.com` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | `neurosync-prod` |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `neurosync-prod.appspot.com` |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | `123456789` |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | `1:123456789:web:abc123` |

### Backend Environment Variables

If deploying backend to Vercel:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `production` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | `neurosync-prod` |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | `-----BEGIN PRIVATE KEY-----...` |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email | `firebase-adminsdk-...@...iam.gserviceaccount.com` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `CORS_ORIGIN` | Allowed frontend origin | `https://neurosync-app.vercel.app` |

---

## Custom Domain

### Add Custom Domain to Vercel

1. **Go to Vercel Dashboard**
   - Select your project
   - Go to "Settings" → "Domains"

2. **Add Domain**
   - Enter your domain: `neurosync.com`
   - Click "Add"

3. **Configure DNS**
   Vercel will provide DNS records to add:
   - **A Record**: Point to Vercel's IP
   - **CNAME Record**: Point `www` to `cname.vercel-dns.com`

4. **Update DNS Provider**
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Add the DNS records provided by Vercel

5. **Wait for Propagation**
   - DNS changes can take up to 48 hours
   - Vercel will automatically provision SSL certificate

### Update Environment Variables

After adding custom domain:
1. Update `EXPO_PUBLIC_API_URL` in frontend to use your custom domain
2. Update `CORS_ORIGIN` in backend to use your custom domain

---

## Troubleshooting

### Build Fails

**Problem**: Build fails with "command not found"
- **Solution**: Check build command in Vercel settings
- Ensure `npm run build:web` works locally

**Problem**: Build fails with "out of memory"
- **Solution**: Increase build memory in Vercel settings
- Or optimize your build process

### Environment Variables Not Working

**Problem**: Environment variables are undefined
- **Solution**: 
  1. Check variable names start with `EXPO_PUBLIC_`
  2. Redeploy after adding variables
  3. Check variable values in Vercel dashboard

### API Calls Fail

**Problem**: CORS errors
- **Solution**:
  1. Update `CORS_ORIGIN` in backend to match Vercel URL
  2. Include both `https://neurosync-app.vercel.app` and your custom domain

**Problem**: API URL incorrect
- **Solution**:
  1. Check `EXPO_PUBLIC_API_URL` in Vercel environment variables
  2. Ensure it includes `https://`
  3. No trailing slash

### Deployment Not Updating

**Problem**: Changes not reflected after push
- **Solution**:
  1. Check Vercel deployment logs
  2. Clear build cache: Vercel Dashboard → Settings → Clear Build Cache
  3. Manually redeploy: Deployments → Redeploy

### 404 Errors

**Problem**: Routes return 404
- **Solution**:
  1. Check `vercel.json` configuration
  2. Ensure routes are properly configured
  3. Check build output directory

---

## Vercel-Specific Features

### Preview Deployments

Vercel automatically creates preview deployments for pull requests:
- Each PR gets a unique URL
- Perfect for testing before merging
- Automatically deleted when PR is closed

### Analytics

Vercel provides built-in analytics:
- Page views
- Performance metrics
- User geography
- Device information

### Speed Insights

Monitor your app's performance:
- Core Web Vitals
- Loading times
- Performance scores

### Edge Functions

For better performance, consider using Vercel Edge Functions:
- Faster response times
- Global distribution
- Lower latency

---

## Cost

### Vercel Pricing

**Hobby Plan (Free)**:
- 100GB bandwidth/month
- 100GB storage
- Unlimited deployments
- Preview deployments
- Custom domains

**Pro Plan ($20/month)**:
- 1TB bandwidth/month
- 100GB storage
- Team collaboration
- Advanced analytics
- Priority support

**Enterprise Plan (Custom)**:
- Custom bandwidth
- Dedicated support
- SLA guarantees
- Advanced security

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Custom Domains](https://vercel.com/docs/projects/domains)
- [Vercel Serverless Functions](https://vercel.com/docs/serverless-functions)

---

## Quick Reference

### Deploy Frontend
```bash
cd frontend
vercel --prod
```

### Deploy Backend (Serverless)
```bash
cd backend
vercel --prod
```

### Deploy Both
```bash
# Frontend
cd frontend && vercel --prod && cd ..

# Backend
cd backend && vercel --prod && cd ..
```

### Update Environment Variables
1. Go to Vercel Dashboard
2. Select project
3. Settings → Environment Variables
4. Add/Update variables
5. Redeploy

### View Deployment Logs
1. Go to Vercel Dashboard
2. Select project
3. Deployments
4. Click on deployment
5. View "Build Logs" or "Function Logs"
