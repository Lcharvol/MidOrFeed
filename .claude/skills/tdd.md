# Test-Driven Development

Use when implementing any feature or bugfix — before writing implementation code.

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? Delete it. Start over. No exceptions.

## Red-Green-Refactor Cycle

### 1. RED — Write Failing Test

Write ONE minimal test showing what should happen.

```typescript
test('rejects empty email', async () => {
  const result = await submitForm({ email: '' });
  expect(result.error).toBe('Email required');
});
```

Requirements:
- One behavior per test
- Clear descriptive name (no `test('test1')`)
- Test real code, not mocks (mocks only if unavoidable)

### 2. Verify RED — Watch It Fail

**MANDATORY. Never skip.**

```bash
pnpm test path/to/test.test.ts
```

Confirm:
- Test **fails** (not errors)
- Failure is because feature is **missing** (not because of typos)
- Test passes? You're testing existing behavior → fix the test

### 3. GREEN — Minimal Code

Write the **simplest** code to make the test pass. Nothing more.

```typescript
// GOOD: just enough
function submitForm(data: FormData) {
  if (!data.email?.trim()) return { error: 'Email required' };
  // ...
}

// BAD: over-engineered
function submitForm(data: FormData, options?: {
  validateDomain?: boolean;
  allowDisposable?: boolean; // YAGNI
}) { /* ... */ }
```

### 4. Verify GREEN — Watch It Pass

```bash
pnpm test path/to/test.test.ts
```

Confirm: test passes, other tests still pass, no warnings.

### 5. REFACTOR — Clean Up

Only after green: remove duplication, improve names, extract helpers. Keep tests green.

### 6. Repeat

Next failing test for next behavior.

## What to Test in This Project

| Layer | Test With | Example |
|-------|-----------|---------|
| **Utility functions** (`lib/`) | Vitest unit tests | `pagination.test.ts`, `cache.test.ts` |
| **Zod schemas** | Vitest unit tests | Valid/invalid input, edge cases |
| **Data transformations** | Vitest unit tests | `formatDuration`, `normalizeLane` |
| **API route logic** | Vitest with mocked Prisma | Request → response validation |
| **React hooks** | Vitest + testing-library | State transitions, error handling |

**Not required** (per CLAUDE.md): UI components, unless they contain complex logic.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. |
| "Need to explore first" | Fine. Throw away exploration, start with TDD. |
| "TDD will slow me down" | TDD is faster than debugging. |
| "Test is hard to write" | Hard to test = hard to use. Simplify the design. |

## Bug Fix Pattern

1. Write test reproducing the bug → verify it **fails**
2. Fix the bug → verify test **passes**
3. All other tests still pass
4. Commit

Never fix bugs without a regression test.

## Verification Checklist

- [ ] Every new function has a test
- [ ] Watched each test fail before implementing
- [ ] Wrote minimal code to pass
- [ ] All tests pass (`pnpm test`)
- [ ] Edge cases covered
