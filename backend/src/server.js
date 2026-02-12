import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import userRoutes from './routes/users.js';
import fs from 'fs';

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

// Routes
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Server is running!');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
