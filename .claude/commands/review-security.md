Perform a security-focused differential review of recent changes:

1. **Triage** — Run `git diff main...HEAD --stat` to see changed files, classify each by risk level (HIGH/MEDIUM/LOW)
2. **Git History** — For HIGH risk files, check `git log` and `git blame` to understand why removed code existed
3. **Security Analysis** — For each HIGH risk change, verify:
   - Auth: `requireAuth()`/`requireAdmin()` on mutations
   - CSRF: `requireCsrf()` on POST/PUT/DELETE
   - Rate limit: `rateLimit()` on all endpoints
   - Input validation: Zod `safeParse` before using body
   - SQL safety: tagged template `$queryRaw` only
   - Data exposure: `select` on Prisma queries
   - Error handling: generic messages to client
   - Secrets: env vars via `getEnv()`
4. **Blast Radius** — Who calls changed functions? What breaks if they fail?
5. **Report** — For each finding: location, issue, concrete attack scenario, fix recommendation

Scope: $ARGUMENTS
