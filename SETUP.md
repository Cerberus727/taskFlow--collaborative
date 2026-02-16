# Setup Guide

Complete installation and setup instructions for TaskFlow.

## Prerequisites

Before you start, make sure you have:
- **Node.js v20+** (check with `node -v`)
- **PostgreSQL 12+** running locally or accessible via connection string
- **npm** or **yarn** (npm comes with Node)
- **Python 3** (optional, only for automated database setup script)

## Installation

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd task-collaboration

# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

**Option A: Automated Setup (Recommended)**

I wrote a Python script that creates the database and runs migrations automatically:

```bash
cd backend

# Install Python dependencies (one-time)
pip install psycopg2-binary python-dotenv

# Make sure PostgreSQL is running, then:
python setup-database.py
```

The script will:
- Read your PostgreSQL credentials from `.env`
- Create the `task_collaboration` database
- Run Prisma migrations
- Generate Prisma Client

**Option B: Manual Setup**

If you prefer doing it manually or don't have Python:

```bash
# 1. Create database (from terminal or pgAdmin)
psql -U postgres
CREATE DATABASE task_collaboration;
\q

# 2. Navigate to backend folder
cd backend

# 3. Generate Prisma Client
npx prisma generate

# 4. Run migrations
npx prisma migrate dev
```

### 3. Environment Configuration

**Backend** (~/backend/.env):
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/task_collaboration"
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173

# For Python setup script (if using)
PGUSER=postgres
PGPASSWORD=yourpassword
PGHOST=localhost
PGPORT=5432
PGDATABASE=task_collaboration
```

**Frontend** (~/frontend/.env):
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

**Important Security Note:** Never commit real credentials to Git. The `.env` file is already in `.gitignore`.

### 4. Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Server runs on http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
UI opens at http://localhost:5173

You should see:
- Backend: `Server running on port 5000`
- Frontend: `Local: http://localhost:5173`

## Usage Guide

### Creating Your First Board

1. **Register/Login** - Navigate to http://localhost:5173
2. **Create Board** - Click the "Create Board" button
3. **Add Lists** - Click "+ Add list" (try "To Do", "In Progress", "Done")
4. **Add Tasks** - Click "+ Add task" under any list
5. **Drag Tasks** - Click and drag tasks between lists
6. **Star Boards** - Click the star icon to mark favorites

### Testing Real-Time Features

Open the same board in two browser windows:
1. Create a task in window 1 → appears in window 2 instantly
2. Drag a task in window 2 → updates in window 1
3. Delete a list in window 1 → disappears in window 2

### Inviting Team Members

1. Open a board you own
2. Click the "👥 Share" button
3. Enter email and select role (Owner/Admin/Member)
4. They'll receive an invitation (check Activities tab)

### Permissions Model

- **Owner** - Full control (delete board, manage all members)
- **Admin** - Manage content and members (can't delete board)
- **Member** - Create/edit tasks and lists (can't manage members)

## Development Workflow

### Daily Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Database GUI (optional)
cd backend
npx prisma studio
```

### Development Scripts

**Backend:**
```bash
npm run dev          # Start development server with nodemon
npm run start        # Start production server
npm run prisma:generate   # Generate Prisma Client
npm run prisma:migrate    # Run database migrations
npm run prisma:studio     # Open Prisma Studio
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

**Frontend:**
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Adding a New Feature

Example: Adding task comments

**1. Database Schema** (backend/prisma/schema.prisma)
```prisma
model Comment {
  id        String   @id @default(uuid())
  content   String
  taskId    String
  userId    String
  task      Task     @relation(fields: [taskId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}
```

**2. Run Migration**
```bash
npx prisma migrate dev --name add_comments
```

**3. Backend Module** (modules/comment/)
- Create service.js (business logic)
- Create controller.js (HTTP handlers)
- Create routes.js (endpoint definitions)

**4. Frontend Integration**
- Add API client (api/comment.js)
- Add Redux slice (store/slices/commentSlice.js)
- Create UI component (components/CommentList/)

**5. Real-Time** (optional)
- Emit socket event from backend controller
- Listen in frontend and dispatch Redux action

### Database Migrations

```bash
# Create migration after schema change
npx prisma migrate dev --name describe_change

# View migration SQL
cat prisma/migrations/<timestamp>_describe_change/migration.sql

# Reset database (DEV ONLY - deletes all data!)
npx prisma migrate reset

# Generate Prisma Client after pull
npx prisma generate
```

## Testing

### Running Tests

```bash
# Backend tests
cd backend
npm test                # Run all tests
npm run test:coverage   # Run with coverage report
npm run test:watch      # Watch mode for TDD

# Frontend tests (not yet implemented)
cd frontend
npm test
```

### Test Coverage

Current backend test coverage:
- Auth module: ~80% (register, login, JWT validation)
- Board module: ~70% (CRUD, permissions)
- Other modules: Pending

**To add more tests:**
```bash
cd backend/tests/modules
# Add <module>.test.js following existing patterns
```

## Common Issues & Fixes

### Database Connection Error
```
Error: Can't reach database server at `localhost:5432`
```
**Fix:** Make sure PostgreSQL is running (`sudo service postgresql start` or `brew services start postgresql`)

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Fix 1:** Kill process using port 5000
```bash
# Find process
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```
**Fix 2:** Change PORT in backend/.env to 5001

### Prisma Client Not Generated
```
Error: @prisma/client did not initialize yet
```
**Fix:**
```bash
cd backend
npx prisma generate
```

### CORS Error in Browser
```
Access to XMLHttpRequest blocked by CORS policy
```
**Fix:** Verify FRONTEND_URL in backend/.env matches your frontend URL (http://localhost:5173)

### WebSocket Connection Failed
```
WebSocket connection to 'ws://localhost:5000' failed
```
**Fix:** Ensure backend server is running and VITE_SOCKET_URL in frontend/.env is correct

## Production Deployment

### Backend Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (e.g., from `openssl rand -hex 64`)
- [ ] Use production PostgreSQL database (not localhost)
- [ ] Set `FRONTEND_URL` to production frontend URL
- [ ] Enable HTTPS
- [ ] Set up process manager (PM2)
  ```bash
  npm install -g pm2
  pm2 start src/server.js --name taskflow-backend
  pm2 startup
  pm2 save
  ```
- [ ] Configure reverse proxy (nginx)
- [ ] Set up database backups
- [ ] Configure logging (Winston/Pino)
- [ ] Set up monitoring (New Relic/DataDog)

### Frontend Deployment Checklist

- [ ] Update `VITE_API_URL` to production backend URL
- [ ] Update `VITE_SOCKET_URL` to production backend URL
- [ ] Build production bundle: `npm run build`
- [ ] Deploy `dist/` folder to:
  - Vercel (`vercel deploy`)
  - Netlify (`netlify deploy --prod`)
  - AWS S3 + CloudFront
  - Or any static hosting service
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Enable gzip/brotli compression
- [ ] Set cache headers for assets

### Environment Variables for Production

**Backend:**
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@prod-db-host:5432/taskflow_prod
JWT_SECRET=<generate-with-openssl-rand-hex-64>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://taskflow.yourdomain.com
```

**Frontend:**
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_SOCKET_URL=https://api.yourdomain.com
```

## Need Help?

- Check [Common Issues](#common-issues--fixes) above
- Review [Architecture Documentation](ARCHITECTURE.md) for system design
- See [API Documentation](API.md) for endpoint details
- Open an issue on GitHub
