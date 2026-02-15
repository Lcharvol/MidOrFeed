# Systematic Debugging

Use when encountering any bug, test failure, or unexpected behavior — before proposing fixes.

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes. "Quick fix" = failure.

## Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read error messages completely** — stack traces, line numbers, error codes. They often contain the answer.
2. **Reproduce consistently** — exact steps, every time. Not reproducible → gather more data, don't guess.
3. **Check recent changes** — `git diff`, recent commits, new dependencies, config changes.
4. **Trace data flow** — where does the bad value originate? Trace backward through the call stack.

**For multi-layer systems** (API → Prisma → Database, or Client → API → Worker):
```
For EACH component boundary:
  - Log what data enters the component
  - Log what data exits the component
  - Verify environment/config propagation
Run once → analyze evidence → identify failing layer → investigate THAT layer
```

## Phase 2: Pattern Analysis

1. Find **working examples** — similar working code in the same codebase
2. Compare against **references** — read reference implementations COMPLETELY, don't skim
3. Identify **differences** — list every difference, however small

## Phase 3: Hypothesis & Testing

1. **Form ONE hypothesis** — "I think X is the root cause because Y"
2. **Test minimally** — smallest possible change, one variable at a time
3. **Verify** — worked → Phase 4. Didn't work → new hypothesis. Don't stack fixes.

## Phase 4: Implementation

1. **Write failing test** reproducing the bug (use TDD skill)
2. **Implement single fix** — address root cause, ONE change at a time
3. **Verify fix** — test passes, no other tests broken
4. **If 3+ fixes failed → STOP** — question the architecture, don't attempt fix #4

## Red Flags — STOP and Return to Phase 1

- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- Proposing solutions before tracing data flow
- Each fix reveals a new problem in a different place

## Project-Specific Debugging

| Layer | Common Issues | Investigation |
|-------|--------------|---------------|
| **API Routes** | Missing auth/CSRF/rate-limit, wrong status codes | Check middleware chain order |
| **Prisma** | N+1 queries, missing `select`, connection pool exhaustion | Enable query logging, check `withRetry` |
| **React Hooks** | Stale closures, missing deps, infinite re-renders | Check dependency arrays, `useCallback` refs |
| **SWR** | Stale data, cache key mismatch, dedup issues | Verify `apiKeys.*` builder, check SWR config preset |
| **Workers** | Job timeout, batch size, Prisma transaction failures | Check pg-boss logs, verify `$transaction` size |
| **i18n** | Missing translation key, wrong locale | Check both `fr.json` and `en.json`, verify `t()` key path |

## Systematic > Random

- Systematic approach: 15-30 minutes to fix
- Random fixes: 2-3 hours of thrashing
- First-time fix rate: 95% vs 40%
