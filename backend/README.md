# NeuroSync Backend API

The backend server for the NeuroSync productivity application.

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Supabase** - Database and authentication
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## Project Structure

```
backend/
├── src/
│   ├── controllers/      # Request handlers
│   │   ├── routineController.js
│   │   ├── taskController.js
│   │   └── userController.js
│   ├── middleware/       # Custom middleware
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── routes/          # API routes
│   │   ├── routines.js
│   │   ├── tasks.js
│   │   └── users.js
│   ├── services/        # Business logic
│   │   ├── aiService.js
│   │   └── supabase.js
│   ├── types/           # TypeScript types
│   │   └── index.js
│   ├── utils/           # Utility functions
│   │   └── validators.js
│   └── server.js        # Entry point
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment variables template
├── .gitignore
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
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_jwt_secret_key_here
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

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### Routines
- `GET /api/routines` - Get all routines
- `POST /api/routines` - Create a new routine
- `PUT /api/routines/:id` - Update a routine
- `DELETE /api/routines/:id` - Delete a routine

## Development

### Adding New Routes

1. Create a new route file in `src/routes/`
2. Create corresponding controller in `src/controllers/`
3. Add the route to `src/server.js`

### Adding New Services

Create service files in `src/services/` for business logic that interacts with external APIs or databases.

## Environment Variables

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

## License

ISC
