# NeuroSync Frontend

The mobile application frontend for the NeuroSync productivity app, built with React Native and Expo.

## Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **Expo Router** - File-based routing
- **TypeScript** - Type safety
- **Supabase** - Backend services
- **Firebase** - Authentication and database
- **Axios** - HTTP client

## Project Structure

```
frontend/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication routes
│   │   ├── _layout.tsx
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   └── welcome.tsx
│   ├── (tabs)/            # Tab-based routes
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── daily-routine.tsx
│   │   ├── focus-timer.tsx
│   │   ├── todo-list.tsx
│   │   ├── profile.tsx
│   │   └── settings.tsx
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Home page
├── components/
│   ├── screens/           # Screen components
│   │   ├── ProfileView.tsx
│   │   ├── RoutineView.tsx
│   │   ├── TimerView.tsx
│   │   └── TodoView.tsx
│   └── ui/                # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Input.tsx
├── context/               # React Context providers
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts
│   ├── useTheme.ts
│   └── useTimer.ts
├── services/              # API services
│   ├── auth.ts
│   ├── routines.ts
│   ├── supabase.ts
│   └── tasks.ts
├── types/                 # TypeScript type definitions
│   └── index.ts
├── constants/             # App constants
│   └── theme.ts
├── assets/                # Images, fonts, etc.
│   └── images/
├── .env                   # Environment variables (not in git)
├── .env.example           # Environment variables template
├── .gitignore
├── app.json               # Expo configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (for testing)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:
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

### Running the App

**Development mode**:
```bash
npm run dev
```

This will start the Expo development server. You can then:
- Scan the QR code with the Expo Go app on your mobile device
- Press `w` to open in a web browser
- Press `a` to open in an Android emulator
- Press `i` to open in an iOS simulator (macOS only)

**Build for web**:
```bash
npm run build:web
```

**Lint code**:
```bash
npm run lint
```

**Type check**:
```bash
npm run typecheck
```

## Features

### Authentication
- User registration and login
- Secure session management
- Password recovery

### Daily Routine
- Create and manage daily routines
- Track routine completion
- AI-powered routine suggestions

### Focus Timer
- Pomodoro-style timer
- Customizable work/break intervals
- Session tracking and statistics

### Todo List
- Create, edit, and delete tasks
- Task prioritization
- Due date management
- Task completion tracking

### Profile
- User profile management
- Settings customization
- Statistics and progress tracking

## Navigation

The app uses Expo Router for file-based routing:

- **Auth Flow**: Welcome → Sign In/Sign Up → Main App
- **Tab Navigation**: Home, Daily Routine, Focus Timer, Todo List, Profile, Settings

## Environment Variables

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

## Development

### Adding New Screens

1. Create a new screen file in `app/` or `components/screens/`
2. Add the route to the appropriate layout
3. Update navigation if needed

### Adding New Components

Create reusable UI components in `components/ui/` following the existing pattern.

### Using Custom Hooks

Custom hooks are available in `hooks/`:
- `useAuth()` - Authentication state and methods
- `useTheme()` - Theme context
- `useTimer()` - Timer functionality

## Styling

The app uses a theme-based approach defined in `constants/theme.ts`. All colors, spacing, and typography should be referenced from the theme constants.

## License

ISC
