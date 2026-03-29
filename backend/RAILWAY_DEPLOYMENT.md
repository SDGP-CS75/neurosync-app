# Railway Deployment Guide for NeuroSync Backend

This guide explains how to deploy the NeuroSync backend to Railway.

## Prerequisites

1. A Railway account (sign up at [railway.app](https://railway.app))
2. Railway CLI installed (optional, but recommended)
3. Your Firebase service account credentials

## Deployment Steps

### Option 1: Deploy via Railway Dashboard (Recommended)

1. **Create a new project in Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account and select the repository

2. **Configure the backend service**
   - Railway will automatically detect the `railway.json` configuration
   - The service will be built using the Dockerfile

3. **Set environment variables**
   - Go to your service's "Variables" tab
   - Add all required environment variables (see list below)

4. **Deploy**
   - Railway will automatically deploy your application
   - Monitor the build logs for any issues

### Option 2: Deploy via Railway CLI

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize project**
   ```bash
   cd backend
   railway init
   ```

4. **Set environment variables**
   ```bash
   railway variables set VARIABLE_NAME=value
   ```

5. **Deploy**
   ```bash
   railway up
   ```

## Required Environment Variables

### Firebase Configuration (Required)

| Variable | Description | How to Get |
|----------|-------------|------------|
| `FIREBASE_SERVICE_ACCOUNT` | Complete Firebase service account JSON as a string | Copy the entire JSON content from your Firebase service account file and stringify it |

**Example format for `FIREBASE_SERVICE_ACCOUNT`:**
```json
{"type":"service_account","project_id":"sdgp-cs75","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"...","universe_domain":"googleapis.com"}
```

### Supabase Configuration (Required)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |

### AI Service Configuration (Required)

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `GROQ_API_KEY` | Your Groq API key |
| `GROQ_MODEL` | Groq model to use (default: `llama-3.1-8b-instant`) |

### Authentication (Required)

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret key for JWT token generation |

### CORS Configuration (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `CORS_ORIGIN` | Allowed origin for CORS | `https://your-frontend-domain.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port the server runs on | `8080` |
| `NODE_ENV` | Node environment | `production` |

## How to Stringify Firebase Service Account

To convert your Firebase service account JSON to a string for the `FIREBASE_SERVICE_ACCOUNT` environment variable:

### Option 1: Using Node.js
```javascript
const fs = require('fs');
const serviceAccount = JSON.parse(fs.readFileSync('path/to/your/firebase-adminsdk.json'));
console.log(JSON.stringify(serviceAccount));
```

### Option 2: Using Online Tool
1. Copy the entire content of your Firebase service account JSON file
2. Use an online JSON minifier/stringifier
3. Copy the result and use it as the environment variable value

### Option 3: Using Command Line
```bash
cat path/to/your/firebase-adminsdk.json | jq -c .
```

## Post-Deployment

1. **Get your Railway URL**
   - Railway will provide a URL like `https://your-app-name.railway.app`
   - Use this URL in your frontend configuration

2. **Update CORS_ORIGIN**
   - Set `CORS_ORIGIN` to your frontend's domain
   - For development, you can use `*` (not recommended for production)

3. **Test the deployment**
   - Visit `https://your-app-name.railway.app/health` to check if the server is running
   - You should see: `{"status":"ok","timestamp":"...","uptime":...}`

4. **Monitor logs**
   - Check Railway dashboard for logs and metrics
   - Set up alerts for any issues

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify the Dockerfile is correct
- Check build logs in Railway dashboard

### Application Crashes on Startup
- Verify all required environment variables are set
- Check that `FIREBASE_SERVICE_ACCOUNT` is properly formatted
- Review application logs in Railway dashboard

### CORS Errors
- Ensure `CORS_ORIGIN` is set correctly
- Check that your frontend is using the correct backend URL

### Firebase Authentication Errors
- Verify `FIREBASE_SERVICE_ACCOUNT` is correctly stringified
- Check that the service account has the necessary permissions

## Security Notes

1. **Never commit sensitive credentials to Git**
   - Use environment variables for all secrets
   - The `.gitignore` file already excludes Firebase credentials

2. **Use strong JWT secrets**
   - Generate a random string for `JWT_SECRET`
   - Use at least 32 characters

3. **Restrict CORS origins**
   - Don't use `*` in production
   - Only allow your frontend domain

4. **Monitor your application**
   - Set up Railway alerts
   - Regularly check logs for suspicious activity

## Support

For issues with:
- Railway deployment: Check [Railway Documentation](https://docs.railway.app)
- Firebase: Check [Firebase Documentation](https://firebase.google.com/docs)
- Application issues: Check the application logs in Railway dashboard
