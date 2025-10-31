# LOL Comp Maker

Application web pour créer et partager des compositions de champions pour League of Legends.

## 🚀 Technologies

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (development)
- **Authentification**: bcryptjs pour le hachage des mots de passe
- **Validation**: Zod, react-hook-form

## 📦 Installation

```bash
# Installer les dépendances
pnpm install

# Générer le client Prisma
pnpm run prisma:generate

# Créer la base de données
pnpm run prisma:migrate

# Lancer le serveur de développement
pnpm dev
```

## 🗄️ Base de données

### Visualiser la base de données

```bash
pnpm run prisma:studio
```

Ouvre l'interface Prisma Studio sur <http://localhost:5555>

### Commandes Prisma utiles

```bash
# Générer le client Prisma
pnpm run prisma:generate

# Créer une nouvelle migration
pnpm run prisma:migrate

# Ouvrir Prisma Studio
pnpm run prisma:studio
```

## 🔐 Authentification

L'application dispose d'un système d'authentification complet :

### Fonctionnalités

- **Inscription** (`/signup`) : Création de compte avec validation
- **Connexion** (`/login`) : Authentification sécurisée
- **Validation** : Utilisation de Zod pour la validation des formulaires
- **Sécurité** : Mots de passe hashés avec bcryptjs
- **Interface** : Formulaires avec react-hook-form et shadcn/ui

### Structure de la base de données

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

## 📁 Structure du projet

```text
lol-comp-maker/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/
│   │       └── signup/
│   ├── login/
│   ├── signup/
│   ├── tier-list/
│   │   ├── champions/
│   │   └── items/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/        # Composants shadcn/ui
│   ├── Header.tsx
│   └── ConditionalHeader.tsx
├── lib/
│   ├── prisma.ts  # Client Prisma
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   ├── dev.db
│   └── migrations/
└── public/
    ├── logo.png
    └── logo-text.png
```

## 🎨 Interface

L'application utilise un thème inspiré de League of Legends avec :

- Mode sombre forcé
- Couleurs grises et or vibrant
- Composants UI modernes de shadcn/ui

## 🛠️ Scripts disponibles

- `pnpm dev` : Lancer le serveur de développement
- `pnpm build` : Créer une build de production
- `pnpm start` : Lancer le serveur de production
- `pnpm lint` : Lancer ESLint
- `pnpm run prisma:studio` : Ouvrir Prisma Studio
- `pnpm run prisma:generate` : Régénérer le client Prisma
- `pnpm run prisma:migrate` : Créer/appliquer les migrations

## 📝 Prochaines étapes

- [ ] Implémenter NextAuth.js pour une authentification complète
- [ ] Ajouter des sessions utilisateur
- [ ] Créer les fonctionnalités de compositions
- [ ] Intégrer l'API de League of Legends
- [ ] Ajouter la gestion des favoris
- [ ] Implémenter les statistiques

## 📄 License

MIT
