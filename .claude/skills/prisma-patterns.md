# Prisma Optimization Patterns

Use this skill when writing or reviewing Prisma queries, schema changes, or migrations.

## N+1 Query Prevention

Always include related data in a single query instead of querying inside loops:

```typescript
// BAD: N+1 — fires one query per user
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({ where: { authorId: user.id } });
}

// GOOD: single query with relations
const users = await prisma.user.findMany({
  include: { posts: true }
});

// BEST: fetch only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    posts: { select: { id: true, title: true } }
  }
});

// COMPLEX AGGREGATIONS: use $queryRaw
const result = await prisma.$queryRaw`
  SELECT u.id, u.email, COUNT(p.id) as post_count
  FROM users u
  LEFT JOIN posts p ON p."authorId" = u.id
  GROUP BY u.id
`;
```

## Transaction Patterns

```typescript
// Sequential batch (auto-transaction)
const [user, profile] = await prisma.$transaction([
  prisma.user.create({ data: userData }),
  prisma.profile.create({ data: profileData }),
]);

// Interactive transaction with validation
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  if (!isValid(user)) throw new Error("Validation failed");
  const profile = await tx.profile.create({
    data: { ...profileData, userId: user.id }
  });
  return { user, profile };
}, {
  maxWait: 5000,
  timeout: 10000,
});

// Optimistic concurrency control
const updated = await prisma.post.update({
  where: { id: postId, version: currentVersion },
  data: { content: newContent, version: { increment: 1 } }
});
```

## Schema Best Practices

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  posts     Post[]   @relation("UserPosts")
  profile   Profile? @relation("UserProfile")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@map("users")
}

model Post {
  id       String @id @default(cuid())
  title    String
  author   User   @relation("UserPosts", fields: [authorId], references: [id], onDelete: Cascade)
  authorId String

  @@index([authorId])
  @@map("posts")
}
```

Checklist:
- All models have `@id` with appropriate primary key strategy
- Relations use explicit `@relation` with `fields` and `references`
- Cascade behaviors defined (`onDelete`, `onUpdate`)
- `@@index` on frequently queried/filtered fields
- `@@map` used for table naming conventions
- Enums used for fixed value sets
- `@@unique` for composite uniqueness constraints

## Migration Safety

- **Development**: `pnpm prisma migrate dev --name descriptive_name`
- **Production**: `prisma migrate deploy` (runs via release command in fly.toml)
- **Never** use `migrate dev` in production
- **Failed production migration**: use `prisma migrate resolve --applied "name"` or `--rolled-back "name"`
- **Schema drift check**: `npx prisma migrate diff --from-schema-datamodel --to-schema-datasource`
- Always ensure backward-compatible changes (no data loss in migrations)

## Connection Management

- Singleton pattern in `lib/prisma.ts` prevents connection exhaustion
- Connection limit configured in `DATABASE_URL`: `?connection_limit=5&pool_timeout=20`
- `withRetry()` handles transient connection errors with exponential backoff
- Graceful shutdown via `prisma.$disconnect()` in process exit handlers

## Query Review Checklist

- [ ] No N+1 queries (relations included/selected)
- [ ] `select` used to fetch only required fields
- [ ] Pagination for list queries (`skip`/`take`)
- [ ] Raw queries only for complex aggregations
- [ ] Proper error handling (catch Prisma error codes: P2002 unique, P2025 not found)
- [ ] Indexes exist for WHERE clause fields
- [ ] No `findMany()` without `take` limit on large tables
