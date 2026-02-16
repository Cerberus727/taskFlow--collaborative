# API Contract Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string (min 6 chars)"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "token": "jwt_token"
}
```

### POST /auth/login
Authenticate and get access token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "token": "jwt_token"
}
```

### GET /auth/me 🔒
Get current user profile.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string"
}
```

---

## Board Endpoints

### GET /boards 🔒
Get all boards for the authenticated user.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "title": "string",
    "description": "string | null",
    "createdAt": "datetime",
    "updatedAt": "datetime",
    "members": [
      {
        "id": "uuid",
        "role": "owner | admin | member",
        "user": {
          "id": "uuid",
          "name": "string",
          "email": "string"
        }
      }
    ]
  }
]
```

### POST /boards 🔒
Create a new board.

**Request Body:**
```json
{
  "title": "string",
  "description": "string (optional)"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "members": [...],
  "lists": []
}
```

### GET /boards/:id 🔒
Get a specific board with all lists and tasks.

**Response (200):**
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "members": [...],
  "lists": [
    {
      "id": "uuid",
      "title": "string",
      "position": "number",
      "tasks": [
        {
          "id": "uuid",
          "title": "string",
          "description": "string | null",
          "position": "number",
          "dueDate": "datetime | null",
          "labels": ["string"],
          "assigneeId": "uuid | null",
          "assignee": { "id": "uuid", "name": "string", "email": "string" } | null
        }
      ]
    }
  ]
}
```

### PUT /boards/:id 🔒
Update board details. Requires `owner` or `admin` role.

**Request Body:**
```json
{
  "title": "string (optional)",
  "description": "string (optional)"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null"
}
```

### DELETE /boards/:id 🔒
Delete a board. Requires `owner` role.

**Response (200):**
```json
{
  "message": "Board deleted successfully"
}
```

### POST /boards/:id/members 🔒
Add a member to the board. Requires `owner` or `admin` role.

**Request Body:**
```json
{
  "email": "string",
  "role": "admin | member"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "boardId": "uuid",
  "role": "string",
  "user": {
    "id": "uuid",
    "name": "string",
    "email": "string"
  }
}
```

### PATCH /boards/:id/members/:memberId 🔒
Update a member's role. Requires `owner` or `admin` role.

**Request Body:**
```json
{
  "role": "admin | member"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "role": "string"
}
```

### DELETE /boards/:id/members/:memberId 🔒
Remove a member from the board. Requires `owner` or `admin` role.

**Response (200):**
```json
{
  "message": "Member removed successfully"
}
```

---

## List Endpoints

### POST /lists 🔒
Create a new list in a board.

**Request Body:**
```json
{
  "boardId": "uuid",
  "title": "string"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "title": "string",
  "boardId": "uuid",
  "position": "number"
}
```

### PUT /lists/:id 🔒
Update list title.

**Request Body:**
```json
{
  "title": "string"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "title": "string",
  "boardId": "uuid",
  "position": "number"
}
```

### PUT /lists/:id/move 🔒
Move list to a new position.

**Request Body:**
```json
{
  "position": "number"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "position": "number",
  "boardId": "uuid"
}
```

### DELETE /lists/:id 🔒
Delete a list and all its tasks.

**Response (200):**
```json
{
  "message": "List deleted successfully"
}
```

---

## Task Endpoints

### GET /tasks 🔒
Get tasks with optional filters.

**Query Parameters:**
- `listId` (optional): Filter by list
- `boardId` (optional): Filter by board

**Response (200):**
```json
[
  {
    "id": "uuid",
    "title": "string",
    "description": "string | null",
    "position": "number",
    "listId": "uuid",
    "dueDate": "datetime | null",
    "labels": ["string"],
    "assigneeId": "uuid | null"
  }
]
```

### GET /tasks/search 🔒
Search tasks with pagination.

**Query Parameters:**
- `q` (required): Search query
- `boardId` (optional): Limit search to a specific board
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page

**Response (200):**
```json
{
  "tasks": [...],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

### POST /tasks 🔒
Create a new task.

**Request Body:**
```json
{
  "listId": "uuid",
  "title": "string",
  "description": "string (optional)",
  "dueDate": "datetime (optional)",
  "labels": ["string"] (optional)
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "position": "number",
  "listId": "uuid",
  "dueDate": "datetime | null",
  "labels": ["string"],
  "boardId": "uuid"
}
```

### PUT /tasks/:id 🔒
Update task details.

**Request Body:**
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "dueDate": "datetime (optional)",
  "labels": ["string"] (optional)
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "dueDate": "datetime | null",
  "labels": ["string"]
}
```

### PUT /tasks/:id/move 🔒
Move task to a different list/position.

**Request Body:**
```json
{
  "listId": "uuid",
  "position": "number"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "listId": "uuid",
  "position": "number"
}
```

### PATCH /tasks/:id/assign 🔒
Assign a task to a board member.

**Request Body:**
```json
{
  "assigneeId": "uuid | null"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "assigneeId": "uuid | null",
  "assignee": { ... } | null
}
```

### DELETE /tasks/:id 🔒
Delete a task.

**Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

---

## Activity Endpoints

### GET /activities/board/:boardId 🔒
Get paginated activity log for a board.

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page

**Response (200):**
```json
{
  "activities": [
    {
      "id": "uuid",
      "action": "created | updated | deleted | moved | assigned | member_added | member_removed",
      "entity": "board | list | task | member",
      "entityId": "uuid",
      "boardId": "uuid",
      "metadata": "json_string | null",
      "createdAt": "datetime",
      "user": {
        "id": "uuid",
        "name": "string",
        "email": "string"
      }
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

### GET /activities/board/:boardId/recent 🔒
Get recent activities (no pagination).

**Query Parameters:**
- `limit` (optional, default: 10): Number of activities

**Response (200):**
```json
[
  {
    "id": "uuid",
    "action": "string",
    "entity": "string",
    "entityId": "uuid",
    "createdAt": "datetime",
    "user": { ... }
  }
]
```

### GET /activities/entity/:entity/:entityId 🔒
Get activity history for a specific entity.

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Response (200):**
```json
{
  "activities": [...],
  "pagination": { ... }
}
```

---

## Error Responses

All endpoints may return the following error formats:

**400 Bad Request:**
```json
{
  "message": "Validation error message"
}
```

**401 Unauthorized:**
```json
{
  "message": "Not authorized, token failed"
}
```

**403 Forbidden:**
```json
{
  "message": "Permission denied"
}
```

**404 Not Found:**
```json
{
  "message": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Server error message"
}
```

---

## Rate Limiting

The API implements rate limiting:
- **Window**: 15 minutes
- **Max Requests**: 100 per window per IP

Exceeded limits return `429 Too Many Requests`.
