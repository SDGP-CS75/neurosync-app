# NeuroSync Deployment Guide

This guide covers deploying both the backend API server and the frontend mobile/web application.

## Table of Contents

- [Backend Deployment](#backend-deployment)
  - [Option 1: Railway (Recommended)](#option-1-railway-recommended)
  - [Option 2: Render](#option-2-render)
  - [Option 3: Heroku](#option-3-heroku)
  - [Option 4: AWS/DigitalOcean](#option-4-awsdigitalocean)
- [Frontend Deployment](#frontend-deployment)
  - [Mobile App (iOS/Android)](#mobile-app-iosandroid)
  - [Web Deployment](#web-deployment)
- [Environment Variables](#environment-variables)
- [Post-Deployment Checklist](#post-deployment-checklist)

---

## Backend Deployment

### Prerequisites

1. Ensure your backend code is production-ready
2. Set up a production Firebase project
3. Obtain production API keys (OpenAI, etc.)
4. Choose a hosting platform

### Option 1: Railway (Recommended)

Railway is a modern platform that's easy to use and has a generous free tier.

#### Steps:

1. **Create a Railway account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Install Railway CLI** (optional but recommended)
   ```bash
   npm install -g @railway/cli
   ```

3. **Deploy via GitHub**
   - Connect your GitHub repository
   - Railway will automatically detect the Node.js project
   - Set the root directory to `backend`

4. **Configure Environment Variables**
   In Railway dashboard, add these variables:
   ```
   PORT=3000
   NODE_ENV=production
   FIREBASE_PROJECT_ID=your_production_firebase_project_id
   FIREBASE_PRIVATE_KEY=your_production_firebase_private_key
   FIREBASE_CLIENT_EMAIL=your_production_firebase_client_email
   OPENAI_API_KEY=your_openai_api_key
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

5. **Deploy**
   - Railway will automatically deploy on every push to main
   - Your API will be available at: `https://your-app.railway.app`

### Option 2: Render

Render offers free static sites and affordable backend hosting.

#### Steps:

1. **Create a Render account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create a new Web Service**
   - Connect your GitHub repository
   - Set root directory to `backend`
   - Build command: `npm install`
   - Start command: `npm start`

3. **Configure Environment Variables**
   Add the same environment variables as listed above

4. **Deploy**
   - Render will automatically deploy
   - Your API will be available at: `https://your-app.onrender.com`

### Option 3: Heroku

Heroku is a popular platform, though it no longer offers a free tier.

#### Steps:

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create a new Heroku app**
   ```bash
   cd backend
   heroku create neurosync-api
   ```

4. **Add a Procfile**
   Create a file named `Procfile` in the backend directory:
   ```
   web: node src/server.js
   ```

5. **Configure Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set FIREBASE_PROJECT_ID=your_project_id
   heroku config:set FIREBASE_PRIVATE_KEY=your_private_key
   heroku config:set FIREBASE_CLIENT_EMAIL=your_client_email
   heroku config:set OPENAI_API_KEY=your_openai_key
   heroku config:set CORS_ORIGIN=https://your-frontend-domain.com
   ```

6. **Deploy**
   ```bash
   git push heroku main
   ```

### Option 4: AWS/DigitalOcean

For more control and scalability, consider AWS or DigitalOcean.

#### AWS Elastic Beanstalk:

1. **Install AWS CLI and EB CLI**
   ```bash
   pip install awscli awsebcli
   ```

2. **Initialize EB application**
   ```bash
   cd backend
   eb init
   ```

3. **Create environment**
   ```bash
   eb create neurosync-api-env
   ```

4. **Deploy**
   ```bash
   eb deploy
   ```

#### DigitalOcean App Platform:

1. Create a new app in DigitalOcean dashboard
2. Connect your GitHub repository
3. Set source directory to `backend`
4. Configure environment variables
5. Deploy

---

## Frontend Deployment

### Mobile App (iOS/Android)

#### Prerequisites:

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure EAS Project**
   Your project is already configured with EAS in `app.json` and `eas.json`.

#### Building for Production:

1. **Build for Android**
   ```bash
   cd frontend
   eas build --platform android --profile production
   ```

2. **Build for iOS**
   ```bash
   cd frontend
   eas build --platform ios --profile production
   ```

3. **Build for Both**
   ```bash
   eas build --platform all --profile production
   ```

#### Submitting to App Stores:

**Google Play Store:**

1. Create a Google Play Developer account ($25 one-time fee)
2. Create a new application in Google Play Console
3. Upload your AAB file from EAS build
4. Fill in store listing details
5. Submit for review

**Apple App Store:**

1. Create an Apple Developer account ($99/year)
2. Create a new app in App Store Connect
3. Upload your IPA file from EAS build
4. Fill in app information
5. Submit for review

#### Using EAS Submit:

```bash
# Submit to Google Play
eas submit --platform android

# Submit to Apple App Store
eas submit --platform ios
```

### Web Deployment

Your Expo app can also be deployed as a web application.

#### Build for Web:

```bash
cd frontend
npm run build:web
```

This creates a `web-build` directory with static files.

#### Deploy to Vercel (Recommended):

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel
   ```

3. **Configure**
   - Set build command: `npm run build:web`
   - Set output directory: `web-build`
   - Add environment variables

#### Deploy to Netlify:

1. **Create a Netlify account**
   - Go to [netlify.com](https://netlify.com)

2. **Connect your repository**
   - Link your GitHub repository
   - Set build command: `npm run build:web`
   - Set publish directory: `web-build`

3. **Configure environment variables**
   Add all `EXPO_PUBLIC_*` variables

4. **Deploy**
   - Netlify will automatically deploy on push

#### Deploy to GitHub Pages:

1. **Install gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add deploy script to package.json**
   ```json
   {
     "scripts": {
       "deploy": "npm run build:web && gh-pages -d web-build"
     }
   }
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

---

## Environment Variables

### Backend Production Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `production` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | `neurosync-prod` |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | `-----BEGIN PRIVATE KEY-----...` |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email | `firebase-adminsdk-...@...iam.gserviceaccount.com` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `CORS_ORIGIN` | Allowed frontend origin | `https://neurosync.vercel.app` |

### Frontend Production Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | `https://neurosync-api.railway.app` |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase API key | `AIza...` |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `neurosync-prod.firebaseapp.com` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | `neurosync-prod` |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `neurosync-prod.appspot.com` |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | `123456789` |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | `1:123456789:web:abc123` |

---

## Post-Deployment Checklist

### Backend

- [ ] API is accessible at production URL
- [ ] All endpoints respond correctly
- [ ] CORS is configured for production frontend URL
- [ ] Environment variables are set correctly
- [ ] Firebase authentication works
- [ ] OpenAI API calls work (if applicable)
- [ ] Error handling is in place
- [ ] Rate limiting is configured
- [ ] Logs are accessible

### Frontend

- [ ] App builds successfully
- [ ] API URL points to production backend
- [ ] Firebase configuration is for production
- [ ] All features work correctly
- [ ] Authentication flow works
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] App store listings are complete (for mobile)

### Security

- [ ] API keys are not exposed in client code
- [ ] Firebase security rules are configured
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Input validation is in place
- [ ] Error messages don't leak sensitive information

---

## Troubleshooting

### Backend Issues

**Problem**: API returns 500 error
- Check server logs
- Verify environment variables are set
- Ensure Firebase credentials are correct

**Problem**: CORS errors
- Verify `CORS_ORIGIN` matches your frontend URL
- Check for trailing slashes in URLs

**Problem**: Firebase authentication fails
- Verify Firebase project ID and credentials
- Check Firebase security rules

### Frontend Issues

**Problem**: Build fails
- Run `npm run typecheck` to check for TypeScript errors
- Run `npm run lint` to check for linting errors
- Clear cache: `expo start -c`

**Problem**: API calls fail
- Verify `EXPO_PUBLIC_API_URL` is correct
- Check network connectivity
- Verify backend is running

**Problem**: App crashes on startup
- Check for missing environment variables
- Verify Firebase configuration
- Check for JavaScript errors in logs

---

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review platform-specific documentation
3. Check server logs for errors
4. Verify all environment variables are set correctly
