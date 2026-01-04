# MidOrFeed

League of Legends performance analysis platform with AI-powered composition suggestions, advanced statistics, and personalized coaching.

## Technologies

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS, Recharts
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL with region-based sharding
- **Queue**: pg-boss (PostgreSQL-based jobs)
- **AI**: Anthropic Claude (analysis, reasoning)
- **Authentication**: bcryptjs, JWT (HTTP-only cookies)
- **Validation**: Zod, react-hook-form
- **Internationalization**: next-intl (FR/EN)
- **Monitoring**: Custom metrics, health checks, alerting, real-time notifications
- **Cache**: In-memory cache with TTL
- **Security**: Rate limiting, timeouts, security headers, encryption

## Installation

```bash
# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env
# Edit .env and configure:
# - DATABASE_URL (PostgreSQL or SQLite)
# - RIOT_API_KEY (Riot Games API key)
# - GOOGLE_CLIENT_ID (for Google auth, optional)
# - ENCRYPTION_KEY (for sensitive data encryption, optional)
# - SLACK_WEBHOOK_URL (for Slack alerts, optional - see docs/SLACK_SETUP.md)
# - JWT_SECRET (for JWT auth, optional in dev, required in prod)

# Generate Prisma client
pnpm run prisma:generate

# Create database and apply migrations
pnpm run prisma:migrate

# Sync initial data
pnpm run sync:champions
pnpm run sync:items

# Start development server
pnpm dev
```

The application will be available at <http://localhost:3000>

## Database

### Architecture

- **PostgreSQL** in production with LoL account sharding by region
- **SQLite** in development
- **Prisma ORM** for model and migration management

### League of Legends Account Sharding

League of Legends accounts are sharded by region into separate tables for optimal performance:

- `league_accounts_euw1` (Europe West)
- `league_accounts_na1` (North America)
- `league_accounts_kr` (Korea)
- ... and other regions

**Migration**:

```bash
# Migrate to sharding (production)
pnpm sharding:migrate

# Verify sharding
pnpm sharding:verify

# Drop backup table (after verification)
pnpm sharding:drop-backup
```

### View the Database

```bash
pnpm run prisma:studio
```

Opens Prisma Studio at <http://localhost:5555>

### Useful Prisma Commands

```bash
# Generate Prisma client
pnpm run prisma:generate

# Create a new migration
pnpm run prisma:migrate

# Open Prisma Studio
pnpm run prisma:studio
```

## Authentication

The application features a complete authentication system with enhanced security:

### Features

- **Sign up** (`/signup`): Account creation with strict validation
- **Login** (`/login`): Secure authentication with rate limiting
- **JWT**: Token-based authentication (replaces `x-user-id` headers)
- **Validation**: Zod for form validation with translated messages
- **Security**: Passwords hashed with bcryptjs
- **Interface**: Forms with react-hook-form and shadcn/ui
- **Session**: Session management with React context and localStorage
- **Profile**: User profile management and Riot account linking
- **Google OAuth**: Optional Google authentication (if configured)

### Security

- **Rate Limiting**: Protection against brute force attacks
- **Request Timeouts**: Protection against long-running requests
- **Security Headers**: HTTP security headers (HSTS, CSP, X-Frame-Options, etc.)
- **SQL Sanitization**: Protection against SQL injection
- **Data Encryption**: Encryption of sensitive data at rest

## Alerting and Monitoring

### Slack Integration

The application can send automatic alerts to Slack:

1. **Create a Slack webhook** (see `docs/SLACK_SETUP.md` for the complete guide)
2. **Configure the environment variable**:
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXXXX/YYYYY/ZZZZZ
   ```
3. **Test the integration**:
   ```bash
   pnpm test:slack
   ```

Alerts are automatically sent for critical errors, sync issues, or monitoring alerts.

### Monitoring

- **Health Checks**: `/api/health` to check application status
- **Metrics**: `/api/metrics` (admin) for performance metrics
- **Status**: `/api/status` (admin) for detailed application status
- **Alerts**: `/api/alerts` (admin) to view recent alerts

## League of Legends Champions

The database contains all League of Legends champions synced from Riot Games' Data Dragon API.

### Features

- **Automatic sync**: Script to fetch the latest champions
- **171+ champions**: All data is up to date
- **Complete statistics**: HP, mana, attack, defense, magic, difficulty, etc.
- **REST API**: Paginated endpoints to query and sync champions
- **Dedicated pages**: Detailed page for each champion with:
  - Complete statistics
  - Abilities and skill order
  - Recommended runes
  - Optimal builds
  - Counter picks
  - **Leadership**: Ranking of top players per champion
  - Community tips with voting system

### Synchronization

```bash
# Sync champions from Riot API
pnpm run sync:champions

