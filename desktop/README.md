# MidOrFeed Overlay

Application desktop overlay pour League of Legends.

## Fonctionnalites

- **Champion Select Helper**: Affiche les informations en temps reel pendant la selection des champions
- **Connexion LCU automatique**: Detection automatique du client League of Legends
- **Overlay transparent**: S'affiche par-dessus le jeu sans interferer
- **System Tray**: Fonctionne en arriere-plan avec acces rapide

## Developpement

### Prerequis

- Node.js 18+
- pnpm

### Installation

```bash
cd desktop
pnpm install
```

### Demarrage en mode developpement

```bash
pnpm dev
```

Cela lance:
- Le compilateur TypeScript en mode watch pour le main process
- Le serveur Vite pour le renderer

Dans un autre terminal:
```bash
pnpm start
```

### Build

```bash
pnpm build
```

### Creation des installateurs

```bash
# Windows
pnpm dist:win

# macOS
pnpm dist:mac

# Tous
pnpm dist
```

## Structure

```
desktop/
├── src/
│   ├── main/           # Process principal Electron
│   │   ├── lcu/        # Integration League Client API
│   │   ├── windows/    # Gestion des fenetres
│   │   └── ipc/        # Handlers IPC
│   ├── renderer/       # Interface React
│   │   └── components/ # Composants UI
│   ├── shared/         # Types partages
│   └── preload/        # Script preload securise
├── assets/
│   └── icons/          # Icones de l'application
└── build/              # Configuration de build
```

## Notes

- L'application utilise l'API LCU officielle de Riot Games
- Aucune modification de memoire du jeu n'est effectuee
- Conforme aux conditions d'utilisation de Riot Games
