# Design Decisions & Trade-Offs

Explanation of key technical decisions, assumptions, and trade-offs made in TaskFlow's architecture.

## Assumptions

### 1. Users Have Stable Internet

**Assumption:** Real-time features assume a persistent WebSocket connection.

**Impact:**
- If users go offline, changes don't sync until reconnection
- No offline queue or conflict resolution
- Real-time updates are the core feature

**Mitigation:**
- Socket.io handles reconnection automatically
- Could add offline mode in v2 with local storage + sync queue

---

### 2. Small to Medium Teams

**Assumption:** Designed for teams of 5-50 members per board.

**Impact:**
- Not optimized for boards with 1000+ members
- Member list loads all members at once (no pagination)
- Activity feed could get overwhelming

**Mitigation:**
- Works well for target use case (most teams are small)
- Can add pagination and filtering later if needed
- Database indexes ensure good performance up to 100+ members

---

### 3. English Language Only

**Assumption:** No internationalization (i18n) infrastructure.

**Impact:**
- UI text is hardcoded in English
- Date/time formatting uses browser locale but UI labels are English
- Error messages are in English

**Mitigation:**
- Can add `i18next` or similar library later
- Architecture doesn't prevent i18n, just not implemented yet

---

### 4. Modern Browsers Only

**Assumption:** Targets ES6+ browsers (Chrome, Firefox, Safari, Edge).

**Impact:**
- No IE11 support
- Uses modern JavaScript (async/await, fetch, ES modules)
- CSS Grid and Flexbox used extensively

**Rationale:**
- IE11 usage is <1% globally (2026)
- Simplifies development significantly
- Better performance and developer experience

---

### 5. Single Timezone

**Assumption:** Dates stored in UTC, displayed in user's local time.

**Impact:**
- No explicit timezone selection
- Due dates might be confusing for distributed teams
- Activity timestamps show local time

**Mitigation:**
- Acceptable for most teams in same timezone
- Could add explicit timezone field to user profile later

---

### 6. Trust in Team Members

**Assumption:** Anyone with board access can create/edit/delete lists and tasks.

**Impact:**
- No fine-grained permissions at task/list level
- Only 3 roles: Owner, Admin, Member
- Members can delete any task (not just their own)

**Rationale:**
- Keeps permission model simple
- Matches Trello's model
- Teams trust their members
- Activity log provides audit trail

---

## Technical Trade-Offs

### JWT vs Session-Based Auth

**Decision:** JWT (JSON Web Tokens)

**Pros:**
- Stateless - scales horizontally without shared session storage
- No database lookup on every request
- Works great with microservices
- Client can store token in localStorage

**Cons:**
- Can't invalidate tokens immediately (must wait for expiry)
- Token size larger than session ID
- If secret key leaks, all tokens compromised

**Why JWT?**
- Scalability is more important than instant revocation
- 7-day expiry is acceptable risk
- Can add token blacklist in Redis if needed for logout
- Simplifies deployment (no session store needed)

---

### PostgreSQL vs MongoDB

**Decision:** PostgreSQL

**Pros:**
- Relational data fits SQL perfectly (boards → lists → tasks)
- ACID transactions (critical for cascade deletes)
- Strong consistency guarantees
- Foreign keys prevent orphaned data
- Excellent performance with proper indexes

**Cons:**
- Less flexible schema changes (migrations required)
- More complex queries (JOINs)
- Slightly more setup than MongoDB

**Why PostgreSQL?**
- Data is inherently relational
- Transactions are essential (delete board = delete everything)
- Mature ecosystem (Prisma ORM is excellent)
- Better data integrity guarantees
- Could use MongoDB for activity logs (write-heavy) but kept it simple

---

### Redux vs React Context API

**Decision:** Redux Toolkit

**Pros:**
- Excellent DevTools (time-travel debugging)
- Middleware support (thunks for async)
- Normalized state pattern (prevents duplication)
- Better performance (fine-grained subscriptions)
- Easier to test

**Cons:**
- More boilerplate than Context
- Steeper learning curve
- Overkill for simple apps

**Why Redux?**
- Complex state (boards, lists, tasks, real-time updates)
- Normalized state prevents bugs (single source of truth)
- DevTools are invaluable for debugging real-time features
- Scales well as app grows
- Context API would lead to prop drilling hell

---

### Vite (SPA) vs Next.js (SSR)

**Decision:** Vite + React SPA

**Pros:**
- Blazing fast dev server (instant HMR)
- Simpler deployment (just static files)
- No SSR complexity
- Perfect for authenticated apps

