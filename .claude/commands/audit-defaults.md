Scan the codebase for insecure defaults and fail-open vulnerabilities:

1. **Search** for fallback patterns in security-critical code:
   - `process.env.* || 'default'` or `?? 'fallback'` for secrets/keys
   - `process.env.* === 'true'` (default = disabled) vs `!== 'false'` (default = enabled)
   - Hardcoded credentials: `password`, `api_key`, `secret` with string literals
   - Weak crypto: `md5`, `sha1`, `des`, `rc4`, `ecb` in security contexts
   - Permissive defaults: `CORS *`, `timeout: 0`, `maxRetries: -1`

2. **Verify** each finding: trace the code path to determine if the app runs insecurely (fail-open) or crashes (fail-secure)

3. **Check project-specific areas**:
   - `lib/env.ts` — all critical vars validated via Zod?
   - `lib/auth-utils.ts` — JWT_SECRET handling
   - `lib/encryption.ts` — ENCRYPTION_KEY validation
   - `lib/riot-api.ts` — API key fallback
   - `middleware.ts` — security headers conditional on NODE_ENV?
   - `lib/rate-limit.ts` — disabled when config missing?

4. **Report** with severity: CRITICAL (auth bypass, hardcoded secrets), HIGH (weak crypto, permissive CORS), MEDIUM (debug exposure), LOW (verbose logging)

Focus: $ARGUMENTS