# Sync items from Riot API
pnpm run sync:items
```

## Main Features

### 1. Champion Tier List

- Champion rankings by win rate, KDA, custom score
- Filters by role, tier, queue type
- Dynamic sorting by column
- Reliability statistics (minimum match count)

### 2. Player Profiles

- Complete statistics overview
- Recent match history
- Performance by champion
- Performance by role with radar charts
- Rankings and progression
- Challenges and achievements

### 3. Team Compositions

- Create 5-champion compositions
- Statistics-based suggestions
- Synergy analysis
- Popular compositions

### 4. Counter Picks

- Champion suggestions to counter an enemy
- Matchup analysis based on real data
- Win rate statistics per matchup
- **SEO optimized**: indexed pages for "lol counter [champion]"
- Bilingual content FR/EN with FAQ schema

### 5. AI Composition Suggestions

- Automatic generation of recommended picks per role
- **Duo synergies**: ADC+Support, Mid+Jungle, Top+Jungle
- **Counter matchups**: champions effective against enemies
- **AI reasoning**: explanations generated by Claude
- **Advanced metrics**: damage/min, gold/min, vision/min

### 6. Champion Leadership

- Ranking of top players per champion
- Statistics: win rate, KDA, games played
- Custom score based on performance and volume

### 7. User Profile

- **Modern design** with gradient header and badges
- **Rank display**: Solo/Duo and Flex with tier emblems
- **Subscription**: Free/Premium badge, daily usage with progress bar
- **Settings**: theme, language, password change
- **Tabs**: Account, Statistics, Settings

### 8. Administration

- **Admin panel** (`/admin`) with multiple tabs:
  - **Discovery**: Data crawl management, account sync
  - **Data Sync**: Manual data synchronization
  - **Rights**: User rights management
  - **Jobs**: Async job monitoring with real-time notifications
  - **ML**: Machine learning pipeline management
- Real-time statistics
- Monitoring and alerts
- **Admin notifications**: SSE alerts when jobs complete

### 9. Async Jobs (pg-boss)

The application uses pg-boss (PostgreSQL-based job queue) for background tasks:

| Queue | Description |
|-------|-------------|
| `champion-stats` | Champion statistics calculation |
| `compositions` | AI composition suggestions generation |
| `synergy-analysis` | Champion synergy analysis |
| `counter-analysis` | Counter pick analysis |
| `leaderboard` | Leaderboard update |
| `match-history` | Match history import |
| `player-discovery` | New player discovery |
| `daily-reset` | Daily counter reset |
| `data-cleanup` | Obsolete data cleanup |

Admins receive real-time notifications (SSE) when each job completes.

## Project Structure

```text
mid-or-feed/
├── app/
│   ├── api/                  # API Routes
│   │   ├── admin/           # Admin endpoints (stats, pipeline, etc.)
│   │   ├── alerts/          # Alert management
│   │   ├── auth/            # Authentication
│   │   ├── champions/       # Champions API (list, stats, runes, builds, leadership)
│   │   ├── challenges/      # Challenges and achievements
│   │   ├── compositions/    # Team compositions
│   │   ├── counter-picks/   # Counter picks
│   │   ├── crawl/           # Crawl system
│   │   ├── health/          # Health checks
│   │   ├── items/           # LoL items
│   │   ├── matches/         # Matches
│   │   ├── metrics/         # Performance metrics
│   │   ├── riot/            # Riot Games API
│   │   ├── search/          # Search
│   │   ├── status/          # Detailed app status
│   │   ├── summoners/       # Player profiles
│   │   └── user/            # User management
│   ├── admin/               # Admin interface
│   ├── ai-analysis/         # AI analysis
│   ├── champions/           # Champion pages
│   ├── compositions/        # Composition pages
│   ├── counter-picks/       # Counter pick pages
│   ├── profile/             # User profile
│   ├── summoners/           # Player pages
│   ├── tier-list/           # Tier list
│   └── ...
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── ChampionIcon.tsx
│   ├── Header.tsx
│   ├── RiotAccountSection.tsx
│   └── ...
├── lib/
│   ├── hooks/               # Custom React hooks
│   ├── api/                 # API keys and validation schemas
│   ├── ai/                  # AI modules (Claude)
│   │   ├── match-analysis.ts       # Match analysis
│   │   └── composition-analysis.ts # Composition reasoning
│   ├── workers/             # pg-boss workers
│   │   ├── champion-stats.worker.ts
│   │   ├── composition.worker.ts
│   │   ├── synergy-analysis.worker.ts
│   │   └── ...
│   ├── job-queue.ts         # pg-boss queue configuration
│   ├── alerting.ts          # Alert system
│   ├── api-monitoring.ts    # Automatic API monitoring
│   ├── cache.ts             # In-memory cache with TTL
│   ├── encryption.ts        # Data encryption
│   ├── env.ts               # Environment variable validation
│   ├── logger.ts            # Structured logging
│   ├── metrics.ts           # Performance metrics
│   ├── notification-hub.ts  # SSE notification hub
│   ├── pagination.ts        # Pagination utilities
│   ├── prisma.ts            # Configured Prisma client
│   ├── prisma-sharded-accounts.ts  # Sharding management
│   ├── rate-limit.ts        # Rate limiting
│   ├── riot-api.ts          # Riot API client with retry and cache
│   ├── security-headers.ts  # Security headers
│   ├── sharding-config.ts   # Sharding configuration
│   ├── sql-sanitization.ts  # SQL injection protection
│   └── timeout.ts           # Request timeouts
├── constants/
│   ├── riot-regions.ts      # Centralized Riot regions
│   └── ...
├── scripts/
│   ├── migrate-to-sharded-accounts.ts  # Sharding migration
│   ├── verify-sharding.ts   # Sharding verification
│   ├── sync-champions.ts    # Champion sync
│   ├── sync-items.ts        # Item sync
│   ├── crawl-seed.ts        # Player discovery
│   └── ...
├── messages/
│   ├── fr.json              # French translations
│   └── en.json              # English translations
├── prisma/
│   ├── schema.prisma        # Prisma schema
│   └── migrations/          # Migrations
├── types/
│   ├── api.ts               # Strict API types
│   ├── champions.ts
│   ├── tier-list.ts
│   └── ...
└── __tests__/               # Unit tests
    ├── api/
    └── lib/
