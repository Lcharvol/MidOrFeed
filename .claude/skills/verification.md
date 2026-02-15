# Verification Before Completion

Use before claiming work is complete, fixed, or passing — before committing or creating PRs.

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this response, you cannot claim it passes.

## The Gate

```
BEFORE claiming any status:

1. IDENTIFY — What command proves this claim?
2. RUN — Execute the command (fresh, complete)
3. READ — Full output, check exit code
4. VERIFY — Does output confirm the claim?
   → NO: State actual status with evidence
   → YES: State claim WITH evidence
5. ONLY THEN — Make the claim
```

## What Requires Verification

| Claim | Run This | NOT Sufficient |
|-------|----------|----------------|
| "Tests pass" | `pnpm test` — see 0 failures | "Should pass", previous run |
| "Types check" | `pnpm tsc --noEmit` — exit 0 | "Looks correct" |
| "Build works" | `pnpm build` — exit 0 | Linter passing |
| "Bug fixed" | Test original symptom | "Code changed" |
| "No regressions" | Full test suite | Partial check |

## Red Flags — STOP

You're about to violate this rule if you're:
- Using "should", "probably", "seems to"
- Expressing satisfaction before running verification ("Done!", "Fixed!")
- About to commit/push without verification
- Thinking "just this once"

## Project Verification Commands

```bash
# Type check (mandatory before commit)
pnpm tsc --noEmit

# Run tests
pnpm test

# Lint
pnpm lint

# Build (for major changes)
pnpm build
```

## The Bottom Line

Run the command. Read the output. THEN claim the result.
