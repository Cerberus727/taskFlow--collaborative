# API Contract Documentation

## Authentication

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token"
}
```

### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token"
}
```

## Boards

### Create Board
```http
POST /api/boards
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "My Project",
  "description": "Project description"
}
```

### Get All Boards
```http
GET /api/boards
Authorization: Bearer {token}
```

### Get Single Board
```http
GET /api/boards/:id
Authorization: Bearer {token}
```

## Lists

### Create List
```http
POST /api/lists
Authorization: Bearer {token}
Content-Type: application/json

{
  "boardId": "board_uuid",
  "title": "To Do"
}
```

## Tasks

### Create Task
```http
POST /api/tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "listId": "list_uuid",
  "title": "Task title",
  "description": "Task description"
}
```

### Move Task
```http
PUT /api/tasks/:id/move
Authorization: Bearer {token}
Content-Type: application/json

{
  "listId": "target_list_uuid",
  "position": 2
}
```

## Real-time Synchronization Strategy

### Socket.io Implementation

1. **Connection**: Client connects to Socket.io server on login
2. **Board Rooms**: Each board has a dedicated Socket.io room
3. **Join/Leave**: Users join board room when viewing board, leave on unmount
4. **Event Broadcasting**: Server emits events to all users in the same board room

### Events Flow

```
User Action → API Request → Database Update → Socket Event Emission → 
All Connected Clients in Room → React State Update → UI Re-render
```

### Conflict Resolution

- **Optimistic Updates**: UI updates immediately, rolls back on error
- **Server Authority**: Server is source of truth for all operations
- **Position Recalculation**: Task positions recalculated on server for consistency
- **Transaction Safety**: Database transactions ensure atomic operations

### Performance Optimizations

- **Debouncing**: Real-time events are not debounced to ensure instant feedback
- **Selective Updates**: Only affected components re-render
- **Lazy Loading**: Large boards load lists and tasks on demand
