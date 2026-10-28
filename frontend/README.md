# NeuroSync Frontend

Expo application for task planning, focus sessions, mood tracking, and
AI-assisted daily planning.

## Stack

- Node.js 22 (`>=22 <25`)
- React Native 0.81 and React 19
- Expo 54 and Expo Router 6
- TypeScript, NativeWind/Tailwind, React Native Paper
- Firebase Authentication, Firestore, and Storage

## Setup

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

Use the QR code with Expo Go, or press `w`, `a`, or `i` for web, Android, or
iOS. The API URL defaults to the Expo development host on port `8080`; set
`EXPO_PUBLIC_API_URL` when the backend runs elsewhere.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Expo development server |
| `npm run lint` | Run Expo ESLint |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm test` | Run the Jest suite |
| `npm run test:coverage` | Run Jest with coverage |
| `npm run build:web` | Export the static web build to `dist/` |
| `npm run check` | Run lint, typecheck, tests, and the web export |

## Environment

Copy `frontend/.env.example` and provide the Firebase web app configuration.
`EXPO_PUBLIC_*` values are embedded in the client bundle and must never contain
server secrets.

| Variable | Required | Description |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | Recommended | Backend origin, without `/api` |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase web API key |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Firebase Storage bucket |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase sender ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` | No | Firebase Analytics ID |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google sign-in | Google OAuth web client ID |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Google on Android | Google OAuth Android client ID |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google on iOS | Google OAuth iOS client ID |

## Routes

Expo Router owns the navigation tree:

- `app/(auth)/`: welcome, sign-in, sign-up, and password recovery
- `app/(tabs)/`: home, task list, focus timer, calendar, mood, history, and settings
- `app/templates.tsx` and `app/daily-plan.tsx`: modal workflows

Protected tab routes redirect unauthenticated users to the welcome flow.

## Architecture

- `context/`: authentication/profile, theme, and task state
- `services/`: Firebase, API, local persistence, sync, notifications, and AI calls
- `components/`: shared UI, modals, navigation, progress, and error handling
- `utils/`: local calendar-date and animation helpers
- `types/`: shared domain types

Firestore and Storage access are user-scoped. Offline task, session, and mood
changes remain local until they can be synced. The backend adds the Firebase ID
token to AI requests and enforces per-user quotas.

## Testing

Jest covers screens, shared components, offline synchronization, Firebase
services, local date handling, notifications, and profile image storage.

```bash
npm test -- --runInBand
npm run check
```

The web export is the final check for bundling and platform-specific imports.

## License

ISC
