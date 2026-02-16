# TaskFlow

A full-stack kanban-style task management platform with real-time collaboration. Built with React, Redux, Node.js, PostgreSQL, and Socket.io.

## What Is This?

TaskFlow is a Trello-inspired project management tool where teams organize work using boards, lists, and tasks. The key feature? Everything updates in real-time across all connected users. Create a task, drag it to a different list, assign it to someone - everyone sees the changes instantly.

I built this to demonstrate production-ready patterns: normalized Redux state management, WebSocket-based real-time updates, proper authentication/authorization, database transactions, and a responsive drag-and-drop UI.

## Quick Start

```bash
# Clone the repo
git clone <your-repo-url>
cd task-collaboration

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Setup database (automated)
cd backend
python setup-database.py

# Start backend (terminal 1)
npm run dev

# Start frontend (terminal 2)
cd frontend
npm run dev
```

Visit **http://localhost:5173**, register an account, and start creating boards!

For detailed setup instructions, see **[SETUP.md](SETUP.md)**.

## Tech Stack

**Backend:** Node.js, Express, PostgreSQL, Prisma ORM, Socket.io, JWT  
**Frontend:** React 19, Redux Toolkit, Vite, Socket.io-client, @hello-pangea/dnd  
**Real-time:** WebSocket rooms per board, events fired after DB commits  
**State:** Normalized Redux (byId/allIds pattern) for fast lookups

## Features

✅ Real-time collaboration (multi-user updates without refresh)  
✅ Drag-and-drop tasks between lists  
✅ Board access control (owner/admin/member roles)  
✅ Task assignments, due dates, and labels  
✅ Activity history and audit logs  
✅ Search and filter tasks  
✅ Member invitations via email  
✅ Star/favorite boards  

## Project Structure

```
task-collaboration/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── modules/  # Feature-based modules (auth, board, task, etc.)
│   │   ├── config/   # Database, Socket.io setup
│   │   └── middleware/
│   └── prisma/       # Database schema and migrations
│
├── frontend/         # React + Vite SPA
│   └── src/
│       ├── api/      # HTTP clients
│       ├── components/
│       ├── pages/
│       ├── store/    # Redux slices
│       └── sockets/  # Socket.io client
│
├── docs/             # Additional documentation
│   ├── API_CONTRACT.md
│   ├── REALTIME_STRATEGY.md
│   └── SCALABILITY.md
│
├── SETUP.md          # Installation and configuration guide
├── ARCHITECTURE.md   # System design and technical patterns
├── API.md            # Complete API reference
└── DESIGN_DECISIONS.md  # Assumptions and trade-offs
```

## Documentation

### 📘 [SETUP.md](SETUP.md)
Complete installation guide, environment configuration, development workflow, testing, common issues, and production deployment.

### 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md)
System design deep-dive: modular structure, data flow, database schema, state management patterns, design patterns, scalability strategies, and performance optimizations.

### 🔌 [API.md](API.md)
Complete REST API reference with all endpoints, request/response examples, WebSocket events, authentication, and error responses.

### 🤔 [DESIGN_DECISIONS.md](DESIGN_DECISIONS.md)
Technical trade-offs explained: why JWT over sessions, PostgreSQL over MongoDB, Redux over Context, normalized state, hard deletes, and more.

## Quick Demo

**Want to see it in action?**

1. Register an account (any email works, even `test@example.com`)
2. Create a board called "My Project"
3. Add lists: "To Do", "In Progress", "Done"
4. Create some tasks and drag them between lists
5. Open the same board in another browser window
6. Make changes in one window and watch them appear instantly in the other

## Development

### Daily Workflow

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

### Key Scripts

**Backend:**
- `npm run dev` - Start with hot reload
- `npm test` - Run tests
- `npx prisma studio` - Visual database browser
- `npx prisma migrate dev` - Run migrations

**Frontend:**
- `npm run dev` - Start dev server (http://localhost:5173)
- `npm run build` - Production build
- `npm run preview` - Preview production build

## Testing Real-Time Features

1. Start both servers
2. Open http://localhost:5173 in two browser windows
3. Login with the same account in both
4. Open the same board in both windows
5. Create/edit/delete tasks in one window
6. Watch changes appear instantly in the other window

## Common Issues

**Database connection error?**  
Make sure PostgreSQL is running: `brew services start postgresql` or `sudo service postgresql start`

**Port 5000 already in use?**  
Kill the process: `lsof -i :5000` then `kill -9 <PID>` or change PORT in `.env`

**Prisma client errors?**  
Regenerate the client: `cd backend && npx prisma generate`

**CORS errors?**  
Verify `FRONTEND_URL` in backend/.env matches frontend URL (http://localhost:5173)

For more solutions, see the [Common Issues section in SETUP.md](SETUP.md#common-issues--fixes).

## Production Deployment

### Quick Checklist

**Backend:**
- [ ] Set `NODE_ENV=production`
- [ ] Use secure `JWT_SECRET` (run `openssl rand -hex 64`)
- [ ] Configure production database URL
- [ ] Set up PM2 process manager
- [ ] Enable HTTPS
- [ ] Configure monitoring

**Frontend:**
- [ ] Update API URLs in `.env`
- [ ] Run `npm run build`
- [ ] Deploy `dist/` folder to Vercel/Netlify/S3
- [ ] Configure CDN
- [ ] Set up SSL

Full deployment guide in [SETUP.md](SETUP.md#production-deployment).

## Contributing

Found a bug or want to add a feature?

1. Fork the repo
2. Create a branch: `git checkout -b feature/awesome-feature`
3. Make your changes
4. Add tests if applicable
5. Commit: `git commit -m 'Add awesome feature'`
6. Push: `git push origin feature/awesome-feature`
7. Open a Pull Request

## Future Ideas

- [ ] File attachments on tasks
- [ ] Email notifications
- [ ] Recurring tasks
- [ ] Time tracking
- [ ] Gantt chart view
- [ ] Mobile app (React Native)
- [ ] Keyboard shortcuts
- [ ] Custom fields
- [ ] Webhooks for integrations
- [ ] Two-factor authentication

## License

MIT License - feel free to use this for learning, portfolio, or commercial projects.

## Acknowledgments

- Inspired by Trello's clean UI
- Built with [Prisma](https://prisma.io), [Socket.io](https://socket.io), and [Redux Toolkit](https://redux-toolkit.js.org)
- Drag-and-drop by [@hello-pangea/dnd](https://github.com/hello-pangea/dnd)

---

**Built with ❤️ by a developer who loves clean architecture**

Questions? Open an issue or check the docs folder for additional resources.