**Cons:**
- No SEO benefits (but doesn't matter here)
- No static generation
- Slower initial load (but cached after first visit)

**Why Vite?**
- This is an authenticated app (no public content to index)
- SEO doesn't matter for internal tools
- Vite's DX is superior (instant reloads)
- Simpler to reason about (no server/client split)
- Next.js is overkill for SPAs

---

### Socket.io vs Polling

**Decision:** Socket.io (WebSockets)

**Pros:**
- True real-time (instant updates)
- Lower latency
- More efficient (persistent connection)
- Server can push updates without client request

**Cons:**
- More complex than polling
- Requires WebSocket support
- Harder to debug
- Load balancing requires sticky sessions

**Why Socket.io?**
- Real-time collaboration is the core feature
- Polling would be slow and inefficient
- Socket.io handles fallbacks (long polling if WebSocket unavailable)
- Rooms feature perfect for board-based collaboration
- Mature, battle-tested library

---

### Normalized vs Denormalized Redux State

**Decision:** Normalized state (byId/allIds pattern)

**Pros:**
- O(1) lookups by ID
- No data duplication
- Easy to update (change one place)
- Prevents stale data

**Cons:**
- More complex to set up
- Requires selectors to reconstruct data
- Steeper learning curve

**Why Normalized?**
- Tasks belong to lists, but can be updated independently
- Real-time updates would cause duplication issues with nested state
- Fast lookups critical for drag-and-drop performance
- Scales well as data grows

**Alternative (Denormalized):**
```javascript
// Would lead to bugs with real-time updates
lists: [
  { id: 1, tasks: [{ id: 'a' }, { id: 'b' }] },
  { id: 2, tasks: [{ id: 'c' }] }
]
// If task 'a' is updated via socket, need to find parent list
```

---

### Hard Deletes vs Soft Deletes

**Decision:** Hard deletes (no soft delete)

**Pros:**
- Simpler code (no `WHERE deletedAt IS NULL` everywhere)
- No database bloat
- Clearer intent (delete means delete)

**Cons:**
- Can't restore deleted items
- No "trash" feature
- Accidental deletes are permanent

**Why Hard Deletes?**
- Confirmation modals prevent accidents
- Keep MVP simple
- Activity log provides audit trail
- Can add soft deletes later if users request it
- Most collaborative tools (Trello, Notion) use hard deletes initially

---

### No Offline Mode

**Decision:** Requires internet connection

**Pros:**
- Simple implementation
- No conflict resolution needed
- Real-time is the core feature

**Cons:**
- Unusable without internet
- No offline queue

**Why No Offline?**
- Conflict resolution is extremely complex
  - User A edits task offline
  - User B edits same task offline
  - Both come online - which change wins?
- Real-time collaboration requires connection
- Most users have stable internet in 2026
- Offline mode could be v2 feature with CRDT (Conflict-free Replicated Data Types)

---

### Prisma vs Raw SQL

**Decision:** Prisma ORM

**Pros:**
- Type-safe queries (TypeScript integration)
- Auto-generated client
- Excellent migration tools
- Prevents SQL injection
- Great DX (autocomplete, validation)

**Cons:**
- Slight performance overhead vs raw SQL
- Limited control over complex queries
- Learning curve for Prisma-specific patterns

**Why Prisma?**
- Developer productivity > micro-optimizations
- Type safety prevents bugs
- Migrations are managed properly
- Generated types save time
- Can drop down to raw SQL if needed (`prisma.$queryRaw`)

---

### Activity Log in Database vs Separate Service

**Decision:** Activity log stored in PostgreSQL

**Pros:**
- Simple (same database as everything else)
- Queryable with SQL
- Transactional (log saved with action)
- Easy to implement

**Cons:**
- Could bloat database
- Slower queries as log grows
- Not optimized for time-series data

**Why Database?**
- Simple solution for MVP
- Works well up to millions of activities
- Can paginate and index for performance
- Could move to time-series DB later (InfluxDB, Elasticsearch)
- Could archive old activities (>90 days) to separate table

---

### Position Integers vs Timestamps for Ordering

**Decision:** Position field (integer)

**Pros:**
- Explicit ordering (user-defined)
- Supports drag-and-drop perfectly
- No edge cases (same timestamp issues)

**Cons:**
- Requires reordering other items when position changes
- More complex than sorting by createdAt

**Why Position Field?**
- Kanban boards need custom ordering
- Can't rely on creation time (older tasks can be moved to top)
- Matches Trello's approach
- Reordering algorithm is efficient (only update affected items)

---

### Monorepo vs Separate Repos

**Decision:** Monorepo (backend + frontend in one repo)

**Pros:**
- Easier local development
- Shared types/constants possible
- Atomic commits (change API + frontend together)
- Simpler CI/CD

**Cons:**
- Larger repo size
- Harder to version independently
- Mixed dependencies

**Why Monorepo?**
- Tightly coupled frontend and backend
- Simplifies development workflow
- Matches small team reality (same people work on both)
- Can split later if needed

---

### No Rate Limiting (Yet)

**Decision:** No rate limiting in MVP

**Risk:**
- API could be abused
- DDoS vulnerability
- Malicious users could overload server

**Why Not Implemented?**
- Keeps MVP simple
- Not exposed to public initially
- Easy to add later (express-rate-limit)
- Should be added before production deployment

**Recommendation for Production:**
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Future Considerations

These decisions can be revisited if requirements change:

1. **Add token blacklist** (Redis) if instant logout is needed
2. **Implement soft deletes** if users want "trash" feature
3. **Add offline mode** with CRDT if offline collaboration needed
4. **Move activity log** to Elasticsearch if scale requires
5. **Add rate limiting** before production deployment
6. **Implement i18n** if non-English users are target market
7. **Add fine-grained permissions** if enterprise customers need it

---

## Related Documentation

- [Architecture](ARCHITECTURE.md) - System design and patterns
- [API Documentation](API.md) - Complete API reference
- [Setup Guide](SETUP.md) - Installation and configuration
