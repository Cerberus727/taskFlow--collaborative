# API Documentation

Complete API reference for TaskFlow backend.

## Base URL

```
http://localhost:5000/api
```

Production: Replace with your deployed backend URL.

## Authentication

All protected routes require a JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

Get the token from the `/auth/login` or `/auth/register` response.

## REST API Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-02-16T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get User Profile
```http
GET /auth/profile
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2026-02-16T10:00:00Z"
}
```

---

### Boards

#### Get All Boards
```http
GET /boards
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "board-uuid",
    "title": "My Project",
    "description": "Project management board",
    "isStarred": false,
    "ownerId": "user-uuid",
    "createdAt": "2026-02-16T10:00:00Z",
    "lists": [...],
    "members": [...]
  }
]
```

#### Create Board
```http
POST /boards
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "New Project",
  "description": "Description here"
}
```

**Response (201):**
```json
{
  "id": "board-uuid",
  "title": "New Project",
  "description": "Description here",
  "isStarred": false,
  "ownerId": "user-uuid",
  "createdAt": "2026-02-16T10:00:00Z"
}
```

#### Get Board Details
```http
GET /boards/:boardId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "board-uuid",
  "title": "My Project",
  "description": "Project description",
  "isStarred": false,
  "ownerId": "user-uuid",
  "lists": [
    {
      "id": "list-uuid",
      "title": "To Do",
      "position": 0,
      "tasks": [...]
    }
  ],
  "members": [...],
  "labels": [...],
  "activities": [...]
}
```

#### Update Board
```http
PUT /boards/:boardId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "id": "board-uuid",
  "title": "Updated Title",
  "description": "Updated description",
  ...
}
```

#### Delete Board
```http
DELETE /boards/:boardId
Authorization: Bearer <token>
```

**Permission:** Owner only

**Response (200):**
```json
{
  "message": "Board deleted successfully"
}
```

#### Star/Unstar Board
```http
PATCH /boards/:boardId/star
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "board-uuid",
  "isStarred": true,
  ...
}
```

#### Add Board Member
```http
POST /boards/:boardId/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "teammate@example.com",
  "role": "member"
}
```

**Roles:** `owner`, `admin`, `member`

**Permission:** Owner/Admin only

**Response (200):**
```json
{
  "boardId": "board-uuid",
  "member": {
    "id": "member-uuid",
    "userId": "user-uuid",
    "role": "member",
    "user": {
      "name": "Teammate Name",
      "email": "teammate@example.com"
    }
  }
}
```

---

### Lists

#### Create List
```http
POST /lists
Authorization: Bearer <token>
Content-Type: application/json

{
  "boardId": "board-uuid",
  "title": "In Progress"
}
```

**Response (201):**
```json
{
  "id": "list-uuid",
  "title": "In Progress",
  "position": 1,
  "boardId": "board-uuid",
  "createdAt": "2026-02-16T10:00:00Z"
}
```

#### Update List
```http
PUT /lists/:listId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Done"
}
```

**Response (200):**
```json
{
  "id": "list-uuid",
  "title": "Done",
  "position": 1,
  "boardId": "board-uuid"
}
```

#### Move List
```http
PUT /lists/:listId/move
Authorization: Bearer <token>
Content-Type: application/json

{
  "position": 2
}
```

**Response (200):**
```json
{
  "id": "list-uuid",
  "title": "Done",
  "position": 2,
  "boardId": "board-uuid"
}
```

#### Delete List
```http
DELETE /lists/:listId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "List deleted successfully"
}
```

---

### Tasks

#### Get Tasks
```http
GET /tasks?boardId=board-uuid&search=keyword&page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**
- `boardId` (required) - Filter by board
- `search` (optional) - Search in title/description
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)

**Response (200):**
```json
{
  "tasks": [
    {
      "id": "task-uuid",
      "title": "Task title",
      "description": "Task description",
      "position": 0,
      "listId": "list-uuid",
      "assigneeId": "user-uuid",
      "dueDate": "2026-02-20T00:00:00Z",
      "createdAt": "2026-02-16T10:00:00Z",
      "labels": [...],
      "assignee": {...}
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Create Task
```http
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "listId": "list-uuid",
  "title": "New task",
  "description": "Task details"
}
```

**Response (201):**
```json
{
  "id": "task-uuid",
  "title": "New task",
  "description": "Task details",
  "position": 0,
  "listId": "list-uuid",
  "assigneeId": null,
  "dueDate": null,
  "createdAt": "2026-02-16T10:00:00Z"
}
```

#### Update Task
```http
PUT /tasks/:taskId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated task",
  "description": "Updated details",
  "dueDate": "2026-02-20T00:00:00Z"
}
```

**Response (200):**
```json
{
  "id": "task-uuid",
  "title": "Updated task",
  "description": "Updated details",
  "dueDate": "2026-02-20T00:00:00Z",
  ...
}
```

#### Move Task
```http
PUT /tasks/:taskId/move
Authorization: Bearer <token>
Content-Type: application/json

{
  "listId": "target-list-uuid",
  "sourceListId": "source-list-uuid",
  "position": 1
}
```

**Response (200):**
```json
{
  "id": "task-uuid",
  "listId": "target-list-uuid",
  "position": 1,
  ...
}
```

#### Assign Task
```http
PATCH /tasks/:taskId/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "assigneeId": "user-uuid"
}
```

**Response (200):**
```json
{
  "id": "task-uuid",
  "assigneeId": "user-uuid",
  "assignee": {
    "id": "user-uuid",
    "name": "Assignee Name",
    "email": "assignee@example.com"
  },
  ...
}
```

#### Delete Task
```http
DELETE /tasks/:taskId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

---

### Labels

#### Get Board Labels
```http
GET /labels/:boardId
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "label-uuid",
    "name": "Bug",
    "color": "#e74c3c",
    "boardId": "board-uuid"
  }
]
```

#### Create Label
```http
POST /labels
Authorization: Bearer <token>
Content-Type: application/json

{
  "boardId": "board-uuid",
  "name": "Feature",
  "color": "#3498db"
}
```

**Response (201):**
```json
{
  "id": "label-uuid",
  "name": "Feature",
  "color": "#3498db",
  "boardId": "board-uuid"
}
```

#### Update Label
```http
PUT /labels/:labelId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Enhancement",
  "color": "#2ecc71"
}
```

**Response (200):**
```json
{
  "id": "label-uuid",
  "name": "Enhancement",
  "color": "#2ecc71",
  "boardId": "board-uuid"
}
```

#### Delete Label
```http
DELETE /labels/:labelId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Label deleted successfully"
}
```

#### Add Label to Task
```http
POST /tasks/:taskId/labels
Authorization: Bearer <token>
Content-Type: application/json

