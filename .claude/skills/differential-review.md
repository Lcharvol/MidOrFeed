# Differential Security Review

Use when reviewing PRs, commits, or code diffs for security implications.

## Core Principles

1. **Risk-first** — focus on auth, crypto, data exposure, external calls
2. **Evidence-based** — every finding backed by line numbers and attack scenarios
3. **Adaptive** — scale depth to change size (not all PRs need deep audit)
4. **Honest** — state coverage limits and confidence level

## Quick Risk Classification

| Risk Level | Triggers |
|------------|----------|
| **HIGH** | Auth changes, CSRF handling, rate limiting, encryption, raw SQL, admin routes, env vars |
| **MEDIUM** | Business logic, new API endpoints, state changes, Prisma schema |
| **LOW** | Comments, tests, UI-only, logging, translations |

## Review Workflow

### 1. Triage (All PRs)
```bash
# See what changed
git diff main...HEAD --stat
git diff main...HEAD
```

Classify each changed file by risk level. Focus on HIGH first.

### 2. Git History Check (HIGH risk files)
```bash
# Why was removed code there?
git log --oneline -10 -- path/to/file
git blame path/to/file
```

**Red flags:**
- Removed code from "security", "CVE", or "fix" commits
- Validation removed without replacement
- Auth checks removed or relaxed

### 3. Security Analysis (HIGH risk changes)

For each HIGH risk change, verify:

| Check | What to Look For |
|-------|-----------------|
| **Auth** | `requireAuth()`/`requireAdmin()` present on mutations |
| **CSRF** | `requireCsrf()` on POST/PUT/DELETE endpoints |
| **Rate limit** | `rateLimit(request, rateLimitPresets.*)` on all endpoints |
| **Input validation** | Zod `safeParse` before using request body |
| **SQL safety** | Tagged template `$queryRaw` (not `$queryRawUnsafe`) |
| **Data exposure** | `select` on Prisma queries (not returning full records) |
| **Error handling** | Generic error messages to client, detailed logs server-side |
| **Secrets** | No hardcoded keys/tokens, env vars via `getEnv()` |

### 4. Blast Radius

For changed functions/modules:
- Who calls this? (`Grep` for function name)
- What breaks if this fails?
- Is there a fallback or does the app crash?

### 5. Attack Scenarios (HIGH risk only)

For each finding, describe a **concrete** attack:
```
Finding: Missing rate limit on /api/crawl/seed
Attack: Attacker sends 1000 requests/second → exhausts Riot API key quota
Impact: Service degraded for all users, potential API key ban
Fix: Add rateLimitPresets.admin
```

## Project-Specific Security Hotspots

| Path | Why It's Sensitive |
|------|--------------------|
| `app/api/auth/` | JWT handling, login/signup |
| `app/api/admin/` | Admin-only operations |
| `app/api/crawl/` | Riot API key usage, data pipeline |
| `app/api/draft/save/` | User-generated content |
| `lib/auth-utils.ts` | Auth middleware |
| `lib/csrf.ts` | CSRF protection |
| `lib/encryption.ts` | Data encryption |
| `lib/riot-api.ts` | External API calls |
| `middleware.ts` | Security headers, global protections |
| `prisma/schema.prisma` | Data model changes |

## Rationalizations to Reject

| Excuse | Why It's Wrong |
|--------|----------------|
| "Small PR, quick review" | Heartbleed was 2 lines |
| "Just a refactor" | Refactors break invariants |
| "No tests = not my problem" | Missing tests = elevated risk |
| "I know this codebase" | Familiarity breeds blind spots |

## Report Format

```markdown
## Security Review: [PR Title]

### Risk Summary
- HIGH: X files
- MEDIUM: Y files
- LOW: Z files

### Findings

#### [SEVERITY] Finding Title
- **Location**: file:line
- **Issue**: Description
- **Attack**: Concrete scenario
- **Fix**: Specific recommendation

### Coverage Note
[What was NOT reviewed and why]
```
