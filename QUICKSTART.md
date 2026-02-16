# Quick Start Guide

## Prerequisites Check
- ✅ Node.js v20.15.0 installed
- ✅ PostgreSQL running
- ✅ Git installed

## 5-Minute Setup

### Step 1: Database (30 seconds)

**Option A: Automatic Setup (Recommended)** ⭐

```bash
# Install Python dependencies
pip install psycopg2-binary python-dotenv

# Navigate to backend
cd backend

# Update .env with your PostgreSQL credentials
# PGUSER=postgres
# PGPASSWORD=your_password

# Run auto-setup
python setup-database.py
```

**Option B: Manual Setup**

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE task_collaboration;

# Exit
\q
```

### Step 2: Backend (2 minutes)

```bash
# Navigate to backend
cd backend

# Install dependencies (already done)
# npm install

# Setup environment
cp .env.example .env

# Edit .env with your PostgreSQL credentials
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/task_collaboration"

# Initialize database
npm run prisma:generate
npm run prisma:migrate

# Start server
npm run dev
```

✅ Backend should be running on http://localhost:5000

### Step 3: Frontend (1 minute)

Open a new terminal:

```bash
# Navigate to frontend
cd frontend

# Install dependencies (already done)
# npm install

# Start development server
npm run dev
```

✅ Frontend should be running on http://localhost:5173

### Step 4: Test (1 minute)

1. Open browser to http://localhost:5173
2. Click "Register" and create an account
3. Create a board
4. Add a list
5. Add tasks
6. Drag and drop tasks!

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running: `pg_isready`
- Check credentials in backend/.env
- Verify database exists: `psql -U postgres -l`

### Port Already in Use
- Backend: Change PORT in backend/.env
- Frontend: Change port in vite config or kill process on 5173

### Prisma Errors
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### Module Not Found
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

## Testing Real-time Features

1. Open the same board in two browser tabs/windows
2. Create a task in one tab
3. Watch it appear instantly in the other tab! 🎉

## Default Test Account

Create your own account using the registration page.

**Recommended test users:**
- User 1: alice@example.com / password123
- User 2: bob@example.com / password123

Register both, then add them to your boards to test collaboration!
