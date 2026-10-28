import 'dotenv/config';
import admin from 'firebase-admin';
import fs from 'fs';
import { createApp } from './app.js';

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }

  const configPath = new URL(
    './config/sdgp-cs75-firebase-adminsdk-fbsvc-5684359436.json',
    import.meta.url
  );
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  throw new Error(
    'Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT or provide the local service account file.'
  );
}

function initializeFirebase() {
  if (admin.apps.length > 0) return;

  const serviceAccount = loadServiceAccount();
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

function parsePort(value) {
  const port = Number(value || 8080);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  return port;
}

function startServer() {
  initializeFirebase();

  const port = parsePort(process.env.PORT);
  const app = createApp();
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  let shuttingDown = false;
  const gracefulShutdown = (signal, exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received; shutting down`);

    const forceExit = setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    server.close(() => {
      clearTimeout(forceExit);
      process.exit(exitCode);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception', { name: error.name });
    gracefulShutdown('uncaughtException', 1);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection', {
      name: reason instanceof Error ? reason.name : typeof reason,
    });
  });
}

try {
  startServer();
} catch (error) {
  console.error('Failed to start server', { name: error.name });
  process.exit(1);
}
