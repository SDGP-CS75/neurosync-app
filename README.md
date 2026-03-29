# NeuroSync

A productivity application with AI-powered features, built with React Native (Expo) for the frontend and Node.js (Express) for the backend.

## 🚀 Features

- **Daily Routine Management** - Create and manage personalized daily routines
- **Focus Timer** - Pomodoro-style timer with customizable intervals
- **Todo List** - Task management with prioritization and due dates
- **AI-Powered Suggestions** - Smart recommendations for routines and tasks
- **Mood Tracking** - Track and analyze daily moods
- **Calendar Integration** - Calendar view for scheduling and planning
- **Session History** - Track focus session history and statistics
- **User Authentication** - Secure sign-up and login with Firebase
- **Profile & Settings** - Personalized user experience with theme customization

## 📁 Project Structure

```
neurosync-app/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   │   └── firebase-adminsdk.json
│   │   ├── controllers/    # Request handlers
│   │   │   ├── aiController.js
│   │   │   └── userController.js
│   │   ├── middleware/     # Custom middleware
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── routes/         # API routes
│   │   │   ├── ai.js
│   │   │   └── users.js
│   │   ├── services/       # Business logic
│   │   │   └── aiCalibration.js
│   │   ├── types/          # TypeScript types
│   │   │   └── index.js
│   │   ├── utils/          # Utility functions
│   │   │   └── validators.js
│   │   └── server.js       # Entry point
│   ├── .env.example
│   ├── .gitignore
│   ├── package-lock.json
│   ├── package.json
│   └── README.md
│
├── frontend/               # React Native/Expo mobile app
│   ├── app/               # Expo Router pages
│   │   ├── (auth)/       # Authentication routes
│   │   │   ├── _layout.tsx
│   │   │   ├── signIn.tsx
│   │   │   ├── signUp.tsx
│   │   │   ├── welcome.tsx
│   │   │   ├── welcome2.tsx
│   │   │   ├── welcome3.tsx
│   │   │   └── forgotPassword.tsx
│   │   ├── (tabs)/       # Tab-based routes
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx
│   │   │   ├── home.tsx
│   │   │   ├── daily-routine.tsx
│   │   │   ├── focus-timer.tsx
│   │   │   ├── focus-timer-counting.tsx
│   │   │   ├── todo-list.tsx
│   │   │   ├── add-task.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── mood-tracking.tsx
│   │   │   ├── mood-analysis.tsx
│   │   │   ├── session-history.tsx
│   │   │   ├── profile.tsx
│   │   │   └── settings.tsx
│   │   ├── dashboard/
│   │   │   └── index.tsx
│   │   ├── templates.tsx
│   │   ├── daily-plan.tsx
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   ├── assets/            # Static assets
│   │   ├── bg.png
│   │   ├── image.png
│   │   ├── welcome1.png
│   │   ├── welcome/
│   │   │   ├── welcome2.png
│   │   │   └── welcome3.png
│   │   └── lottie/
│   │       └── generating.json
│   ├── components/        # Reusable UI components
│   │   ├── AddTaskModal.tsx
│   │   ├── BottomNavBar.tsx
│   │   ├── BreakActivityModal.tsx
│   │   ├── DependencyBadge.tsx
│   │   ├── InProgressCard.tsx
│   │   ├── InputDialog.tsx
│   │   ├── Nav.tsx
│   │   ├── SectionTitle.tsx
│   │   ├── SparkleLoader.tsx
│   │   ├── SubtaskNoteModal.tsx
│   │   ├── TaskGroupCard.tsx
│   │   ├── TaskPicker.tsx
│   │   ├── ThemePicker.tsx
│   │   └── UndoSnackbar.tsx
│   ├── constants/        # App constants
│   │   ├── api.ts
│   │   └── theme.ts
│   ├── context/          # React Context providers
│   │   ├── TasksContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── UserContext.tsx
│   ├── services/        # API services
│   │   ├── auth.ts
│   │   ├── calibration.ts
│   │   ├── firebase.ts
│   │   ├── routines.ts
│   │   ├── sessionStorage.ts
│   │   ├── tasks.ts
│   │   └── templateStorage.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── images/           # Image assets
│   │   ├── bgimg.png
│   │   └── welcome1.png
│   ├── .env.example
│   ├── .gitignore
│   ├── app.json
│   ├── babel.config.js
│   ├── env.d.ts
│   ├── eslint.config.js
│   ├── package-lock.json
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── README.md
│
├── .gitignore
├── CHANGELOG.md
├── package.json
├── README.md
└── tsconfig.json
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Firebase Admin SDK** - Authentication and database
- **OpenAI** - AI-powered features
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Frontend
- **React Native** - Mobile framework
- **Expo** - Development platform
- **Expo Router** - File-based routing
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Firebase** - Authentication and database
- **React Native Paper** - UI components

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (for testing)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd neurosync-app
```

