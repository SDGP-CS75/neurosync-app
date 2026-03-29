import express from 'express';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import userRoutes from './routes/users.js';
import aiRoutes from './routes/ai.js';
import fs from 'fs';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEBUG_LOG_PATH = path.join(__dirname, '..', '..', '.cursor', 'debug.log');

// Initialize Firebase Admin with credentials from environment variable or file
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Use credentials from environment variable (for Railway deployment)
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  console.log('Firebase Admin initialized from environment variable');
} else {
  // Fall back to reading from file (for local development)
  serviceAccount = JSON.parse(
    fs.readFileSync(new URL('./config/sdgp-cs75-firebase-adminsdk-fbsvc-5684359436.json', import.meta.url))
  );
  console.log('Firebase Admin initialized from file');
}

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log('Firebase Admin initialized');

const app = express();

// Compression middleware for better performance
app.use(compression());

// CORS configuration
app.use(cors());

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parser with size limits
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

// Request-level debug logging for all backend calls (async to avoid blocking)
app.use((req, res, next) => {
  const logEntry = JSON.stringify({
    location: 'server.js:request',
    message: 'Incoming request',
    data: { method: req.method, url: req.originalUrl, ip: req.ip },
    timestamp: Date.now(),
    hypothesisId: 'E',
  }) + '\n';
  
  // Non-blocking async write
  const dir = path.dirname(DEBUG_LOG_PATH);
  fs.promises.mkdir(dir, { recursive: true })
    .then(() => fs.promises.appendFile(DEBUG_LOG_PATH, logEntry))
    .catch(() => {}); // Silently fail to avoid blocking requests
  
  next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Debug relay: app sends logs here when running on device (so they get written on dev machine)
app.post('/api/debug-log', (req, res) => {
  const logEntry = JSON.stringify(req.body) + '\n';
  const dir = path.dirname(DEBUG_LOG_PATH);
  
  // Non-blocking async write
  fs.promises.mkdir(dir, { recursive: true })
    .then(() => fs.promises.appendFile(DEBUG_LOG_PATH, logEntry))
    .catch(() => {});
  
  res.status(204).end();
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});