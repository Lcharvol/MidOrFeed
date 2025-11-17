# Tests

Ce dossier contient les tests unitaires et d'intégration pour l'application.

## Installation

Pour activer les tests, installer Vitest :

```bash
pnpm add -D vitest @vitest/ui
```

## Configuration

Créer un fichier `vitest.config.ts` à la racine :

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

## Exécuter les tests

```bash
# Exécuter tous les tests
pnpm vitest

# Mode watch
pnpm vitest --watch

# Interface UI
pnpm vitest --ui

# Couverture
pnpm vitest --coverage
```

## Structure

- `__tests__/api/` : Tests des endpoints API
- `__tests__/lib/` : Tests des utilitaires et helpers