### 2. Install Dependencies

Install dependencies for all parts of the project:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 3. Configure Environment Variables

#### Backend

Create a `.env` file in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

Configure your environment variables in `backend/.env`:

```env
PORT=3000
NODE_ENV=development
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
OPENAI_API_KEY=your_openai_api_key
CORS_ORIGIN=http://localhost:19006
```

#### Frontend

Create a `.env` file in the `frontend/` directory:

```bash
cp frontend/.env.example frontend/.env
```

Configure your environment variables in `frontend/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

### 4. Run the Application

#### Development Mode (Recommended)

Run both backend and frontend in development mode with auto-reload:

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3000`
- Expo development server (accessible via QR code or web)

#### Run Services Individually

**Backend only:**
```bash
cd backend
npm start        # Production
npm run dev      # Development with nodemon
```

**Frontend only:**
```bash
cd frontend
npm run dev      # Start Expo development server
```

## 📱 Running on Mobile Device

1. Install the **Expo Go** app on your mobile device (iOS/Android)
2. Run `npm run dev` in the frontend directory
3. Scan the QR code displayed in the terminal with Expo Go
4. The app will load on your device

## 🌐 Running on Web

1. Run `npm run dev` in the frontend directory
2. Press `w` in the terminal to open in a web browser
3. Or navigate to `http://localhost:19006`

## 📚 API Documentation

For detailed API documentation, see [`backend/README.md`](backend/README.md)

## 🚀 Deployment

For detailed deployment instructions, see [`DEPLOYMENT.md`](DEPLOYMENT.md)

For Vercel-specific deployment, see [`VERCEL_DEPLOYMENT.md`](VERCEL_DEPLOYMENT.md)

### Quick Deploy

**Backend:**
```bash
# Using Railway (Recommended)
railway up

# Or use the deployment script
./deploy.sh    # Linux/Mac
deploy.bat     # Windows
```

**Frontend:**
```bash
# Mobile app
eas build --platform all --profile production

# Web app (Vercel)
cd frontend
vercel --prod

# Web app (Other)
npm run build:web
```

### Main Endpoints

- **AI**: `/api/ai/*` - AI-powered suggestions and calibration
- **Users**: `/api/users/*` - User management

## 🎨 Frontend Features

For detailed frontend documentation, see [`frontend/README.md`](frontend/README.md)

### Main Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Welcome | `(auth)/welcome` | Onboarding landing page |
| Welcome 2 | `(auth)/welcome2` | Onboarding step 2 |
| Welcome 3 | `(auth)/welcome3` | Onboarding step 3 |
| Forgot Password | `(auth)/forgotPassword` | Password recovery |
| Sign In | `(auth)/signIn` | User sign in |
| Sign Up | `(auth)/signUp` | User registration |
| Home | `(tabs)/home` | Dashboard |
| Daily Routine | `(tabs)/daily-routine` | Routine management |
| Focus Timer | `(tabs)/focus-timer` | Pomodoro timer |
| Focus Timer Counting | `(tabs)/focus-timer-counting` | Active timer session |
| Todo List | `(tabs)/todo-list` | Task management |
| Add Task | `(tabs)/add-task` | Add new task |
| Calendar | `(tabs)/calendar` | Calendar view |
| Mood Tracking | `(tabs)/mood-tracking` | Mood tracking |
| Mood Analysis | `(tabs)/mood-analysis` | Mood analytics |
| Session History | `(tabs)/session-history` | Focus session history |
| Profile | `(tabs)/profile` | User profile |
| Settings | `(tabs)/settings` | App settings |
| Dashboard | `dashboard/` | Dashboard view |
| Templates | `templates.tsx` | Task templates |
| Daily Plan | `daily-plan.tsx` | Daily planning |

## 🔧 Development

### Adding New Features

1. **Backend**: Create routes, controllers, and services following the MVC pattern
2. **Frontend**: Create screens in `app/` directory and add routes
3. **API Integration**: Add service methods in `frontend/services/`

### Code Style

- Backend: JavaScript with Express.js
- Frontend: TypeScript with React Native and Tailwind CSS
- Follow existing patterns and conventions

## 📝 Environment Variables

### Backend Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | Yes |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Optional |
| `CORS_ORIGIN` | Allowed CORS origin | Yes |

### Frontend Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | Yes |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase API key | Yes |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | Yes |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

ISC

## 👥 Authors

- NeuroSync Team

## 🙏 Acknowledgments

- Expo team for the amazing development platform
- Firebase for authentication and database solutions
- OpenAI for AI capabilities
