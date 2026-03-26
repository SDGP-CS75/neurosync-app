# NeuroSync Backend API

The backend server for the NeuroSync productivity application, built with Node.js and Express.

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Firebase Admin SDK** - Authentication and database
- **OpenAI** - AI-powered features
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── sdgp-cs75-firebase-adminsdk-fbsvc-5684359436.json
│   ├── controllers/
│   │   ├── aiController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── ai.js
│   │   └── users.js
│   ├── services/
│   │   └── aiCalibration.js
│   ├── types/
│   │   └── index.js
│   ├── utils/
│   │   └── validators.js
│   └── server.js
├── .env.example
├── .gitignore
├── package-lock.json
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

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
PORT=3000
NODE_ENV=development
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
OPENAI_API_KEY=your_openai_api_key
CORS_ORIGIN=http://localhost:19006
```

### Running the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:3000` by default.

## API Endpoints

### AI
| Method | Endpoint | Description |
|--------|---------|------------|
| POST | `/api/ai/generate-suggestions` | Generate AI-powered suggestions |
| POST | `/api/ai/calibrate` | Calibrate AI based on user preferences |
| POST | `/api/ai/analyze-mood` | Analyze user mood patterns |
| POST | `/api/ai/generate-daily-plan` | Generate daily plan suggestions |

### Users
| Method | Endpoint | Description |
|--------|---------|------------|
| POST | `/api/users/register` | Register a new user |
| POST | `/api/users/login` | Login user |
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/:id` | Update user profile |
| DELETE | `/api/users/:id` | Delete user |

## Development

### Architecture

The backend follows the MVC (Model-View-Controller) pattern:
- **Routes** - Define API endpoints and map them to controllers
- **Controllers** - Handle incoming requests and return responses
- **Services** - Contain business logic and interact with external APIs/databases
- **Middleware** - Handle authentication, error handling, etc.

### Adding New Routes

1. Create a new route file in `src/routes/`
2. Create corresponding controller in `src/controllers/`
3. Import and use the route in `src/server.js`

Example:
```javascript
// src/routes/example.js
const express = require('express');
const router = express.Router();
const exampleController = require('../controllers/exampleController');

router.get('/', exampleController.getAll);
router.post('/', exampleController.create);

module.exports = router;
```

### Adding New Services

Create service files in `src/services/` for business logic that interacts with external APIs or databases.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | Yes |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Optional |
| `CORS_ORIGIN` | Allowed CORS origin | Yes |

## License

ISC
