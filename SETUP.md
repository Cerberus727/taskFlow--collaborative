# Setup Guide

## Prerequisites

- Node.js v20+ installed
- PostgreSQL installed and running
- Git installed

## Database Setup

1. **Configure environment variables**

Create `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/taskflow_db"
JWT_SECRET="your-secret-key-change-in-production"
PORT=5000
```

2. **Run database setup**

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma generate
```

## Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:5000`

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Verify Setup

1. Open browser: `http://localhost:5173`
2. Register a new user account
3. Create a board and start adding tasks

## Demo Credentials

After registration, you can create additional test accounts or use these if you've seeded demo data:

- Email: `demo@taskflow.com`
- Password: `demo123`

## Troubleshooting

**Database connection fails:**
- Check PostgreSQL is running
- Verify DATABASE_URL in `.env`
- Ensure database exists: `createdb taskflow_db`

**Port already in use:**
- Change PORT in `backend/.env`
- Update API URL in `frontend/src/api/client.js` if backend port changes

**Prisma errors:**
```bash
cd backend
npx prisma generate
npx prisma migrate reset
```