{
  "labelId": "label-uuid"
}
```

**Response (200):**
```json
{
  "taskId": "task-uuid",
  "labelId": "label-uuid",
  "label": {
    "id": "label-uuid",
    "name": "Bug",
    "color": "#e74c3c"
  }
}
```

---

### Activities

#### Get Board Activities
```http
GET /activities/:boardId
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "activity-uuid",
    "action": "created",
    "entity": "task",
    "entityId": "task-uuid",
    "details": {
      "title": "New Task"
    },
    "userId": "user-uuid",
    "boardId": "board-uuid",
    "createdAt": "2026-02-16T10:00:00Z",
    "user": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
]
```

---

### Users

#### Search Users
```http
GET /users?search=john
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
]
```

---

## WebSocket Events (Socket.io)

### Connection

Connect to the Socket.io server:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Client → Server Events

#### Join Board Room
```javascript
socket.emit('join-board', boardId);
```

#### Leave Board Room
```javascript
socket.emit('leave-board', boardId);
```

### Server → Client Events

#### List Events
```javascript
// New list created
socket.on('list:created', (list) => {
  console.log('List created:', list);
});

// List updated
socket.on('list:updated', (list) => {
  console.log('List updated:', list);
});

// List deleted
socket.on('list:deleted', ({ listId }) => {
  console.log('List deleted:', listId);
});
```

#### Task Events
```javascript
// New task created
socket.on('task:created', (task) => {
  console.log('Task created:', task);
});

// Task updated
socket.on('task:updated', (task) => {
  console.log('Task updated:', task);
});

// Task moved
socket.on('task:moved', ({ taskId, listId, position }) => {
  console.log('Task moved:', taskId, listId, position);
});

// Task deleted
socket.on('task:deleted', ({ taskId }) => {
  console.log('Task deleted:', taskId);
});
```

#### Label Events
```javascript
// Label created
socket.on('label:created', (label) => {
  console.log('Label created:', label);
});

// Label updated
socket.on('label:updated', (label) => {
  console.log('Label updated:', label);
});

// Label deleted
socket.on('label:deleted', ({ labelId }) => {
  console.log('Label deleted:', labelId);
});
```

#### Board Events
```javascript
// Board updated
socket.on('board-updated', (board) => {
  console.log('Board updated:', board);
});

// Board deleted
socket.on('board-deleted', ({ boardId }) => {
  console.log('Board deleted:', boardId);
});

// Member added
socket.on('member-added', (member) => {
  console.log('Member added:', member);
});
```

### Example Frontend Integration

```javascript
import socketService from './sockets/socket';
import { useDispatch } from 'react-redux';
import { addTaskRealtime, updateTaskRealtime, deleteTaskRealtime } from './store/slices/boardSlice';

function BoardComponent({ boardId }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const socket = socketService.connect();
    socketService.joinBoard(boardId);

    // Listen for task events
    socket.on('task:created', (task) => {
      dispatch(addTaskRealtime(task));
    });

    socket.on('task:updated', (task) => {
      dispatch(updateTaskRealtime(task));
    });

    socket.on('task:deleted', ({ taskId }) => {
      dispatch(deleteTaskRealtime(taskId));
    });

    // Cleanup
    return () => {
      socketService.leaveBoard(boardId);
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:deleted');
    };
  }, [boardId, dispatch]);

  return <div>Board content...</div>;
}
```

## Error Responses

All endpoints return consistent error responses:

**400 Bad Request:**
```json
{
  "error": "Validation failed",
  "details": ["Title is required"]
}
```

**401 Unauthorized:**
```json
{
  "error": "No token provided"
}
```

**403 Forbidden:**
```json
{
  "error": "You don't have permission to perform this action"
}
```

**404 Not Found:**
```json
{
  "error": "Board not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

Currently not implemented. For production, consider adding rate limiting:
- 100 requests per 15 minutes per IP
- 1000 requests per hour per authenticated user

## Related Documentation

- [Setup Guide](SETUP.md) - Installation and configuration
- [Architecture](ARCHITECTURE.md) - System design and patterns
- [Design Decisions](DESIGN_DECISIONS.md) - Technical trade-offs
