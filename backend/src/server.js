import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import userRoutes from './routes/users.js';
import aiRoutes from './routes/ai.js';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEBUG_LOG_PATH = path.join(__dirname, '..', '..', '.cursor', 'debug.log');

const serviceAccount = JSON.parse(
  fs.readFileSync(new URL('./config/sdgp-cs75-firebase-adminsdk-fbsvc-5684359436.json', import.meta.url))
);


dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log('Firebase Admin initialized');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Request-level debug logging for all backend calls
app.use((req, res, next) => {
  try {
    const dir = path.dirname(DEBUG_LOG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(
      DEBUG_LOG_PATH,
      JSON.stringify({
        location: 'server.js:request',
        message: 'Incoming request',
        data: { method: req.method, url: req.originalUrl, ip: req.ip },
        timestamp: Date.now(),
        hypothesisId: 'E',
      }) + '\n'
    );
  } catch {}
  next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Debug relay: app sends logs here when running on device (so they get written on dev machine)
app.post('/api/debug-log', (req, res) => {
  try {
    const dir = path.dirname(DEBUG_LOG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(DEBUG_LOG_PATH, JSON.stringify(req.body) + '\n');
  } catch (_) {}
  res.status(204).end();
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
