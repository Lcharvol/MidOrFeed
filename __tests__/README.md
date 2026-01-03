# Tests

Ce dossier contient les tests unitaires et d'intégration pour l'application.

## Structure

```
__tests__/
├── api/                    # Tests des endpoints API
│   └── health.test.ts      # Tests du health check
└── lib/                    # Tests des utilitaires
    ├── jwt.test.ts         # Tests JWT (génération, vérification)
    ├── pagination.test.ts  # Tests pagination
    ├── password-validation.test.ts  # Tests validation mot de passe
    ├── rate-limit.test.ts  # Tests rate limiting
    └── sql-sanitization.test.ts     # Tests sécurité SQL
```

## Exécuter les tests

```bash
# Exécuter tous les tests
pnpm test

# Mode watch (relance automatique)
pnpm test:watch

# Interface UI (navigateur)
pnpm test:ui

# Avec couverture de code
pnpm test:coverage
```

## Configuration

La configuration Vitest se trouve dans `vitest.config.mts` à la racine du projet.

## Écrire des tests

Les tests utilisent [Vitest](https://vitest.dev/) avec les conventions suivantes :

- Fichiers de test : `*.test.ts`
- Utiliser `describe` pour grouper les tests
- Utiliser `it` ou `test` pour les cas de test
- Mocker les dépendances externes (Prisma, Redis, etc.)

Exemple :

```typescript
import { describe, it, expect, vi } from "vitest";

describe("monModule", () => {
  it("devrait faire quelque chose", () => {
    expect(true).toBe(true);
  });
});
```

## Mocking

Pour mocker des modules :

```typescript
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));
```
