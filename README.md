# Mid or Feed

League of Legends companion platform — tier lists, counter picks, draft simulator, community guides, player stats and AI-powered composition analysis.

**Live at [midorfeed.gg](https://midorfeed.gg)**

## Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS, Recharts
- **Database**: PostgreSQL with region-based account sharding, Prisma ORM
- **Queue**: pg-boss (PostgreSQL-based background jobs)
- **AI**: Anthropic Claude (match analysis, composition reasoning)
- **Auth**: bcryptjs + JWT (HTTP-only cookies), Google OAuth
- **Validation**: Zod, react-hook-form
- **i18n**: next-intl (FR/EN)
- **Testing**: Vitest
- **Deployment**: Fly.io (Docker, standalone Next.js build)
- **Monitoring**: Custom metrics, health checks, Slack alerting, SSE admin notifications

## Getting Started

```bash
pnpm install

# Configure environment
cp .env.example .env
# Required: DATABASE_URL, RIOT_API_KEY
# Optional: GOOGLE_CLIENT_ID, ENCRYPTION_KEY, SLACK_WEBHOOK_URL, JWT_SECRET

# Database setup
pnpm run prisma:generate
pnpm run prisma:migrate

# Seed initial data
pnpm run sync:champions
pnpm run sync:items

# Start dev server
pnpm dev
```

The app runs at <http://localhost:3000>

## Features

### Champion Tier List (`/tier-list/champions`)

Rankings by win rate, pick rate, ban rate and custom score. Filter by role, tier, queue type. Updated daily via background jobs.

### Item Tier List (`/tier-list/items`)

Items ranked by win rate and pick rate per patch.

### Counter Picks (`/counter-picks`)

Champion counter suggestions based on matchup data from thousands of ranked games. SEO-optimized per-champion pages with bilingual FAQ schemas.

### Champion Pages (`/champions/[id]`)

Detailed pages per champion: stats, abilities, skill order, recommended runes, optimal builds, counter picks, leadership ranking, and community tips with voting.

### Draft Simulator (`/draft`)

Practice the ranked ban/pick phase against an AI opponent. Lane matchup analysis and team composition win probability scoring. Draft history saved for logged-in users.

### Community Guides (`/guides`)

User-created champion guides with role filtering, voting system, and nested comment threads. Full CRUD with rich editing.

### Player Profiles (`/summoners/[id]`)

Complete player lookup: overview stats, recent match history, champion pool, mastery, ranked progression, challenges and achievements.

### Player Comparison (`/compare`)

Side-by-side comparison of two players across regions.

### Leaderboard (`/leaderboard`)

Challenger, Grandmaster and Master rankings with enriched profile icons and champion splash art. Region filtering, featured Top 1 card.

### Team Compositions (`/compositions`)

Create 5v5 compositions, browse popular comps, AI-powered synergy analysis and counter matchups with Claude-generated reasoning.

### Favorites (`/favorites`)

Save and organize favorite compositions, champions, or players.

### News & Announcements

News articles managed via the admin panel, displayed in a homepage announcement banner. Supports external URLs.

### Desktop Overlay (`/download`)

Downloadable champion select overlay for Windows and macOS (Apple Silicon supported).

### AI Analysis

- Match analysis with personalized coaching feedback
- Composition suggestions with duo synergies (ADC+Sup, Mid+Jgl, Top+Jgl)
- Counter matchup recommendations
- Claude-generated reasoning and advanced metrics (damage/min, gold/min, vision/min)

## Background Jobs (pg-boss)

| Queue | Description |
|-------|-------------|
| `champion-stats` | Champion statistics calculation |
| `compositions` | AI composition suggestions |
| `synergy-analysis` | Champion synergy analysis |
| `counter-analysis` | Counter pick analysis |
| `leaderboard` | Leaderboard sync (every 4h) |
| `match-history` | Match history import |
| `player-discovery` | New player discovery |
| `account-sync` | Account data synchronization |
| `crawl-seed` | Auto-discover new players |
| `daily-reset` | Daily counter reset (00:00 UTC) |
| `data-cleanup` | Obsolete data cleanup (01:00 UTC) |
| `ddragon-sync` | Champion/item sync (every 6h) |

Admins receive real-time SSE notifications when jobs complete.

## Administration (`/admin`)

- **Discovery**: Data crawl management, account sync
- **Data Sync**: Manual champion/item synchronization
- **News**: Create and manage news articles
- **Rights**: User role management
- **Jobs**: Job queue monitoring with real-time status
- **ML**: Machine learning pipeline management

## Database

### Architecture

- **PostgreSQL** in production with LoL account sharding by region
- **Prisma ORM** for models and migrations

### Account Sharding

League accounts are partitioned by region (`league_accounts_euw1`, `league_accounts_na1`, `league_accounts_kr`, etc.) for optimal query performance.

```bash
pnpm sharding:migrate       # Migrate to sharding
pnpm sharding:verify        # Verify sharding
pnpm sharding:drop-backup   # Drop backup table
```

### Prisma

```bash
pnpm run prisma:generate    # Regenerate client
pnpm run prisma:migrate     # Create/apply migrations
pnpm run prisma:studio      # Open Prisma Studio (localhost:5555)
```

## Project Structure

```text
mid-or-feed/
├── app/
│   ├── api/                    # API Routes
│   │   ├── admin/              # Admin (stats, pipeline, jobs, news, users)
│   │   ├── auth/               # Authentication (login, signup, OAuth, password)
│   │   ├── champions/          # Champions (list, stats, runes, builds, leadership)
│   │   ├── compare/            # Player comparison
│   │   ├── compositions/       # Team compositions
│   │   ├── counter-picks/      # Counter picks
│   │   ├── crawl/              # Crawl system
│   │   ├── draft/              # Draft simulator (analyze, save, history)
│   │   ├── favorites/          # User favorites
│   │   ├── guides/             # Guides CRUD + comments + voting
│   │   ├── items/              # LoL items
│   │   ├── leaderboard/        # Leaderboard (list, enrich, update)
│   │   ├── matches/            # Match data + AI suggestions
│   │   ├── news/               # News articles
│   │   ├── riot/               # Riot Games API proxy
│   │   ├── summoners/          # Player profiles
│   │   └── ...                 # health, metrics, status, alerts, search
│   ├── champions/              # Champion detail pages
│   ├── compare/                # Player comparison page
│   ├── compositions/           # Composition pages
│   ├── counter-picks/          # Counter pick pages
│   ├── download/               # Desktop overlay downloads
│   ├── draft/                  # Draft simulator
│   ├── favorites/              # Saved items
│   ├── guides/                 # Community guides
│   ├── leaderboard/            # Leaderboard
│   ├── pricing/                # Subscription plans
│   ├── summoners/              # Player profile pages
│   ├── tier-list/              # Champion & item tier lists
│   └── ...                     # admin, login, signup, settings, profile, privacy, terms
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   ├── header/                 # Navigation header
│   └── ...                     # Feature components
├── constants/
│   ├── seo.ts                  # Centralized SEO constants
│   ├── site.ts                 # Site URL helpers (buildSiteUrl)
│   ├── ddragon.ts              # Data Dragon URL builders
│   ├── ranks.ts                # Rank system constants
│   ├── regions.ts              # Region definitions
│   ├── riot-regions.ts         # Riot API region routing
│   ├── queues.ts               # Queue configurations
│   └── matches.ts              # Match constants
├── lib/
│   ├── ai/                     # Claude AI modules
│   ├── champions/              # Champion data fetching
│   ├── draft/                  # Draft simulation (constants, machine, AI)
│   ├── hooks/                  # React hooks
│   ├── workers/                # pg-boss workers
│   ├── job-queue.ts            # Queue configuration
│   ├── prisma.ts               # Prisma client
│   ├── prisma-sharded-accounts.ts
│   ├── riot-api.ts             # Riot API client (retry, cache, rate limit)
│   ├── cache.ts                # In-memory cache with TTL
│   ├── encryption.ts           # AES-256-GCM encryption
│   ├── rate-limit.ts           # Rate limiting
│   ├── logger.ts               # Structured logging
│   ├── metrics.ts              # Performance metrics
│   ├── alerting.ts             # Alert system
│   └── ...
├── scripts/                    # CLI scripts (sync, crawl, sharding, workers)
├── messages/                   # i18n translations (fr.json, en.json)
├── prisma/                     # Schema and migrations
├── types/                      # TypeScript type definitions
└── __tests__/                  # Vitest test suites
```

## Scripts

### Development

```bash
pnpm dev                # Dev server
pnpm build              # Production build
pnpm start              # Production server
pnpm lint               # ESLint
pnpm lint:fix           # ESLint autofix
pnpm type-check         # TypeScript check
pnpm validate           # type-check + lint + test
```

### Testing

```bash
pnpm test               # Run tests (Vitest)
pnpm test:watch         # Watch mode
pnpm test:ui            # Vitest UI
pnpm test:coverage      # Coverage report
```

### Data

```bash
pnpm run sync:champions       # Sync champions from Riot API
pnpm run sync:items           # Sync items from Riot API
pnpm workers                  # Start scheduled background workers
```

### Crawl System

```bash
pnpm crawl:seed [region] [count]  # Discover new players
pnpm crawl:process                # Process pending players
pnpm crawl:status                 # View statistics
pnpm crawl:sync-accounts          # Sync accounts from matches
```

See [CRAWL_SYSTEM.md](./CRAWL_SYSTEM.md) for detailed documentation.

### Administration

```bash
pnpm make-admin [email]       # Grant admin rights
pnpm test:slack               # Test Slack integration
```

### Database / Sharding

```bash
pnpm run prisma:studio        # Prisma Studio
pnpm run prisma:generate      # Regenerate client
pnpm run prisma:migrate       # Apply migrations
pnpm sharding:migrate         # Migrate to account sharding
pnpm sharding:verify          # Verify sharding
pnpm sharding:drop-backup     # Drop backup table
```

## Security

- **Rate Limiting**: Auth 5 req/min, Public APIs 60 req/min, Admin 10 req/min
- **Password Hashing**: bcryptjs with salt rounds
- **JWT Auth**: HTTP-only cookies, secure session management
- **Data Encryption**: AES-256-GCM for sensitive data at rest
- **SQL Sanitization**: Protection against injection
- **Security Headers**: HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- **Request Timeouts**: API 10s, Database 30s
- **Request Validation**: Strict Zod schemas on all payloads

## Monitoring

- **`/api/health`** — General status (healthy/degraded/unhealthy)
- **`/api/status`** — Detailed status (admin only)
- **`/api/metrics`** — Performance metrics: P50/P95/P99 per endpoint (admin)
- **`/api/alerts`** — Recent alerts (admin)
- **Slack Alerts** — Automatic notifications for critical errors, rate limits, DB issues
- **Admin SSE** — Real-time notifications in the admin panel

## Deployment

Deployed on **Fly.io** with an optimized multi-stage Dockerfile and Next.js standalone output.

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://...
RIOT_API_KEY=your_riot_api_key

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://midorfeed.gg

# Optional
GOOGLE_CLIENT_ID=...
ENCRYPTION_KEY=...
SLACK_WEBHOOK_URL=...
JWT_SECRET=...          # Required in production
DB_TIMEOUT_MS=30000
API_TIMEOUT_MS=10000
```

## License

MIT
