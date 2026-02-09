# NeuroSync

A productivity application with AI-powered features, built with React Native (Expo) for the frontend and Node.js (Express) for the backend.

## 🚀 Features

- **Daily Routine Management** - Create and manage personalized daily routines
- **Focus Timer** - Pomodoro-style timer with customizable intervals
- **Todo List** - Task management with prioritization and due dates
- **AI-Powered Suggestions** - Smart recommendations for routines and tasks
- **User Authentication** - Secure sign-up and login with Firebase/Supabase
- **Profile & Settings** - Personalized user experience with theme customization

## 📁 Project Structure

```
neurosync-app/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   │   ├── routineController.js
│   │   │   ├── taskController.js
│   │   │   └── userController.js
│   │   ├── middleware/      # Custom middleware
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── routes/         # API routes
│   │   │   ├── routines.js
│   │   │   ├── tasks.js
│   │   │   └── users.js
│   │   ├── services/       # Business logic
│   │   │   ├── aiService.js
│   │   │   └── supabase.js
│   │   ├── types/          # TypeScript types
│   │   │   └── index.js
│   │   ├── utils/          # Utility functions
│   │   │   └── validators.js
│   │   └── server.js       # Entry point
│   ├── .env.example        # Environment variables template
│   ├── .gitignore
│   ├── package.json
│   └── README.md
│
├── frontend/               # React Native/Expo mobile app
│   ├── app/                # Expo Router pages
│   │   ├── (auth)/        # Authentication routes
│   │   │   ├── _layout.tsx
│   │   │   ├── sign-in.tsx
│   │   │   ├── sign-up.tsx
│   │   │   ├── welcome.tsx
│   │   │   └── welcome2.tsx
|   |   |
│   │   ├── (tabs)/        # Tab-based routes
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx
│   │   │   ├── daily-routine.tsx
│   │   │   ├── focus-timer.tsx
│   │   │   ├── todo-list.tsx
│   │   │   ├── profile.tsx
│   │   │   └── settings.tsx
│   │   ├── _layout.tsx    # Root layout
│   │   └── index.tsx      # Home page
│   ├── components/       
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   ├── context/           # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useTheme.ts
│   │   └── useTimer.ts
│   ├── services/          # API services
│   │   ├── auth.ts
│   │   ├── routines.ts
│   │   ├── supabase.ts
│   │   └── tasks.ts
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   ├── constants/         # App constants
│   │   └── theme.ts
│   ├── assets/            # Images, fonts, etc.
│   │   └── images/
│   ├── .env.example       # Environment variables template
│   ├── .gitignore
│   ├── app.json           # Expo configuration
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── .gitignore
├── package.json           # Root package.json for running both services
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Supabase** - Database and authentication
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Frontend
- **React Native** - Mobile framework
- **Expo** - Development platform
- **Expo Router** - File-based routing
- **TypeScript** - Type safety
- **Supabase** - Backend services
- **Firebase** - Authentication and database
- **Axios** - HTTP client

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
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_jwt_secret_key_here
CORS_ORIGIN=http://localhost:19006
```

#### Frontend

Create a `.env` file in the `frontend/` directory:

```bash
cp frontend/.env.example frontend/.env
```

Configure your environment variables in `frontend/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
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

#### Production Mode

Run both services in production mode:

```bash
npm run start:all
```

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
npm dev          # Start Expo development server
```

## 📱 Running on Mobile Device

1. Install the **Expo Go** app on your mobile device (iOS/Android)
2. Run `npm run dev` in the project root
3. Scan the QR code displayed in the terminal with Expo Go
4. The app will load on your device

## 🌐 Running on Web

1. Run `npm run dev` in the project root
2. Press `w` in the terminal to open in a web browser
3. Or navigate to `http://localhost:19006`

## 🧪 Testing

### Backend

```bash
cd backend
npm test
```

### Frontend

```bash
cd frontend
npm run lint        # Lint code
npm run typecheck   # Type check
```

## 📚 API Documentation

For detailed API documentation, see [`backend/README.md`](backend/README.md)

### Main Endpoints

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Tasks**: `/api/tasks/*`
- **Routines**: `/api/routines/*`

## 🎨 Frontend Features

For detailed frontend documentation, see [`frontend/README.md`](frontend/README.md)

### Main Screens

- **Welcome** - Landing page
- **Sign In/Sign Up** - Authentication
- **Home** - Dashboard
- **Daily Routine** - Routine management
- **Focus Timer** - Pomodoro timer
- **Todo List** - Task management
- **Profile** - User profile and settings

## 🔧 Development

### Adding New Features

1. **Backend**: Create routes, controllers, and services following the MVC pattern
2. **Frontend**: Create screens in `app/` or `components/screens/` and add routes
3. **API Integration**: Add service methods in `frontend/services/`

### Code Style

- Backend: JavaScript with Express.js
- Frontend: TypeScript with React Native
- Follow existing patterns and conventions

## 📝 Environment Variables

### Backend Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Optional |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `CORS_ORIGIN` | Allowed CORS origin | Yes |

### Frontend Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | Yes |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
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
- Supabase for the backend services
- Firebase for authentication and database solutions
