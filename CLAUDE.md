# Claude Code — Project Guidelines

## Deployment

- **Never run `fly deploy` automatically** — deployments can disrupt production users
- Only commit and push (`git add`, `git commit`, `git push`)
- Let the user decide when to deploy manually

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

### Error Handling

- Use `toError(error)` from `lib/logger` to safely convert unknown errors
- Log with the structured logger: `logger.error("message", toError(error))`
- Return user-facing error messages in French for public endpoints
- Never expose stack traces or internal details in API responses

### Prisma Queries

- Always use `select` or `include` to fetch only needed fields — never fetch entire records blindly
- Use `Promise.all` for parallel independent queries
- Wrap critical queries with `withRetry` for connection resilience
- Use `prismaWithTimeout` for operations that may hang

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

### Components

- Use shadcn/ui components from `@/components/ui/` — don't reinvent form controls, dialogs, etc.
- Translations via `const { t } = useI18n()` — never hardcode user-facing French strings in components
- Use `useMemo` / `useCallback` for expensive computations and stable references in hooks

### Constants & Configuration

- **Global constants** → `constants/` (SEO, site URLs, Data Dragon, ranks, regions)
- **Feature logic** → `lib/` (cache, auth, rate-limit, workers, etc.)
- **Environment variables** → validated via Zod in `lib/env.ts`, accessed through `getEnv()`
- **Shared types** → `types/` directory, re-exported from `types/index.ts`

## Testing

- **Framework**: Vitest
- **When to write tests**: for utility functions (`lib/`), Zod schemas, data transformation logic, and non-trivial helpers. Not required for UI components or API routes unless they contain complex logic.
- **Test location**: colocate test files next to source (`lib/pagination.test.ts` next to `lib/pagination.ts`) or in `__tests__/` for integration tests
- **Run**: `pnpm test` (single run), `pnpm test:watch` (watch mode), `pnpm test:coverage` (coverage)
- Before pushing significant lib/ changes, run `pnpm test` to check for regressions.

## Key Files Reference

| File | Purpose |
|------|---------|
| `constants/seo.ts` | Centralized SEO constants |
| `constants/site.ts` | `buildSiteUrl()`, `getSiteUrl()` |
| `constants/ddragon.ts` | Data Dragon CDN URL builders |
| `lib/prisma.ts` | Prisma singleton with retry/pooling |
| `lib/prisma-sharded-accounts.ts` | Region-sharded account queries |
| `lib/env.ts` | Zod-validated environment variables |
| `lib/cache.ts` | In-memory cache with TTL + prefix invalidation |
| `lib/rate-limit.ts` | Rate limiting with presets |
| `lib/logger.ts` | Structured logger (`createLogger("service")`) |
| `lib/job-queue.ts` | pg-boss queue configuration |
| `lib/api/keys.ts` | `apiKeys.*` URL builders for SWR |
| `lib/riot-api.ts` | Riot API client with retry and cache |
| `types/index.ts` | Barrel export for all shared types |
| `messages/fr.json` | French translations |
| `messages/en.json` | English translations |
