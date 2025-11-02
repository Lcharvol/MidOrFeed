# MidOrFeed

Plateforme d'analyse de performances League of Legends avec suggestions de compositions IA.

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
- **Session** : Gestion de session avec contexte React et localStorage
- **Avatar** : Dropdown menu avec profil, paramètres et déconnexion

## 🎮 Champions de League of Legends

La base de données contient tous les champions de League of Legends synchronisés depuis l'API Data Dragon de Riot Games.

### Caractéristiques des champions

- **Synchronisation automatique** : Script pour récupérer les derniers champions
- **171 champions** : Toutes les données sont à jour
- **Statistiques complètes** : HP, mana, attaque, défense, magie, difficulté, etc.
- **API REST** : Endpoints pour consulter et synchroniser les champions

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

model Champion {
  id                String   @id @default(cuid())
  championId        String   @unique // ID Riot (ex: "Aatrox")
  name              String   @unique
  title             String
  blurb             String?
  attack            Int
  defense           Int
  magic             Int
  difficulty        Int
  hp                Float
  hpPerLevel        Float
  mp                Float?
  mpPerLevel        Float?
  moveSpeed         Int
  armor             Float
  armorPerLevel     Float
  spellBlock        Float
  spellBlockPerLevel Float
  attackRange       Float
  hpRegen           Float
  hpRegenPerLevel   Float
  mpRegen           Float?
  mpRegenPerLevel   Float?
  crit              Float
  critPerLevel      Float
  attackDamage      Float
  attackDamagePerLevel Float
  attackSpeed       Float
  attackSpeedPerLevel Float
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("champions")
}
```

## 📁 Structure du projet

```text
mid-or-feed/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── champions/
│   │   ├── crawl/
│   │   ├── matches/
│   │   ├── riot/
│   │   └── user/
│   ├── ai-analysis/
│   ├── compositions/
│   ├── pricing/
│   ├── profile/
│   ├── settings/
│   ├── summoners/
│   ├── tier-list/
│   └── ...
├── components/
│   ├── ui/        # Composants shadcn/ui
│   ├── Header.tsx
│   └── AIInsightCard.tsx
├── lib/
│   ├── hooks/
│   ├── prisma.ts
│   ├── auth-context.tsx
│   └── i18n-context.tsx
├── scripts/
│   ├── sync-champions.ts
│   ├── sync-items.ts
│   └── crawl-data.ts
├── messages/
│   ├── fr.json
│   └── en.json
├── prisma/
│   ├── schema.prisma
│   ├── dev.db
│   └── migrations/
└── public/
    ├── logo.png
    └── home_background.png
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
- `pnpm run sync:champions` : Synchroniser les champions depuis l'API Riot

## 🕷️ Système de Crawl de Données

MidOrFeed intègre un système de crawl automatique pour collecter des données de joueurs et de matchs depuis l'API Riot Games.

### Commandes rapides

```bash
# Découvrir de nouveaux joueurs
pnpm crawl:seed euw1 50

# Crawler les joueurs en attente
pnpm crawl:process

# Voir les statistiques
pnpm crawl:status
```

### Documentation complète

Consultez [CRAWL_SYSTEM.md](./CRAWL_SYSTEM.md) pour la documentation détaillée du système de crawl.

## 📝 Prochaines étapes

- [x] Implémenter le système d'authentification
- [x] Ajouter les champions depuis l'API Riot
- [ ] Implémenter NextAuth.js pour les sessions complètes
- [ ] Créer les fonctionnalités de compositions
- [ ] Intégrer les items depuis l'API Riot
- [ ] Ajouter la gestion des favoris
- [ ] Implémenter les statistiques personnalisées

## 📄 License

MIT
