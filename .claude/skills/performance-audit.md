# Performance Audit Checklist

Use this skill when optimizing pages, reviewing performance, or diagnosing slow load times.

## Core Web Vitals Targets

| Metric | Good | Needs Work | Poor |
|--------|------|------------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | 2.5–4s | > 4s |
| **FID** (First Input Delay) | < 100ms | 100–300ms | > 300ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 0.1–0.25 | > 0.25 |
| **TTFB** (Time to First Byte) | < 600ms | 600ms–1.5s | > 1.5s |
| **TTI** (Time to Interactive) | < 3.8s | 3.8–7.3s | > 7.3s |

## Image Optimization

- Always use Next.js `<Image>` component with explicit `width` and `height` (prevents CLS)
- Use `priority` prop on hero/above-the-fold images (LCP improvement)
- Use `loading="lazy"` (default) for below-the-fold images
- Remote images served via Next.js image optimizer (WebP/AVIF auto-conversion)
- Target < 200KB per image after optimization
- For background splash images: use `fill` + `object-cover` with `priority`

```tsx
// Hero image (above fold) — eager loaded
<Image src={url} alt="..." width={1200} height={600} priority />

// Below-fold image — lazy loaded (default)
<Image src={url} alt="..." width={400} height={300} />

// Background splash
<Image src={url} alt="..." fill className="object-cover" priority />
```

## JavaScript Bundle

- **Code splitting**: `dynamic(() => import(...), { ssr: false })` for heavy components
- **Tree shaking**: import specific exports, not entire modules
  - `import { format } from "date-fns"` not `import * as dateFns`
  - `import { debounce } from "lodash/debounce"` not `import _ from "lodash"`
- **Analyze**: `npx @next/bundle-analyzer` to visualize bundle composition
- **Third-party scripts**: defer non-critical scripts, load analytics after page interactive
- Prefer native JS methods over utility libraries (e.g. `Set` over lodash `uniq`, `structuredClone` over lodash `cloneDeep`)

## CLS Prevention

- Always set `width`/`height` or `aspect-ratio` on images
- Use skeleton loaders (`Skeleton` components) that match final content size
- Reserve space for dynamic content (ads, embeds, lazy-loaded sections)
- Avoid injecting content above existing content after page load
- Use `keepPreviousData: true` in SWR to avoid layout flash on revalidation
- Font loading: Geist fonts loaded via `next/font` with `display: swap`

## Caching Strategy

| Data type | SWR preset | Cache TTL |
|-----------|-----------|-----------|
| Champions, items, versions | `STATIC_DATA_CONFIG` (5min dedup) | `CacheTTL.LONG` (15min) |
| Stats, leaderboards | `SEMI_DYNAMIC_CONFIG` (2min dedup) | `CacheTTL.MEDIUM` (5min) |
| Notifications, live status | `REALTIME_CONFIG` (10sec dedup) | `CacheTTL.SHORT` (1min) |

- Server-side: `getOrSetCache(key, CacheTTL.*, fetchFn)` in-memory cache
- Client-side: SWR with `revalidateOnFocus: false` to avoid unnecessary refetches
- Prefetch on hover: `prefetchSWR(key)` for anticipated navigations

## React Performance

- `useMemo` for expensive derivations (filtering/sorting large arrays)
- `useCallback` for handlers passed as props to child components
- `dynamic()` with `ssr: false` for client-only heavy components (charts, admin panels)
- Debounce search inputs at 300–500ms
- Avoid creating new objects/arrays in render that cause unnecessary re-renders

## Quick Audit Steps

1. Run Lighthouse in Chrome DevTools (Mobile profile)
2. Check LCP element — is it lazy when it should be eager?
3. Check CLS — any images without dimensions? Content shifting on load?
4. Check bundle size — any oversized dependencies?
5. Check network waterfall — any blocking requests? Missing parallelization?
6. Check server components — any `"use client"` that could be server?
