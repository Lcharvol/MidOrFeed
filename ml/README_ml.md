# Machine Learning Pipeline (Python + scikit-learn)

## Installation locale

```bash
cd ml
python -m venv .venv
source .venv/bin/activate  # ou .venv\Scripts\activate sur Windows
pip install -r requirements.txt
```

## Export des données

```bash
pnpm tsx scripts/export-matches.ts
# produit ml/data/match_participants.csv

pnpm tsx scripts/export-compositions.ts
# produit ml/data/composition_samples.csv
```

## Entraînement

```bash
source .venv/bin/activate
DATABASE_URL="postgresql://..." python train_model.py
# Modèle de probabilité de victoire

DATABASE_URL="postgresql://..." python train_composition_model.py
# Génère les suggestions IA de compositions et sauvegarde le modèle
```

Le script entraîne un modèle de classification (RandomForest) et écrit les résultats dans les tables `ml_training_runs` et `ml_predictions` de la base Postgres.

## Prédictions

Les routes Next (`/api/admin/ml/status`, `/api/ml/predictions`) lisent directement les données stockées dans la base. Aucune sortie JSON n'est nécessaire.

