Investigate this issue using the systematic debugging methodology:

1. **Root Cause Investigation** — Read error messages completely, reproduce the issue, check recent changes (`git diff`), trace data flow through component boundaries
2. **Pattern Analysis** — Find working examples in the codebase, compare against references, identify differences
3. **Hypothesis Testing** — Form one specific hypothesis, test with the smallest possible change, verify before continuing
4. **Implementation** — Write a failing test reproducing the bug, implement a single fix, verify all tests pass

Rules:
- NO fixes without root cause investigation
- ONE change at a time, never stack multiple fixes
- If 3+ fixes fail, question the architecture
- Run `pnpm tsc --noEmit` and `pnpm test` to verify the fix

Issue to investigate: $ARGUMENTS
