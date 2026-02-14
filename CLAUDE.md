# Claude Code — Project Guidelines

## Workflow

- **Always commit and push** after completing a change — `git add`, `git commit`, `git push`
- **Never run `fly deploy` automatically** — deployments can disrupt production users, let the user decide when to deploy manually

## Commit Conventions

- Use **Conventional Commits** in English: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`, `perf:`
- Scopes are optional but encouraged: `feat(seo):`, `fix(i18n):`, `refactor(auth):`
- Keep the subject line under 72 characters, imperative mood
- Body (optional) explains **why**, not what
- Never amend or force-push unless explicitly asked

## Project Overview

- **Stack**: Next.js 16 (App Router), React 19, TypeScript, Prisma, PostgreSQL, pg-boss, Tailwind CSS, shadcn/ui
- **Language**: Default locale is French (`fr_FR`). User-facing strings go through `useI18n()` / translation files (`messages/fr.json`, `messages/en.json`). Code comments, logs, and technical strings are in English or French — match the surrounding context.
- **Package manager**: pnpm

## Architecture Patterns

### App Router Structure

- **Layouts** (`app/[route]/layout.tsx`): define static `metadata` export or `generateMetadata` for dynamic SEO. Wrap children with JSON-LD schemas when needed.
- **Pages** (`app/[route]/page.tsx`): the actual page content. Use `"use client"` only when hooks are needed.
- **API Routes** (`app/api/[feature]/route.ts`): export named HTTP method handlers (`GET`, `POST`, `PUT`, `DELETE`).
- **Metadata files** (`app/[route]/metadata.ts`): extracted when `generateMetadata` is complex (e.g. champions, counter-picks).

### Server vs Client Components

- Default to **server components** (no directive). Use direct Prisma queries for data fetching.
- Add `"use client"` only when using React hooks, event handlers, or browser APIs.
- Never import Prisma or server-only modules in client components.

### Data Fetching

- **Server components**: direct Prisma queries, use `Promise.all` for parallel fetches
- **Client components**: `useApiSWR` hook with `apiKeys.*` builders from `lib/api/keys.ts`
- **Caching**: `getOrSetCache(key, CacheTTL.*, fetchFn)` — prefer `CacheTTL.LONG` (15min) for static data

**SWR presets** (from `lib/hooks/swr.ts`):

| Preset | Dedup interval | Use case |
|--------|---------------|----------|
| `STATIC_DATA_CONFIG` | 5 min | Champions, items, versions |
| `SEMI_DYNAMIC_CONFIG` | 2 min | Stats, leaderboards |
| `REALTIME_CONFIG` | 10 sec | Notifications, live status |

```typescript
// Read data
const { data, error } = useApiSWR<MyType>(apiKeys.champions(), STATIC_DATA_CONFIG);

// Mutate data (POST/PUT/DELETE)
const { trigger } = useApiMutation<MyType>("/api/endpoint", { method: "POST" });