```

## Interface

The application uses a League of Legends-inspired theme with:

- **Dark/Light mode**: Support for both modes with theme system
- **Colors**: Purple and gold palette inspired by LoL
- **UI Components**: shadcn/ui for a modern and accessible interface
- **Internationalization**: FR/EN support with next-intl
- **Responsive**: Adaptive design for mobile/tablet/desktop

## Available Scripts

### Development

```bash
pnpm dev              # Start development server
pnpm build            # Create production build
pnpm start            # Start production server
pnpm lint             # Run ESLint
```

### Database

```bash
pnpm run prisma:studio        # Open Prisma Studio
pnpm run prisma:generate      # Regenerate Prisma client
pnpm run prisma:migrate       # Create/apply migrations
```

### Data Synchronization

```bash
pnpm run sync:champions       # Sync champions from Riot API
pnpm run sync:items           # Sync items from Riot API
```

### Sharding

```bash
pnpm sharding:migrate         # Migrate to account sharding
pnpm sharding:verify          # Verify sharding
pnpm sharding:test            # Test sharded endpoints
pnpm sharding:drop-backup     # Drop backup table
```

### Crawl System

```bash
pnpm crawl:seed [region] [count]  # Discover new players
pnpm crawl:process                # Process pending players
pnpm crawl:status                 # View statistics
pnpm crawl:sync-accounts          # Sync accounts from matches
```

### Administration

```bash
pnpm make-admin [email]  # Grant admin rights to a user
```

### Machine Learning

```bash
pnpm ml:export                   # Export matches for training
pnpm ml:train                    # Train prediction model
pnpm ml:predict                  # Use model for predictions
pnpm ml:export:compositions      # Export compositions
pnpm ml:train:compositions       # Train composition model
```

## Security

The application integrates numerous security measures:

### Authentication & Authorization

- **Rate Limiting**: Protection against brute force attacks
  - Auth endpoints: 5 requests/minute
  - Public APIs: 60 requests/minute
  - Admin: 10 requests/minute
- **Request Validation**: Strict payload validation (size, format)
- **Password Hashing**: bcryptjs with salt rounds
- **Session Management**: Secure session handling

### Data Protection

- **SQL Sanitization**: Protection against SQL injection
- **Data Encryption**: AES-256-GCM encryption for sensitive data
- **Request Timeouts**: Protection against long-running requests
  - API: 10 seconds
  - Database: 30 seconds
- **Security Headers**: Complete HTTP security headers
  - HSTS (in production)
  - CSP (Content Security Policy)
  - X-Frame-Options, X-Content-Type-Options, etc.

### Monitoring & Alerting

- **Health Checks**: `/api/health` to check application status
- **Status Endpoint**: `/api/status` (admin only) for detailed status
- **Metrics**: `/api/metrics` (admin) for performance metrics
- **Alerts**: `/api/alerts` (admin) for recent alerts
- **Structured Logging**: JSON logs in production, readable logs in dev

## Performance

### Frontend

- **Lazy Loading**: Heavy components loaded on demand
  - Champion sections (abilities, counters, builds, etc.)
  - Admin tabs
  - Chart components (Recharts)
- **Code Splitting**: Separate chunks by feature
- **Optimized Images**: Using `next/image` everywhere
- **Client Cache**: SWR for caching and automatic revalidation

### Backend

- **Pagination**: All lists are paginated (max limit: 1000)
- **Caching**: In-memory cache with TTL for static data
- **Sharding**: LoL accounts sharded by region
- **Batch Operations**: Grouped queries to optimize DB
- **Connection Pooling**: Optimized Prisma configuration

### Riot Games API

- **Retry with Exponential Backoff**: Automatic retry on errors
- **Smart Rate Limiting**: Rate limit handling by routing
- **Response Caching**: 5-minute cache to reduce API calls
- **Configurable Timeouts**: Protection against long requests
- **Error Handling**: Complete handling of 429, 500+, etc.

## Monitoring & Observability

### Metrics

- **Response time**: P50, P95, P99 per endpoint
- **Error rate**: Error tracking per endpoint
- **DB usage**: Latency and query count
- **Riot API metrics**: External call tracking

### Health Checks

- **`/api/health`**: General status (healthy/degraded/unhealthy)
  - DB connection check
  - Response latency
- **`/api/status`**: Detailed status (admin only)
  - Uptime, metrics, recent alerts
  - Statistics per endpoint
  - Environment status

### Alerting

- **Alert levels**: LOW, MEDIUM, HIGH, CRITICAL
- **Automatic alerts**:
  - Riot API rate limit reached
  - Critical API errors
  - Database issues
- **Endpoint**: `/api/alerts` to view alerts

## Internationalization

The application supports multiple languages via `next-intl`:

- **French** (default)
- **English**

Translations are in `messages/fr.json` and `messages/en.json`.

## Data Crawl System

MidOrFeed includes an automatic crawl system to collect player and match data from the Riot Games API.

### Quick Commands

```bash
# Discover new players
pnpm crawl:seed euw1 50

