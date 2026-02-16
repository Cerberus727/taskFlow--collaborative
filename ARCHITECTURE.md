# Architecture Documentation

Deep dive into TaskFlow's system design, technical patterns, and architectural decisions.

## Tech Stack & Rationale

### Backend
- **Node.js + Express** - Fast, widely adopted, huge ecosystem
- **PostgreSQL** - Relational data (boards → lists → tasks) needs proper relationships and ACID compliance
- **Prisma ORM** - Type-safe database access, excellent migrations, auto-generated client
- **Socket.io** - Best-in-class WebSocket library with fallback mechanisms and room support
- **JWT** - Stateless auth, scales horizontally, works great for SPAs
- **bcrypt** - Industry standard for password hashing

### Frontend
- **React 19 (Vite)** - Component-based UI, Vite for blazing fast HMR
- **Redux Toolkit** - Predictable state management, normalized state pattern, great DevTools
- **@hello-pangea/dnd** - Smooth drag-and-drop with accessibility support
- **Socket.io-client** - Pairs with backend for real-time events
- **React Router v7** - Client-side routing without page reloads

## System Architecture

### Modular Structure

The system follows a modular architecture where both backend and frontend are organized by feature rather than by file type. This makes it easier to locate all code related to a specific feature (e.g., "tasks") in one place.

