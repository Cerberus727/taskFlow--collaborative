# Real-Time Synchronization Strategy

## Overview

The Task Collaboration Platform uses Socket.io for real-time bidirectional communication between clients and the server. This document outlines the architecture, event structure, and implementation details.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client A      │     │   Server        │     │   Client B      │
│   (Browser)     │◄───►│   (Node.js)     │◄───►│   (Browser)     │
│                 │     │   + Socket.io   │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │    WebSocket          │                       │
        │◄──────────────────────┼──────────────────────►│
        │                       │                       │
```

## Connection Management

### Client Connection
```javascript
// Frontend: socket initialization
const socket = io(SOCKET_URL, {
  auth: { token: jwtToken },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
```

### Server Authentication
```javascript
// Backend: socket middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Verify JWT and attach user to socket
  socket.user = decoded;
  next();
});
```

## Room-Based Broadcasting

### Concept
Each board is a Socket.io "room". When users join a board, they subscribe to that board's room to receive updates.

### Room Management
```javascript
// Join board room
socket.on('board:join', (boardId) => {
  socket.join(boardId);
});

// Leave board room
socket.on('board:leave', (boardId) => {
  socket.leave(boardId);
});
```

### Broadcasting Pattern
```javascript
// Emit to all users in a board room
getIO().to(boardId).emit('eventName', payload);
```

## Event Taxonomy

### Board Events
| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `board:join` | Client → Server | `boardId` | Join board room |
| `board:leave` | Client → Server | `boardId` | Leave board room |
| `board:updated` | Server → Client | `{ board }` | Board details changed |
| `board:deleted` | Server → Client | `{ boardId }` | Board was deleted |

### List Events
| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `list:created` | Server → Client | `{ list }` | New list added |
| `list:updated` | Server → Client | `{ list }` | List title changed |
| `list:moved` | Server → Client | `{ listId, position, boardId }` | List reordered |
| `list:deleted` | Server → Client | `{ listId, boardId }` | List removed |

### Task Events
| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `task:created` | Server → Client | `{ task, boardId }` | New task added |
| `task:updated` | Server → Client | `{ task, boardId }` | Task details changed |
| `task:moved` | Server → Client | `{ taskId, sourceListId, listId, position, boardId }` | Task moved |
| `task:deleted` | Server → Client | `{ taskId, boardId }` | Task removed |
| `task:assigned` | Server → Client | `{ task, boardId }` | Task assigned to user |

### Member Events
| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `member:added` | Server → Client | `{ member, boardId }` | New member joined |
| `member:updated` | Server → Client | `{ member, boardId }` | Member role changed |
| `member:removed` | Server → Client | `{ memberId, boardId }` | Member removed |

## Client-Side State Management

### Redux Integration
```javascript
// Socket event handlers update Redux store
socket.on('task:created', (data) => {
  dispatch(addTaskRealtime(data));
});

socket.on('task:moved', (data) => {
  dispatch(moveTaskRealtime(data));
});
```

### Optimistic Updates
For better UX, the app uses optimistic updates:
1. Update local state immediately
2. Send request to server
3. If server fails, rollback local state

```javascript
// Optimistic task move
const handleDragEnd = async (result) => {
  // 1. Optimistic update
  dispatch(moveTaskOptimistic({
    taskId,
    sourceListId,
    destListId,
    destIndex,
  }));

  try {
    // 2. Server request
    await dispatch(moveTask({ id, listId, position }));
  } catch (error) {
    // 3. Rollback on failure
    dispatch(rollbackTaskMove({ taskId, sourceListId, sourceIndex }));
  }
};
```

## Conflict Resolution

### Last-Write-Wins
Simple conflict resolution where the latest update overwrites previous state.

### Server of Truth
The server is always the source of truth. Clients sync their state with server responses.

### Sequence Handling
```javascript
// Each event includes timestamp for ordering
{
  eventType: 'task:updated',
  payload: { ... },
  timestamp: Date.now(),
  boardId: 'uuid'
}
```

## Reconnection Handling

### Auto-Reconnect
Socket.io automatically attempts reconnection:
```javascript
socket.on('connect', () => {
  // Rejoin previously joined boards
  currentBoards.forEach(boardId => {
    socket.emit('board:join', boardId);
  });
});
```

### State Resync
After reconnection, refetch current board state:
```javascript
socket.on('reconnect', () => {
  if (currentBoardId) {
    dispatch(fetchBoard(currentBoardId));
  }
});
```

## Performance Considerations

### Message Batching
For high-frequency updates, consider batching:
```javascript
// Debounced position updates
const debouncedMove = debounce((taskId, position) => {
  socket.emit('task:move', { taskId, position });
}, 100);
```

### Selective Broadcasting
Only emit to relevant rooms:
```javascript
// Good: Emit to specific board room
getIO().to(boardId).emit('task:created', task);

// Avoid: Broadcasting to all connections
getIO().emit('task:created', task); // Don't do this
```

### Payload Optimization
Keep payloads minimal:
```javascript
// Good: Only necessary data
emit('task:moved', { taskId, listId, position });

// Avoid: Entire task object with all relations
emit('task:moved', { task: entireTaskWithAllRelations });
```

## Security Considerations

### Authentication
- JWT validation on every connection
- Token refresh handling for long sessions

### Authorization
- Room-based isolation (users only receive events for boards they're members of)
- Server validates membership before allowing room join

### Rate Limiting
- 100 messages per minute per socket
- Connection limit per IP

## Monitoring & Debugging

### Server-Side Logging
```javascript
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id} - User: ${socket.user.id}`);
  
  socket.onAny((event, ...args) => {
    console.log(`Event: ${event}`, args);
  });
});
```

### Client-Side Debugging
```javascript
// Enable Socket.io debug mode
localStorage.debug = 'socket.io-client:*';
```

## Future Improvements

1. **Presence System**: Show who's currently viewing a board
2. **Cursor Tracking**: Real-time cursor positions for collaboration
3. **Typing Indicators**: Show when users are editing tasks
4. **Offline Queue**: Queue actions when offline, sync when back online
5. **Event Sourcing**: Full event log for undo/redo and history
