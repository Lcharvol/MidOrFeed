# Insecure Defaults Detection

Use when auditing security, reviewing configuration, or analyzing environment variable handling.

Finds **fail-open** vulnerabilities where the app runs insecurely with missing configuration. The critical distinction: fail-open (vulnerable) vs fail-secure (crashes safely).

## Patterns to Detect

### 1. Fallback Secrets
```typescript
// CRITICAL: App runs with weak secret if env var missing
const secret = process.env.JWT_SECRET || 'default-secret';
const key = process.env.ENCRYPTION_KEY ?? 'fallback-key';

// SAFE: App crashes if missing (fail-secure)
const secret = process.env.JWT_SECRET!; // or getEnv() which validates
```

**In this project**: `lib/env.ts` validates env vars via Zod — verify ALL security-critical vars go through `getEnv()`.

### 2. Default Credentials
```typescript
// CRITICAL
const adminPassword = config.adminPassword || 'admin123';
const apiKey = config.riotApiKey || 'RGAPI-test-key';
```

### 3. Fail-Open Security
```typescript
// CRITICAL: Missing config disables auth
const authRequired = process.env.AUTH_REQUIRED !== 'false'; // OK
const authRequired = process.env.AUTH_REQUIRED === 'true';  // BAD: default is no auth

// CRITICAL: Missing config allows all origins
const corsOrigin = process.env.CORS_ORIGIN || '*';
```

### 4. Weak Crypto Defaults
```typescript
// BAD: MD5/SHA1 for security contexts
crypto.createHash('md5').update(password);

// GOOD: bcrypt for passwords, SHA-256+ for tokens
```

### 5. Debug in Production
```typescript
// BAD: Stack traces exposed by default
if (process.env.NODE_ENV !== 'production') { /* show details */ }
// What if NODE_ENV is unset? It's not 'production', so details leak.

// GOOD: Explicit check
if (isDevelopment()) { /* show details */ }
```

### 6. Permissive Access
```typescript
// BAD defaults
const maxLoginAttempts = config.maxAttempts || 0; // 0 = unlimited?
const sessionTimeout = config.timeout || -1;       // -1 = never expires?
```

## Verification Workflow

For each finding:
1. **SEARCH** — scan env handling, config files, auth setup, crypto usage
2. **VERIFY** — trace the code path: what happens if the env var is missing?
3. **CONFIRM** — does this reach production? Is there validation?
4. **REPORT** — location, pattern, exploitation scenario, severity

## Project-Specific Checks

| Area | Files to Check | What to Look For |
|------|---------------|-----------------|
| **Auth** | `lib/auth-utils.ts`, `lib/csrf.ts` | JWT_SECRET fallback, CSRF token generation |
| **Encryption** | `lib/encryption.ts` | ENCRYPTION_KEY validation |
| **API Keys** | `lib/riot-api.ts`, `lib/env.ts` | RIOT_API_KEY fallback |
| **Database** | `lib/prisma.ts` | DATABASE_URL validation |
| **Rate Limit** | `lib/rate-limit.ts` | Disabled when env missing? |
| **Security Headers** | `middleware.ts`, `lib/security-headers.ts` | CSP, HSTS disabled in dev? |

## Rationalizations to Reject

| Excuse | Reality |
|--------|---------|
| "It's just a dev default" | If it reaches production code, it's a finding |
| "Production config overrides it" | Code-level vulnerability remains if config missing |
| "Nobody would deploy without config" | Many apps fail silently with wrong config |
| "It's behind authentication" | Compromised session still exploits weak defaults |

## Severity Classification

| Severity | Pattern |
|----------|---------|
| **CRITICAL** | Hardcoded JWT/encryption secrets, auth bypass on missing config |
| **HIGH** | Weak crypto defaults, permissive CORS fallback |
| **MEDIUM** | Debug info in non-production, unlimited rate limits |
| **LOW** | Verbose logging defaults, non-security config fallbacks |
