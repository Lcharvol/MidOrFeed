# Security Review Checklist

Use this skill when writing or reviewing API routes, auth logic, or any code handling user input.

## OWASP API Security Top 10

1. **Broken Object Level Authorization** — verify user owns the resource before any operation
2. **Broken Authentication** — use `requireAuth()`/`requireAdmin()` from `lib/auth-utils.ts`
3. **Broken Object Property Level Authorization** — use Prisma `select` to expose only allowed fields, never return full records
4. **Unrestricted Resource Consumption** — apply `rateLimitPresets.*` on all endpoints
5. **Broken Function Level Authorization** — admin routes use `requireAdmin()`, not just `requireAuth()`
6. **Server Side Request Forgery** — validate/sanitize URLs in server-side fetches
7. **Security Misconfiguration** — security headers enforced via `middleware.ts`
8. **Improper Inventory Management** — remove unused API routes, document all endpoints
9. **Unsafe Consumption of APIs** — validate Riot API responses before using
10. **Verbose Error Messages** — generic error messages in French for public endpoints, never expose internals

## API Route Security Pattern

Every API route should follow this order:

```typescript
export async function POST(request: NextRequest) {
  // 1. Rate limiting (always first)
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) return rateLimitResponse;

  // 2. Authentication
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Authentification requise" }, { status: 401 });
  }

  // 3. CSRF validation (for mutations)
  const csrfError = await requireCsrf(request);
  if (csrfError) return csrfError;

  // 4. Input validation (Zod)
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
  }

  // 5. Authorization (verify user can access this resource)
  const resource = await prisma.resource.findUnique({ where: { id: parsed.data.id } });
  if (resource?.userId !== user.id && !isAdmin(user.role)) {
    return NextResponse.json({ success: false, error: "Accès interdit" }, { status: 403 });
  }

  try {
    // 6. Business logic
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error("Description of what failed", toError(error));
    // NEVER expose error.message or stack to the client
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
```

## Input Validation Rules

- **Always validate** user input with Zod schemas before use
- Use `safeParse` + `flatten()` for structured error responses
- Validate data types, ranges, lengths — use allowlists not blocklists
- For search queries: use `escapeLikePattern()` from `lib/sql-sanitization.ts`
- For dynamic table/column names: use `validateTableName()`, `escapeSqlIdentifier()`
- Never interpolate user input into raw SQL — use `$queryRaw` with tagged templates

```typescript
// BAD: SQL injection risk
const result = await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE name = '${name}'`);

// GOOD: parameterized query
const result = await prisma.$queryRaw`SELECT * FROM users WHERE name = ${name}`;
```

## Authentication & Authorization Checklist

- [ ] All mutation endpoints require authentication (`requireAuth()` or `requireAdmin()`)
- [ ] All mutation endpoints validate CSRF token (`requireCsrf()`)
- [ ] Rate limiting applied with appropriate preset
- [ ] Resource ownership verified before update/delete operations
- [ ] Admin-only routes use `requireAdmin()` (checks role + CSRF)
- [ ] JWT tokens have short expiration, HTTP-only cookie storage
- [ ] No sensitive data in JWT payload (no passwords, no API keys)
- [ ] Login endpoints don't reveal whether email exists ("Invalid credentials" for both cases)

## Error Handling Security

```typescript
// BAD: leaks database details
catch (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
  // "Unique constraint failed on the fields: (`email`)"
}

// GOOD: generic message + server-side logging
catch (error) {
  logger.error("User creation failed", toError(error));
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json({ success: false, error: "Cet email est déjà utilisé" }, { status: 400 });
  }
  return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
}
```

## Data Protection

- Passwords hashed with bcrypt (salt rounds >= 10)
- Sensitive data encrypted at rest via `lib/encryption.ts` (AES-256-GCM)
- HTTPS enforced via HSTS header in production
- Secrets in environment variables, validated via `lib/env.ts`
- Never log passwords, tokens, API keys, or PII
- Use `select` in Prisma to never accidentally return password hashes or sensitive fields

## Security Headers (via middleware.ts)

- `X-Frame-Options: DENY` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` — restricts script/style sources
- `HSTS: max-age=31536000; includeSubDomains; preload` (production only)
- `Cache-Control: no-store` on `/api/auth` and `/api/admin` routes