// Invalidate cache
invalidateSWRCache("/api/champions"); // exact key
invalidateSWRCache(/^\/api\/champions/); // regex pattern
```

## Code Conventions

### File Naming

- **Components**: PascalCase (`ChampionIcon.tsx`, `Header.tsx`)
- **Hooks**: kebab-case with `use-` prefix (`use-champions.ts`, `use-draft.ts`)
- **Utilities / libs**: kebab-case (`rate-limit.ts`, `auth-utils.ts`)
- **Types**: kebab-case (`champions.ts`, `compositions.ts`)
- **Constants**: kebab-case (`seo.ts`, `site.ts`, `ddragon.ts`)

### Imports

Order imports as follows (separated by blank lines when logical):
1. `type` imports from Next.js / React
2. Next.js / React runtime imports
3. External packages
4. Internal imports via `@/` alias (constants, lib, components, types)
5. Relative imports (`./`, `../`)
6. CSS imports last

Always use `import type { ... }` for type-only imports.

### API Routes

```typescript
// Standard structure for an API route
export async function GET(request: NextRequest) {
  // 1. Rate limiting
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) return rateLimitResponse;

  // 2. Auth (when needed)
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Authentification requise" }, { status: 401 });
  }

  // 3. Validation (for POST/PUT)
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
  }

  // 4. CSRF (for mutations)
  const csrfError = await requireCsrf(request);
  if (csrfError) return csrfError;

  try {
    // 5. Business logic
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error("Description of what failed", toError(error));
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
```

**Response format**: Always `{ success: boolean, data?: ..., error?: string }`.

**Rate limit presets**: `rateLimitPresets.api` (100/min), `.auth` (5/15min), `.admin` (50/min), `.ugc` (20/min), `.vote` (60/min).

**Validation schemas**: Centralized in `lib/api/schemas.ts` using Zod. Pattern `ValidationResult<T>`: `{ ok: true, value: T } | { ok: false, error: string }`. For POST routes, define the schema inline in the route file and use `safeParse` + `flatten()` for errors.

### Error Handling & Logging

- `toError(error)` from `lib/errors` safely converts unknown caught values to `Error`
- `createLogger("service-name")` creates a logger with context; `logger` is the global default from `lib/logger`
- Levels: `.debug()` (dev only), `.info()`, `.warn()`, `.error(message, error?, data?)`
- Production: JSON output for log aggregation. Development: human-readable with colors
- Return user-facing error messages in French for public endpoints
- Never expose stack traces or internal details in API responses

### Prisma & Database

- **Singleton** in `lib/prisma.ts` with connection pooling (5 connections, 20s pool timeout, TCP keepalives)
- Always use `select` or `include` to fetch only needed fields — never fetch entire records blindly
- Use `Promise.all` for parallel independent queries
- `withRetry(operation, maxRetries?, delayMs?)` — automatic retry with exponential backoff for connection errors
- `prismaWithTimeout` for operations that may hang
- **Sharded accounts**: `lib/prisma-sharded-accounts.ts` for region-based account queries
- **SQL sanitization**: `escapeLikePattern()`, `escapeSqlIdentifier()`, `validateTableName()`, `validateRegion()` from `lib/sql-sanitization.ts`
- **Migrations**: run `pnpm prisma migrate dev --name descriptive-name`

### SEO

Constants are centralized in `constants/seo.ts`:
- `SITE_NAME`, `TWITTER_HANDLE`, `DEFAULT_LOCALE`, `LOGO_URL_PATH`
- `baseOpenGraph` — spread into per-page OpenGraph
- `websiteJsonLd` — reuse in `isPartOf` JSON-LD blocks

URLs must use `buildSiteUrl("/path")` from `constants/site.ts` — never hardcode `https://midorfeed.gg`.

Every public page should have:
- `alternates.canonical` via `buildSiteUrl`
- `openGraph` with `...baseOpenGraph` spread
- JSON-LD schemas rendered via `<JsonLd data={...} />`

### Components & i18n

- Use shadcn/ui components from `@/components/ui/` — don't reinvent form controls, dialogs, etc.
- Use `useMemo` / `useCallback` for expensive computations and stable references in hooks

**Internationalization**:
- Hook: `const { t, locale, setLocale } = useI18n()` from `lib/i18n-context.tsx`
- Translate: `t("domain.subDomain.key")` — dot-notation keys (e.g. `"admin.tabs.discover"`)
- Always add translations in **both** `messages/fr.json` and `messages/en.json`
- Default locale is `fr`, stored in `localStorage`
- Never hardcode user-facing French strings in components — always use `t()`

### Forms

Use `react-hook-form` + `zodResolver` for client-side validation. Zod schemas are created inside components to support i18n messages.

```tsx
const schema = z.object({
  email: z.string().email(t("login.invalidEmail")),
  password: z.string().min(1, t("login.passwordRequired")),
});
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { email: "", password: "" },
});
```

- Use shadcn/ui `Form`, `FormField`, `FormControl`, `FormItem`, `FormLabel`, `FormMessage` wrappers
- Submit errors → `toast.error()`, success → `toast.success()`
- Disable submit button during loading: `disabled={isLoading}`
- Always pass `credentials: "include"` on fetch calls that need auth cookies
- For complex forms, extract logic into custom hooks (`lib/hooks/use-*.ts`)

### Toasts & Notifications

**Sonner** for toast notifications:
```tsx
import { toast } from "sonner";
toast.success(t("success.message"));
toast.error(message, { description: "details", duration: 6000 });
```

`<Toaster />` is rendered in root layout. Available methods: `toast()`, `toast.success()`, `toast.error()`, `toast.warning()`.

**NotificationProvider** for real-time notifications:
- `useNotificationChannel` hook for player notifications
- `useAdminNotificationChannel` for admin/job notifications
- Context exposes: `notifications[]`, `unreadCount`, `markAsRead()`, `clearUnread()`, `status`

### Dialogs & Modals

- **Confirmations**: use `AlertDialog` (AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction)
- **Rich content**: use `Dialog` (DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription)
- **Mobile sheets**: use `Drawer` (Vaul-based, touch-optimized)
- Always wrap triggers with `asChild={true}`

### Loading & Error States

**Loading pages** (`loading.tsx`): placed at route level, return skeleton UI for Suspense boundaries.

```tsx
export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
```

**Error pages** (`error.tsx`): receive `{ error, reset }` props. Display error card with retry button. Show error details only in development.

**Inline loading**: use `Loader2Icon` from lucide-react with `animate-spin`.

### Pagination

Server-side pagination via `lib/pagination.ts`:
- `getPaginationParams(request)` — extracts `page` and `limit` from query params
- `createPaginatedResponse(data, total, page, limit)` — wraps data with pagination metadata
- Response: `{ data: T[], pagination: { page, limit, total, totalPages, hasNext, hasPrevious } }`
- Calculation: `skip = (page - 1) * limit`

### Utilities

- `cn()` from `lib/utils` — merges `clsx` + `tailwind-merge` to avoid Tailwind class conflicts
- `toError(error)` from `lib/errors` — safely converts unknown to `Error`
- `formatRelativeDate(date, locale)` — returns relative time string ("il y a 2 heures")
- `isAdmin(role)` — checks if a user role is admin

### Types

Shared types live in `types/` and are barrel-exported from `types/index.ts`:
- `champions.ts`, `summoners.ts`, `draft.ts`, `compositions.ts`, `guides.ts`, `matches.ts`, `notifications.ts`, `counter-picks.ts`, `user.ts`, `versions.ts`, `roles.ts`, `tier-list.ts`, `api.ts`
- Always `export type { ... }` for type-only exports
- API responses follow: `{ success: boolean, data?: T, error?: string, details?: unknown }`
- Paginated responses: `{ success: true, data: T[], pagination: PaginationInfo }`

### Constants & Configuration

- **Global constants** → `constants/` (SEO, site URLs, Data Dragon, ranks, regions)
- **Feature logic** → `lib/` (cache, auth, rate-limit, workers, etc.)
- **Environment variables** → validated via Zod in `lib/env.ts`, accessed through `getEnv()`
- **Shared types** → `types/` directory, re-exported from `types/index.ts`

## Design System

### Foundation

- **Framework**: Tailwind CSS v4 with CSS custom properties (`app/globals.css`)
- **Component library**: shadcn/ui (New York style, `components.json`) — always prefer `@/components/ui/*` over custom implementations
- **Icons**: lucide-react + custom SVG role icons in `components/icons/` (`TopRoleIcon`, `JungleRoleIcon`, `MidRoleIcon`, `BottomRoleIcon`, `SupportRoleIcon`)
- **Fonts**: Geist Sans + Geist Mono via `next/font/google` (CSS vars `--font-geist-sans`, `--font-geist-mono`)
- **Color space**: OKLCh for perceptual uniformity

### Color System

**Semantic colors** (defined as CSS custom properties with light/dark variants):

| Token | Usage |
|-------|-------|
| `primary` | Violet — brand, interactive elements |
| `success` | Green — win states, positive feedback |
| `warning` | Orange — cautions |
| `danger` | Red — loss states, destructive actions |
| `info` | Blue — informational |
| `muted` | Gray — secondary text, subtle backgrounds |
| `win` / `loss` | Green / Red — game result indicators |

**Tier colors** (full LoL rank spectrum): `tier-iron`, `tier-bronze`, `tier-silver`, `tier-gold`, `tier-platinum`, `tier-emerald`, `tier-diamond`, `tier-master`, `tier-grandmaster`, `tier-challenger` — available as `text-tier-*`, `bg-tier-*`, `border-tier-*`.

**Chart/role colors**: `--chart-1` through `--chart-5` for data visualizations and role-based color coding.

**Dark mode**: Enabled by default via `dark` class. Uses deeper, more saturated colors. Background is a deep violet (`oklch(0.13 0.035 290)`). Buttons get a subtle primary gradient.

### Components Cheat Sheet

**Layout & containers**:
```tsx
// Page container
<div className="container mx-auto px-4 py-8 sm:py-12 space-y-6">

// Card (standard)
<Card><CardContent className="p-6">...</CardContent></Card>

// Empty state
<Empty><EmptyHeader><EmptyMedia variant="icon"><SearchIcon /></EmptyMedia>
<EmptyTitle>No results</EmptyTitle></EmptyHeader></Empty>

// Page hero section
<PageHero title="..." description="..." badge="..." metrics={[...]} />
```

**Badge system** — two modes:
```tsx
// Standard variants: default, secondary, destructive, outline, info, warning, success
<Badge variant="success">Active</Badge>

// Emphasis system (semantic): neutral, positive, warning, danger, info
// Each with emphasisVariant: solid, subtle, outline
<Badge emphasis="positive" emphasisVariant="subtle" rounded="full">55.2%</Badge>
```

**TierBadge** (`components/TierBadge.tsx`): tiers S+, S, A, B, C, D with shine animation on premium tiers.

**StatTile** (`components/ui/stat-tile.tsx`): metric cards with label, value, hint, icon, emphasis colors.

**Button sizes**: `xs`, `sm`, `default`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`. Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`.

**Skeleton loaders**: `Skeleton`, `SkeletonText`, `SkeletonAvatar`, `SkeletonCard`, `SkeletonButton`, `SkeletonTable`, `SkeletonList` — use `animate-pulse`.

### Images & Game Assets

All game images use builders from `constants/ddragon.ts`:

```tsx
import { getChampionImageUrl, getChampionSplashUrl, getProfileIconUrl, getTierIconUrl, getItemImageUrl } from "@/constants/ddragon";

// Champion square icon
<Image src={getChampionImageUrl("Ahri")} width={48} height={48} />

// Champion splash art (backgrounds)
<Image src={getChampionSplashUrl("Ahri")} fill className="object-cover opacity-20" />

// Profile icon
<Image src={getProfileIconUrl(4862)} width={80} height={80} className="rounded-full" />

// Tier medal (local webp)
<Image src={getTierIconUrl("CHALLENGER")} width={24} height={24} />
```

Remote image domains configured in `next.config.ts`: `ddragon.leagueoflegends.com`, `images.contentstack.io`, `cmsassets.rgpub.io`.

### Animations

Custom keyframes defined in `globals.css`:
- `animate-shimmer` — loading skeleton shimmer
- `animate-shine` — premium tier badge shine overlay (2s loop)
- `animate-border-glow` — pulsing border glow (3s)
- `animate-fade-up` — entrance animation (0.4s), with `-delay-1/2/3` variants for staggering

Glass effect: `.glass` class (backdrop-blur 12px + saturate 1.5).

Buttons use `active:scale-[0.98]` for press feedback. Respect `prefers-reduced-motion`.

### Responsive Patterns

Standard breakpoints (Tailwind defaults): `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px.

Common patterns:
```tsx
// Responsive padding
className="px-4 sm:px-6 lg:px-8"

// Responsive grid
className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"

// Stack → row
className="flex flex-col lg:flex-row gap-4"

// Visibility toggle
className="hidden md:table-cell"
```

### Border Radius Scale

`--radius: 0.5rem` (base), then `sm` (0.25rem), `md` (0.375rem), `lg` (0.5rem), `xl` (0.75rem), `2xl` (1rem). Cards use `rounded-xl`, buttons `rounded-md`, avatars `rounded-full`.

### Shadows

Light mode: subtle (`rgba(0,0,0,0.06–0.14)`). Dark mode: deeper opacity.
Special: `shadow-glow` — violet glow for interactive card hover states.

## Client-Side Auth

**AuthProvider + useAuth()** (`lib/auth-context.tsx`):
- User data stored via HTTP-only cookie (JWT token), user object cached client-side
- Methods: `login(user)`, `logout()`, `isLoading`
- Cross-tab sync via `storage` event listener
- User object: `{ id, email, name, role, subscriptionTier, riotGameName, leagueAccount }`
- Google OAuth supported via `GoogleOAuthProvider` + `GoogleLogin`

**Protected routes**: check `useAuth()` in component, redirect if not authenticated. Role-based: `isAdmin(user?.role)`.

**authenticatedFetch()**: wrapper around `fetch` that automatically includes CSRF token in `X-CSRF-Token` header for mutations.

## Navigation & Route Structure

**Main routes**:
- `/` — home
- `/champions`, `/champions/[championId]` — champion database + detail pages
- `/counter-picks`, `/counter-picks/[championId]` — counter-pick analysis
- `/leaderboard` — ranked leaderboards
- `/summoners` — summoner search + profiles
- `/draft` — draft simulator
- `/tier-list` — champion tier list
- `/guides`, `/guides/[id]` — community champion guides
- `/login`, `/signup` — auth pages (header hidden via `ConditionalHeader`)
- `/admin` — admin panel (protected, role-based)
- `/settings` — user settings

**Admin panel** (`/admin`): lazy-loaded tabs via `dynamic()` with `ssr: false`:
- **Discover** — data crawling, pipeline management, account sync
- **Jobs** — pg-boss job queue visualization (active jobs, history, schedules)
- **Rights** — user role management
- **API Test** — Riot API testing (server status, live games, mastery)
- **News** — news article management

Tab state synced to URL query param `?tab=discover|jobs|rights|api|news` via `router.replace()`.

## Riot API Integration

`lib/riot-api.ts` — centralized Riot API client:

```typescript
const { data, cached, attempt } = await riotApiRequest<T>(url, {
  region?,       // platform region
  useCache?,     // default true
  cacheTTL?,     // default CacheTTL.MEDIUM (5min)
  maxRetries?,   // default from config
  headers?,      // extra headers
});
```

- Built-in exponential backoff with max delay
- Rate limiter state per routing cluster (europe/americas/asia)
- Respects `Retry-After` header from Riot API
- Cache prefix: `riot:{url}`
- Alerts on max retries exhausted (`alerting.high()`)
- Uses `fetchWithTimeout()` for HTTP timeout handling

**Region routing** (`constants/regions.ts`):
- `REGION_TO_ROUTING` — maps platform ID → routing cluster (`euw1` → `"europe"`)
- `REGION_TO_BASE_URL` — maps platform ID → base API URL
- Account v1 endpoints use routing cluster: `https://{routing}.api.riotgames.com/riot/account/v1/...`
- Summoner/League endpoints use platform: `https://{region}.api.riotgames.com/lol/...`

## Alerting

`lib/alerting.ts` — severity-based alerting with optional Slack integration:

```typescript
import { sendAlert, AlertSeverity } from "@/lib/alerting";
sendAlert(AlertSeverity.HIGH, "Title", "Message", "service-name", { metadata });
```

- Severities: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- Slack webhook: sends color-coded messages if `SLACK_WEBHOOK_URL` is set (green/orange/red/dark red)
- Always logs to console/JSON regardless of Slack config

## Charts

**Recharts** for data visualizations:

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
    <XAxis dataKey="key" />
    <YAxis domain={[0, 100]} />
    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" />
  </LineChart>
</ResponsiveContainer>
```

Use CSS custom properties `--chart-1` through `--chart-5` for consistent chart colors.

## Performance

- **Lazy loading**: `dynamic(() => import(...), { loading, ssr: false })` for heavy components (admin tabs, charts)
- **SWR deduplication**: prevents duplicate requests within configurable windows (5min/2min/10sec)
- **`keepPreviousData: true`**: shows stale data while revalidating, avoids layout shift
- **`revalidateOnFocus: false`**: SWR default overridden to avoid unnecessary refetches
- **`prefetchSWR(key)`**: preload data on hover/anticipation
- **Image optimization**: Next.js `<Image>` with remote patterns, disabled in dev
- **Standalone output**: `next.config.ts` uses `output: "standalone"` for minimal Docker images

## Security

### Middleware

`middleware.ts` applies to all non-static routes and handles:
- **Security headers** via `lib/security-headers.ts`: X-Frame-Options (DENY), X-Content-Type-Options (nosniff), X-XSS-Protection, Referrer-Policy (strict-origin-when-cross-origin), Permissions-Policy, COOP, CSP
- **HSTS** in production only: `max-age=31536000; includeSubDomains; preload`
- **Cache-Control** `no-store` for `/api/auth` and `/api/admin` routes
- **CSRF token** generation if not present in cookies

### Authentication

- `getAuthenticatedUser(request)` from `lib/auth-utils.ts` — reads JWT from HTTP-only cookie (`AUTH_COOKIE_NAME`), falls back to `Authorization` header
- `requireAuth(request)` — returns 401 response if not authenticated, `null` if OK
- `requireAdmin(request)` — checks auth + `role === "admin"` + CSRF for mutations; returns 401/403 or `null`

### CSRF Protection

- **Double Submit Cookie** pattern in `lib/csrf.ts`
- Middleware generates token → stored in `csrf-token` cookie (readable by JS)
- Client sends same token in `X-CSRF-Token` header on mutations
- `requireCsrf(request)` validates both match and token isn't expired (24h TTL)
- Safe methods (GET, HEAD, OPTIONS) skip CSRF validation

### Encryption

`lib/encryption.ts` — AES-256-GCM for data at rest:
- `encrypt(text)` → `{IV_hex}:{AUTH_TAG_hex}:{ENCRYPTED_hex}`
- `decrypt(encryptedData)` → original text
- `hashSensitive(value)` / `verifyHash(value, hash)` — SHA-256 irreversible hashes
- Requires `ENCRYPTION_KEY` env var (32 bytes hex or derived via PBKDF2)

## Background Jobs (pg-boss)

Queue names are defined in `QUEUE_NAMES` from `lib/job-queue.ts`. Workers live in `lib/workers/*.worker.ts`.

### Key APIs

```typescript
import { sendJob, scheduleJob, registerWorker, QUEUE_NAMES } from "@/lib/job-queue";

// Send a one-off job (retries 3x with exponential backoff, expires in 30min)
await sendJob(QUEUE_NAMES.DATA_CRAWL, { region: "euw1" });

// Register a worker to process jobs
await registerWorker(QUEUE_NAMES.DATA_CRAWL, async (job) => {
  // job.data contains the payload
});

// Schedule a recurring cron job
await scheduleJob(QUEUE_NAMES.DAILY_RESET, "0 0 * * *", {});
```

### Worker Structure

Each worker file exports a `create*Worker()` function that calls `registerWorker()`. All workers are started via `startAllWorkers()` in `lib/workers/index.ts`. Cron schedules are centralized in `scheduleAllJobs()`.

### Processes

- **app process**: Next.js server (`/app/start.sh`)
- **worker process**: `npx tsx scripts/start-workers.ts` — runs `startAllWorkers()` + `scheduleAllJobs()`
- Both processes are defined in `fly.toml` under `[processes]`

## Environment Variables

Validated via Zod in `lib/env.ts`, accessed through `getEnv()`:

- **Build-time**: when `NEXT_PHASE === "phase-production-build"`, safe defaults are used for missing variables
- **Runtime**: strict validation — crashes if critical variables are invalid
- Helpers: `isProduction()`, `isDevelopment()` from `lib/env.ts`

Key variables:
| Variable | Purpose | Default |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection | required at runtime |
| `RIOT_API_KEY` | Riot Games API | required at runtime |
| `JWT_SECRET` | JWT signing key | auto-generated in dev |
| `ENCRYPTION_KEY` | AES-256 key (hex) | required for encryption |
| `NODE_ENV` | Environment | `development` |
| `NEXT_PUBLIC_APP_URL` | Public app URL | — |
| `DB_TIMEOUT_MS` | DB query timeout | `30000` |
| `API_TIMEOUT_MS` | API call timeout | `10000` |
| `SLACK_WEBHOOK_URL` | Alert notifications | optional |

## Testing

- **Framework**: Vitest
- **When to write tests**: for utility functions (`lib/`), Zod schemas, data transformation logic, and non-trivial helpers. Not required for UI components or API routes unless they contain complex logic.
- **Test location**: colocate test files next to source (`lib/pagination.test.ts` next to `lib/pagination.ts`) or in `__tests__/` for integration tests
- **Run**: `pnpm test` (single run), `pnpm test:watch` (watch mode), `pnpm test:coverage` (coverage)
- Before pushing significant lib/ changes, run `pnpm test` to check for regressions.

**Patterns**:
- Mock dependencies: `vi.mock("@/lib/module")` before imports
- Always mock `logger`, `prisma`, and `alerting` in tests that touch API routes
- Structure: `describe()` → `it()` → `expect()` assertions
- Existing suites cover: pagination, jwt, csrf, rate-limit, cache, sql-sanitization, env, encryption, etc.

## Deployment Infrastructure

- **Docker**: multi-stage build (`deps` → `builder` → `runner`) on `node:20-alpine`
- **Next.js**: `output: "standalone"` in `next.config.ts` for minimal production image
- **Fly.io**: region `cdg` (Paris), 512MB RAM, shared CPU
- **Release command**: `prisma migrate deploy` runs before each deployment
- **Processes**: `app` (Next.js on port 8080) and `worker` (pg-boss workers via tsx)
- **Health check**: `GET /api/health` every 15s, 60s grace period
- **Auto-scaling**: min 1 machine, auto-stop on idle, auto-start on traffic

### Next.js Config

- `reactStrictMode: true`, `output: "standalone"`
- Remote image patterns: `ddragon.leagueoflegends.com`, `images.contentstack.io`, `cmsassets.rgpub.io`
- SVG allowed with CSP sandbox (`dangerouslyAllowSVG: true`)
- Image optimization disabled in development

## Key Files Reference

| File | Purpose |
|------|---------|
| **Constants** | |
| `constants/seo.ts` | `SITE_NAME`, `baseOpenGraph`, `websiteJsonLd` |
| `constants/site.ts` | `buildSiteUrl()`, `getSiteUrl()` |
| `constants/ddragon.ts` | `DDRAGON_VERSION`, image URL builders |
| `constants/regions.ts` | `REGION_TO_ROUTING`, `REGION_TO_BASE_URL` |
| `constants/riot-regions.ts` | `RIOT_REGIONS`, `MAIN_REGIONS`, `isValidRegion()` |
| **Lib — Core** | |
| `lib/prisma.ts` | Prisma singleton with retry/pooling |
| `lib/prisma-sharded-accounts.ts` | Region-sharded account queries (`ShardedLeagueAccounts`) |
| `lib/env.ts` | Zod-validated env variables, `getEnv()`, `isProduction()` |
| `lib/cache.ts` | In-memory cache with TTL + prefix invalidation |
| `lib/rate-limit.ts` | Rate limiting with presets |
| `lib/logger.ts` | Structured logger (`createLogger("service")`) |
| `lib/errors.ts` | `toError()` safe error conversion |
| `lib/utils.ts` | `cn()` class merge, misc utilities |
| `lib/pagination.ts` | `getPaginationParams()`, `createPaginatedResponse()` |
| **Lib — Auth & Security** | |
| `lib/auth-utils.ts` | `getAuthenticatedUser`, `requireAdmin`, `requireAuth` |
| `lib/auth-context.tsx` | `AuthProvider`, `useAuth()` hook |
| `lib/csrf.ts` | CSRF double-submit cookie + `requireCsrf` |
| `lib/security-headers.ts` | Security headers + CSP |
| `lib/encryption.ts` | AES-256-GCM encrypt/decrypt + hashing |
| `lib/sql-sanitization.ts` | `escapeLikePattern`, `validateTableName`, `validateRegion` |
| **Lib — API & Data** | |
| `lib/riot-api.ts` | Riot API client with retry, rate limiting, cache |
| `lib/alerting.ts` | Severity-based alerting + Slack webhook |
| `lib/api/keys.ts` | `apiKeys.*` URL builders for SWR |
| `lib/api/schemas.ts` | Zod validation schemas + `ValidationResult<T>` |
| `lib/hooks/swr.ts` | `useApiSWR`, `useApiMutation`, SWR presets |
| **Lib — Workers** | |
| `lib/job-queue.ts` | pg-boss queue config + `QUEUE_NAMES` |
| `lib/queues/types.ts` | Job data/result TypeScript interfaces |
| `lib/workers/index.ts` | `startAllWorkers()`, `scheduleAllJobs()` |
| `lib/workers/descriptions.ts` | Admin panel worker descriptions |
| **Lib — i18n** | |
| `lib/i18n-context.tsx` | `I18nProvider`, `useI18n()` hook |
| `messages/fr.json` | French translations |
| `messages/en.json` | English translations |
| **Components** | |
| `components/ui/` | shadcn/ui component library |
| `components/icons/` | Custom SVG role icons (Top, Jungle, Mid, Bot, Support) |
| `components/JsonLd.tsx` | JSON-LD structured data renderer |
| `components/TierBadge.tsx` | Tier badge with shine animation (S+/S/A/B/C/D) |
| **Config** | |
| `types/index.ts` | Barrel export for all shared types |
| `middleware.ts` | Security headers, CSRF, cache control |
| `next.config.ts` | Next.js configuration |
| `components.json` | shadcn/ui config (New York style, lucide icons) |
| `app/globals.css` | CSS custom properties, theme, animations |
| `fly.toml` | Fly.io deployment config |
| `Dockerfile` | Multi-stage Docker build |
| `scripts/start-workers.ts` | Worker process entry point |
