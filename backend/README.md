# NeuroSync Backend API

Express API for NeuroSync authentication-backed profile storage, Groq-powered
planning features, and per-user AI spend controls.

## Stack

- Node.js 22 (`>=22 <25`)
- Express 5
- Firebase Admin SDK and Firestore
- Groq's OpenAI-compatible chat completion API
- Express rate limiting, CORS, validation, and AI quotas

## Prerequisites

- Node.js 22 and npm
- A Firebase service account for the project
- A Groq API key for AI routes
- Java 21 or newer only when running the Firestore/Storage emulator tests

## Local Setup

```bash
cd backend
npm ci
cp .env.example .env
```

Set `FIREBASE_SERVICE_ACCOUNT` to the complete service-account JSON on one
line. For local development, the server also accepts an ignored service-account
file at `src/config/sdgp-cs75-firebase-adminsdk-fbsvc-5684359436.json`.

```bash
npm run dev
```

The API listens on `http://localhost:8080` by default.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start with nodemon |
| `npm start` | Start the production server |
| `npm test` | Run unit and integration tests |
| `npm run test:rules` | Run Firestore/Storage rules against local emulators |
| `npm run check` | Syntax-check entry points and run tests |

`npm run test:rules` requires the Firebase CLI dependencies and Java 21 or newer.
The normal `npm test` command deliberately excludes this emulator-only suite.

## API

All `/api` routes require a Firebase ID token:

```http
Authorization: Bearer <firebase-id-token>
```

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health and uptime check |
| `GET` | `/api/users/profile` | Read the authenticated user's profile |
| `POST` | `/api/users/` | Create the authenticated user's profile |
| `POST` | `/api/ai/breakdown` | Break a task into actionable steps |
| `POST` | `/api/ai/reschedule` | Suggest a new due date |
| `POST` | `/api/ai/suggest-split` | Split a task into timed sessions |
| `POST` | `/api/ai/daily-plan` | Order the user's incomplete tasks |

The AI endpoints validate their payloads before calling Groq. Each request
reserves quota in Firestore before the model call and records token usage after
it completes.

## Environment

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | API port; defaults to `8080` |
| `NODE_ENV` | Yes | Use `production` when deployed |
| `FIREBASE_SERVICE_ACCOUNT` | Yes* | Full Firebase service-account JSON |
| `GROQ_API_KEY` | AI only | Enables the `/api/ai/*` routes |
| `GROQ_MODEL` | No | Defaults to `llama-3.1-8b-instant` |
| `CORS_ORIGINS` | Production browser clients | Comma-separated allowed origins |
| `TRUST_PROXY_HOPS` | Production | Trusted reverse-proxy hops; defaults to `1` in production |
| `AI_QUOTA_ENABLED` | No | Defaults to `true` |
| `AI_DAILY_REQUEST_LIMIT` | No | Defaults to `20` requests per user per UTC day |
| `AI_DAILY_TOKEN_LIMIT` | No | Defaults to `200000` tokens per user per UTC day |
| `AI_DAILY_COST_LIMIT_USD` | No | Defaults to `$1.00` per user per UTC day |
| `GROQ_INPUT_COST_PER_1M_USD` | No | Defaults to `$0.05` per million input tokens |
| `GROQ_OUTPUT_COST_PER_1M_USD` | No | Defaults to `$0.08` per million output tokens |
| `SKIP_AUTH` | No | Local-only auth bypass; always ignored in production |

*The local ignored service-account file is an alternative only for development.

`CORS_ORIGIN` remains a backward-compatible fallback, but new deployments should
use `CORS_ORIGINS`. Do not use wildcard origins in production.

## Project Layout

```text
backend/
├── src/
│   ├── controllers/     # AI and profile request handlers
│   ├── middleware/      # Auth, CORS, validation, errors
│   ├── routes/          # API route registration
│   ├── services/        # AI quotas, calibration, date context, validation
│   ├── app.js           # Express application factory
│   └── server.js        # Process startup and graceful shutdown
├── test/                # Unit, integration, and emulator rules tests
├── .env.example
├── package.json
└── README.md
```

## Deployment

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md). The repository-root
`Dockerfile` builds the backend on Node 22.

## License

ISC