# Crawl pending players
pnpm crawl:process

# View statistics
pnpm crawl:status

# Sync accounts from matches
pnpm crawl:sync-accounts
```

### Complete Documentation

See [CRAWL_SYSTEM.md](./CRAWL_SYSTEM.md) for detailed crawl system documentation.

## Tests

The application includes unit tests for critical utilities:

```bash
# Run tests (if configured)
pnpm test

# Available tests:
# - lib/pagination.test.ts
# - lib/rate-limit.test.ts
# - api/health.test.ts
```

See [**tests**/README.md](./__tests__/README.md) for more information.

## Deployment

### Production

The application is configured for deployment on Fly.io with:

- **Dockerfile**: Optimized build with multi-stage
- **fly.toml**: Fly.io configuration
- **Standalone Output**: Next.js standalone build to reduce size

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Riot Games API
RIOT_API_KEY=your_riot_api_key

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Optional
GOOGLE_CLIENT_ID=your_google_client_id
ENCRYPTION_KEY=your_encryption_key

# Timeouts (optional)
DB_TIMEOUT_MS=30000
API_TIMEOUT_MS=10000
```

## Roadmap

See [docs/TODOS.md](./docs/TODOS.md) for the complete list of planned improvements.

### Main Features

- [x] Implement authentication system
- [x] Add champions from Riot API
- [x] Integrate items from Riot API
- [x] Implement crawl system
- [x] Add LoL account sharding
- [x] Implement performance optimizations
- [x] Add security headers
- [x] Implement monitoring and alerting
- [x] Optimize Riot API with retry and cache
- [x] Add async jobs (pg-boss)
- [x] Implement real-time admin notifications
- [x] Improve SEO for "lol counter"
- [x] Add AI reasoning to compositions
- [x] Profile page redesign with ranks and settings
- [ ] Implement NextAuth.js for complete sessions
- [ ] Create composition features (saving)
- [ ] Add favorites management
- [ ] Implement advanced custom statistics
- [ ] Add push notification system

## License

MIT
