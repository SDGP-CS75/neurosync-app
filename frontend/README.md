# NeuroSync Frontend

The mobile application frontend for the NeuroSync productivity app, built with React Native and Expo.

## Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **Expo Router** - File-based routing
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Firebase** - Authentication and database
- **React Native Paper** - UI components

## Project Structure

```
frontend/
├── app/                      # Expo Router pages
│   ├── (auth)/              # Authentication routes
│   │   ├── _layout.tsx
│   │   ├── signIn.tsx
│   │   ├── signUp.tsx
│   │   ├── welcome.tsx
│   │   ├── welcome2.tsx
│   │   ├── welcome3.tsx
│   │   └── forgotPassword.tsx
│   ├── (tabs)/              # Tab-based routes
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── home.tsx
│   │   ├── daily-routine.tsx
│   │   ├── focus-timer.tsx
│   │   ├── focus-timer-counting.tsx
│   │   ├── todo-list.tsx
│   │   ├── add-task.tsx
│   │   ├── calendar.tsx
│   │   ├── mood-tracking.tsx
│   │   ├── mood-analysis.tsx
│   │   ├── session-history.tsx
│   │   ├── profile.tsx
│   │   └── settings.tsx
│   ├── dashboard/
│   │   └── index.tsx
│   ├── templates.tsx
│   ├── daily-plan.tsx
│   ├── _layout.tsx
│   └── index.tsx
├── assets/                  # Static assets
│   ├── bg.png
│   ├── image.png
│   ├── welcome1.png
│   ├── welcome/
│   │   ├── welcome2.png
│   │   └── welcome3.png
│   └── lottie/
│       └── generating.json
├── components/              # Reusable UI components
│   ├── AddTaskModal.tsx
│   ├── BottomNavBar.tsx
│   ├── BreakActivityModal.tsx
│   ├── DependencyBadge.tsx
│   ├── InProgressCard.tsx
│   ├── InputDialog.tsx
│   ├── Nav.tsx
│   ├── SectionTitle.tsx
│   ├── SparkleLoader.tsx
│   ├── SubtaskNoteModal.tsx
│   ├── TaskGroupCard.tsx
│   ├── TaskPicker.tsx
│   ├── ThemePicker.tsx
│   └── UndoSnackbar.tsx
├── constants/               # App constants
│   ├── api.ts
│   └── theme.ts
├── context/                 # React Context providers
│   ├── TasksContext.tsx
│   ├── ThemeContext.tsx
│   └── UserContext.tsx
├── services/                # API services
│   ├── auth.ts
│   ├── calibration.ts
│   ├── firebase.ts
│   ├── routines.ts
│   ├── sessionStorage.ts
│   ├── tasks.ts
│   └── templateStorage.ts
├── types/                   # TypeScript type definitions
│   ├── index.ts
│   └── react-native-paper.d.ts
├── images/                  # Image assets
│   ├── bgimg.png
│   └── welcome1.png
├── .env.example
├── .gitignore
├── app.json
├── babel.config.js
├── env.d.ts
├── eslint.config.js
├── package-lock.json
├── package.json
├── tailwind.config.js
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
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

### Running the App

**Development mode:**
```bash
npm run dev
```

This will start the Expo development server. You can then:
- Scan the QR code with the Expo Go app on your mobile device
- Press `w` to open in a web browser
- Press `a` to open in an Android emulator
- Press `i` to open in an iOS simulator (macOS only)

**Build for web:**
```bash
npm run web
```

**Lint code:**
```bash
npm run lint
```

**Type check:**
```bash
npx tsc --noEmit
```

## Features

### Authentication
- User registration and login
- Secure session management
- Password recovery
- Onboarding flow (Welcome screens)

### Daily Routine
- Create and manage daily routines
- Track routine completion
- AI-powered routine suggestions

### Focus Timer
- Pomodoro-style timer
- Customizable work/break intervals
- Session tracking and statistics
- Break activity suggestions

### Todo List
- Create, edit, and delete tasks
- Task prioritization
- Due date management
- Task completion tracking
- Task dependencies
- Subtasks with notes

### Calendar
- Calendar view for scheduling
- Daily plan view
- Task visualization

### Mood Tracking
- Track daily moods
- Mood analytics and trends
- AI-powered mood analysis

### Session History
- Focus session history
- Statistics and progress tracking
- Performance analytics

### Profile
- User profile management
- Settings customization
- Theme selection
- Statistics and progress tracking

## Navigation

The app uses Expo Router for file-based routing:

### Auth Flow
```
welcome → welcome2 → welcome3 → signIn / signUp
```

### Tab Navigation
- Home (Dashboard)
- Daily Routine
- Focus Timer
- Todo List
- Calendar
- Mood Tracking
- Session History
- Profile
- Settings

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | Yes |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase API key | Yes |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | Yes |

## Development

### Adding New Screens

1. Create a new screen file in `app/` directory
2. Add the route to the appropriate layout
3. Update navigation if needed

### Adding New Components

Create reusable UI components in `components/` following the existing pattern.

### Using Context

The app uses React Context for state management:
- `UserContext` - User authentication and profile
- `ThemeContext` - Theme customization
- `TasksContext` - Task management

### Styling

The app uses a theme-based approach defined in `constants/theme.ts`. All colors, spacing, and typography should be referenced from the theme constants. Tailwind CSS is also configured for utility-first styling.

## License

ISC
