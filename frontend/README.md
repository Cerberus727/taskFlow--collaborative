# TaskFlow Frontend

React-based single-page application for the TaskFlow task management platform.

## Tech Stack

- **React 19** - UI library
- **Redux Toolkit** - State management with normalized patterns
- **Vite** - Build tool and dev server
- **Socket.io Client** - Real-time WebSocket connections
- **@hello-pangea/dnd** - Drag-and-drop functionality
- **React Router** - Client-side routing

## Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Features

### State Management
- Normalized Redux store (byId/allIds patterns)
- Optimistic updates for better UX
- Real-time synchronization via WebSocket events
- Persistent auth tokens in localStorage

### UI Components
- **Theme Support** - Light/Dark mode with CSS variables
- **Drag & Drop** - Smooth task and list reordering
- **Real-time Updates** - Instant sync across all connected clients
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modal System** - Task details, invitations, labels
- **Smart Filters** - Filter by date, priority, search

### Key Components

- `Layout/` - App shell with navbar and theme toggle
- `TaskDetailModal/` - Full task editor with comments, labels, due dates
- `TaskCard/` - Individual task display with priority badges
- `CreateTask/` - Enhanced task creation with priority and due date
- `BoardList/` - Drag-and-drop list container
- `ActivitySidebar/` - Real-time activity feed
- `InvitationBell/` - Board invitation notifications

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## Project Structure

```
src/
├── api/           # HTTP client functions
├── assets/        # Images, icons, static files
├── components/    # Reusable UI components
├── context/       # React context providers (Auth, Theme)
├── pages/         # Route-level components
├── sockets/       # Socket.io client configuration
├── store/         # Redux slices and store setup
├── App.jsx        # Root component with routing
└── main.jsx       # Entry point
```

## Styling

- CSS Modules for component-specific styles
- CSS Variables for theming (light/dark mode)
- Consistent spacing and color palette
- Responsive breakpoints for mobile/tablet/desktop

## Real-Time Features

The app listens for these Socket.io events:

- `task:created` - New task added
- `task:updated` - Task modified
- `task:moved` - Task position changed
- `task:deleted` - Task removed
- `list:created` - New list added
- `list:updated` - List renamed
- `comment:created` - New comment added
- `member:added` - Member joined board

## Testing

```bash
# Run tests (when implemented)
npm test

# Check TypeScript types (if using TS)
npm run type-check
```

## Performance Optimizations

- Code splitting via dynamic imports
- Memoized selectors with Redux Toolkit
- Debounced search inputs
- Lazy loading for modals and sidebars
- Optimistic UI updates (instant feedback before server confirmation)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Common Issues

**Blank screen on load?**  
Check browser console for errors. Ensure backend is running on the correct URL.

**Real-time updates not working?**  
Verify `VITE_SOCKET_URL` matches your backend URL. Check Socket.io connection in Network tab.

**Theme not persisting?**  
Check browser localStorage. Theme preference is stored as `theme` key.

**Build errors?**  
Clear cache: `rm -rf node_modules dist && npm install && npm run build`

## Contributing

When adding new features:

1. Create components in appropriate directories
2. Add Redux slices for new data entities
3. Update socket listeners for real-time sync
4. Use CSS variables for theme compatibility
5. Test in both light and dark modes
6. Ensure responsive design works on mobile

---

Built with React + Vite. For backend documentation, see [backend/README.md](../backend/README.md).

