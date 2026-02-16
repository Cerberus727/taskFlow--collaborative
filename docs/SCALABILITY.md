# Scalability Considerations

## Current Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   React SPA  │────►│   Express    │────►│  PostgreSQL  │
│   (Vite)     │     │   + Socket   │     │   (Prisma)   │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Scalability Vectors

### 1. Database Scaling

#### Current Optimizations
- **Indexed Fields**: All foreign keys and frequently queried fields are indexed
  ```prisma
  @@index([boardId])
  @@index([listId])
  @@index([assigneeId])
  @@index([title])
  ```

- **Pagination**: All list endpoints support pagination to limit data transfer
  ```javascript
  const { page = 1, limit = 20 } = req.query;
  skip: (page - 1) * limit,
  take: limit
  ```

#### Future Improvements
1. **Read Replicas**: Route read queries to replicas
2. **Connection Pooling**: Use PgBouncer for connection management
3. **Query Caching**: Cache frequently accessed boards with Redis
4. **Archival Strategy**: Move old boards/activities to cold storage

### 2. Application Server Scaling

#### Horizontal Scaling Challenges
- **Socket.io State**: In-memory socket connections are server-specific
- **Session Affinity**: Need sticky sessions or distributed sessions

#### Solutions

##### Socket.io with Redis Adapter
```javascript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

##### Load Balancing
```
                    ┌─────────────┐
                    │   Nginx     │
                    │   (LB)      │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   App 1     │ │   App 2     │ │   App 3     │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           └───────────────┼───────────────┘
                           ▼
                    ┌─────────────┐
                    │    Redis    │
                    │   (PubSub)  │
                    └─────────────┘
```

### 3. Real-Time Scaling

#### Current Approach
- Single server handles all socket connections
- Room-based broadcasting limits message scope

#### Scaling Strategy
1. **Redis Pub/Sub**: Coordinate events across multiple servers
2. **Message Queuing**: Use RabbitMQ/SQS for async processing
3. **Event Batching**: Batch updates for high-frequency operations

```javascript
// Batched broadcasts
const pendingBroadcasts = new Map();

setInterval(() => {
  pendingBroadcasts.forEach((events, room) => {
    if (events.length > 0) {
      io.to(room).emit('batch:updates', events);
      pendingBroadcasts.set(room, []);
    }
  });
}, 100);
```

### 4. Frontend Scaling

#### Bundle Optimization
- **Code Splitting**: Lazy load routes and components
- **Tree Shaking**: Vite automatically removes unused code
- **Asset Compression**: gzip/brotli compression

#### State Management
- **Normalized State**: Prevents data duplication
- **Selective Subscriptions**: Components only rerender for relevant changes

```javascript
// Efficient selector
const selectTaskById = (state, taskId) => 
  state.board.currentBoard?.tasks?.byId[taskId];
```

### 5. API Scaling

#### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
});

app.use('/api/', limiter);
```

#### Response Caching
```javascript
// Cache board list for authenticated user
const cacheMiddleware = (duration) => (req, res, next) => {
  const key = `cache:${req.user.id}:${req.originalUrl}`;
  const cached = cache.get(key);
  
  if (cached) {
    return res.json(cached);
  }
  
  res.sendResponse = res.json;
  res.json = (body) => {
    cache.set(key, body, duration);
    res.sendResponse(body);
  };
  next();
};
```

## Deployment Recommendations

### Development
- Single server setup
- Local PostgreSQL
- Hot reload enabled

### Staging
- Docker Compose setup
- Managed PostgreSQL
- Redis for caching

### Production

```yaml
# docker-compose.prod.yml
services:
  app:
    image: task-collab:latest
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    
  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data
    
  postgres:
    image: postgres:15-alpine
    volumes:
      - pg-data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
```

## Monitoring & Observability

### Metrics to Track
1. **API Response Times**: P50, P95, P99 latencies
2. **Socket Connections**: Active connections per server
3. **Database Queries**: Slow query logging
4. **Error Rates**: 4xx and 5xx responses
5. **Memory Usage**: Node.js heap size

### Recommended Tools
- **APM**: DataDog, New Relic, or Prometheus + Grafana
- **Logging**: ELK Stack or Loki
- **Error Tracking**: Sentry

### Health Checks
```javascript
// Health endpoint
app.get('/health', async (req, res) => {
  const dbHealthy = await checkDatabaseConnection();
  const redisHealthy = await checkRedisConnection();
  
  res.status(dbHealthy && redisHealthy ? 200 : 503).json({
    status: dbHealthy && redisHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'up' : 'down',
      redis: redisHealthy ? 'up' : 'down',
    },
  });
});
```

## Capacity Planning

### Benchmarks (Estimated)
| Metric | Current Capacity | With Redis | With Full Scaling |
|--------|------------------|------------|-------------------|
| Concurrent Users | ~1,000 | ~10,000 | ~100,000 |
| Boards | ~10,000 | ~100,000 | ~1,000,000 |
| Tasks | ~100,000 | ~1,000,000 | ~10,000,000 |
| Socket Events/sec | ~1,000 | ~10,000 | ~100,000 |

### Scaling Triggers
- **CPU > 70%**: Add application instances
- **DB connections > 80%**: Add connection pooling
- **Memory > 85%**: Increase instance size or add replicas
- **Response time P95 > 500ms**: Optimize queries or add caching

## Cost-Effective Scaling Path

1. **Phase 1** (MVP): Single server, managed PostgreSQL
   - Est. cost: $50-100/month

2. **Phase 2** (Growing): Load-balanced servers, Redis caching
   - Est. cost: $200-500/month

3. **Phase 3** (Scale): Multiple regions, read replicas, CDN
   - Est. cost: $1,000-5,000/month

4. **Phase 4** (Enterprise): Kubernetes, auto-scaling, dedicated DBs
   - Est. cost: $5,000+/month