**Backend Modules** (~/backend/src/modules/):
- **auth/** - Authentication: register, login, JWT validation
- **board/** - Board CRUD, members, permissions  
- **list/** - List operations, position management
- **task/** - Task CRUD, movement, assignments
- **label/** - Labels/tags for tasks
- **comment/** - Task comments
- **activity/** - Activity logging (who did what when)
- **invitation/** - Board invitations system
- **user/** - User profile, search

Each module contains:
- `*.controller.js` - HTTP request/response handlers
- `*.service.js` - Business logic and database operations
- `*.routes.js` - Route definitions

**Benefits:**
- All task-related code in one place
- Easy to locate functionality
- Scales well (add new features without touching existing)
- Easier for new developers to navigate

### Data Flow

**1. User Interaction Flow**
```
User Action (e.g., create task)
  → Component dispatches Redux thunk
    → API call to backend
      → Backend validates + saves to database
        → Backend emits socket event to room
          → All connected clients receive event
            → Redux reducer updates state
              → React re-renders affected components
```

**2. Real-Time Update Flow**
```
User A creates task → Backend saves → Socket emits to board room 
→ User B's client receives event → Redux updates → UI reflects change
```

**3. Optimistic Updates** (for responsiveness)
```
Some actions update UI immediately, then sync with server:
- Task drag-and-drop (instant UI feedback, API call confirms position)
- This provides snappy UX even on slower connections
```

## Database Design

### Schema Structure

**Normalized Relational Structure:**

```sql
User
  ├── owns → Boards
  └── member of → BoardMembers

Board
  ├── has many → Lists (ordered by position)
  ├── has many → BoardMembers (with roles: owner/admin/member)
  ├── has many → Labels
  └── tracks → Activities

List
  └── has many → Tasks (ordered by position)

Task
  ├── belongs to → List
  ├── assigned to → User
  ├── has many → TaskLabels (many-to-many with Label)
  └── has many → Comments

Activity (audit log)
  ├── references → User (who)
  ├── references → Board (where)
  └── stores → action, entity, timestamp
```

### Key Design Decisions

1. **Position-based ordering** - Tasks and lists have numeric `position` fields for custom ordering (not timestamps)
2. **Cascade deletes** - Deleting a board removes all related lists, tasks, labels, activities (handled via Prisma transactions)
3. **Soft deletes skipped** - For simplicity, hard deletes are used (could add `deletedAt` field later)
4. **BoardMember junction table** - Allows users to be members of multiple boards with different roles

## State Management

### Redux Toolkit with Normalized State

```javascript
// State shape for boards
state.board = {
  byId: { 'board-1': {...}, 'board-2': {...} },
  allIds: ['board-1', 'board-2'],
  currentBoardId: 'board-1',
  lists: {
    byId: { 'list-1': {...}, 'list-2': {...} },
    allIds: ['list-1', 'list-2']
  },
  tasks: {
    byId: { 'task-1': {...}, 'task-2': {...} },
    allIds: ['task-1', 'task-2']
  }
}
```

**Why normalized?**
- Fast lookups (O(1) by ID)
- No data duplication
- Easy updates (change one place, reflects everywhere)
- Prevents stale data issues

**Real-time integration:**
- Socket events trigger Redux actions
- Reducers update state immutably
- React components re-render automatically via selectors

## Design Patterns

### 1. Feature-Based Modules

Instead of organizing by file type (controllers/, models/, services/), code is grouped by feature:
```
modules/task/
  ├── task.controller.js
  ├── task.service.js
  └── task.routes.js
```

### 2. Service Layer Pattern

Controllers handle HTTP, services handle business logic:
```javascript
// Controller (thin)
export const createTask = async (req, res) => {
  const task = await taskService.createTask(req.body);
  res.json(task);
};

// Service (fat)
const createTask = async ({ listId, title, userId }) => {
  // Validate permissions
  // Interact with database
  // Log activity
  // Return result
};
```

**Why?**
- Controllers stay clean (just request/response handling)
- Business logic is testable without HTTP
- Can reuse services (e.g., from WebSocket handlers)

### 3. Prisma Transactions for Complex Operations

Deleting a board requires removing all related data atomically:
```javascript
await prisma.$transaction(async (tx) => {
  await tx.taskLabel.deleteMany({ where: { task: { list: { boardId } } } });
  await tx.task.deleteMany({ where: { list: { boardId } } });
  await tx.list.deleteMany({ where: { boardId } });
  await tx.board.delete({ where: { id: boardId } });
});
```

**Why?**
- All-or-nothing guarantee (ACID)
- Prevents orphaned data
- Database stays consistent even if something fails mid-operation

### 4. Socket.io Rooms for Targeted Broadcasting

Each board is a Socket.io room:
```javascript
socket.join(boardId);  // User joins board-specific room
io.to(boardId).emit('task:created', task);  // Only users in that board receive event
```

**Why?**
- Efficient (don't broadcast to everyone)
- Scalable (millions of users across thousands of boards)
- Privacy (users only see events from boards they're in)

## Scalability Considerations

**Current Setup** (handles ~100 concurrent users easily):
- Single Node.js process
- Direct PostgreSQL connection
- In-memory Socket.io rooms

**To Scale to 10,000+ users:**

### 1. Database Connection Pooling
```javascript
// Prisma handles this, but configure in schema.prisma:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  pool_size = 20  // Adjust based on load
}
```

### 2. Redis for Socket.io Adapter
```javascript
// Multiple Node.js processes share socket state
import { createAdapter } from '@socket.io/redis-adapter';
const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));
```

### 3. Horizontal Scaling with Load Balancer
```
Nginx/ALB → [Node 1, Node 2, Node 3] → Postgres + Redis
```
- Sticky sessions for Socket.io
- Redis pub/sub for cross-server events

### 4. Database Optimization
- Add indexes on foreign keys (already done)
- Implement read replicas for GET requests
- Cache frequent queries (board lists) in Redis

### 5. CDN for Frontend
- Serve React bundle from Cloudflare/AWS CloudFront
- Reduces server load, faster global access

## Project Structure

```
task-collaboration/
├── backend/
│   ├── src/
│   │   ├── modules/        # Feature modules (auth, board, task, etc.)
│   │   ├── config/         # Database, socket configuration
│   │   ├── middleware/     # Auth, error handling, board permissions
│   │   ├── utils/          # JWT helpers, utility functions
│   │   ├── app.js          # Express app setup
│   │   └── server.js       # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── migrations/     # Migration history
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/            # Axios HTTP clients
    │   ├── components/     # Reusable UI components
    │   ├── pages/          # Page-level components
    │   ├── store/slices/   # Redux slices
    │   ├── sockets/        # Socket.io client
    │   ├── App.jsx         # Router setup
    │   └── main.jsx        # Entry point
    └── package.json
```

## Security Considerations

### Authentication & Authorization
- JWT tokens with 7-day expiry
- Passwords hashed with bcrypt (10 rounds)
- Role-based access control (owner/admin/member)
- Board membership verified via middleware

### Data Protection
- Environment variables for secrets
- CORS configured to allow only frontend origin
- SQL injection prevented by Prisma (parameterized queries)
- XSS protection via React's automatic escaping

### Production Best Practices
- HTTPS required for production
- Rate limiting should be added
- Input validation on all endpoints
- Error messages don't leak sensitive info

## Performance Optimizations

### Frontend
- Code splitting with React.lazy()
- Normalized Redux state (fast lookups)
- Memoized selectors with reselect
- Debounced search inputs
- Optimistic UI updates for drag-and-drop

### Backend
- Prisma connection pooling
- Indexes on foreign keys and frequently queried fields
- Socket.io rooms for targeted broadcasts
- Async/await for non-blocking I/O
- Transaction batching for complex operations

### Database
- Indexed columns: userId, boardId, listId, taskId
- Position fields for ordering (avoid ORDER BY timestamps)
- Cascade deletes via Prisma (not database triggers)
- Regular VACUUM and ANALYZE (PostgreSQL maintenance)

## Related Documentation

- [Setup Guide](SETUP.md) - Installation and configuration
- [API Documentation](API.md) - Complete API reference
- [Design Decisions](DESIGN_DECISIONS.md) - Why we made certain choices
