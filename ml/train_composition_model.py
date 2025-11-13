import argparse
import json
import os
import uuid
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, top_k_accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

DATA_PATH = Path("ml/data/composition_samples.csv")
MODEL_DIR = Path("ml/models")
MODEL_PATH = MODEL_DIR / "composition_model.pkl"


def ensure_model_dir() -> None:
  MODEL_DIR.mkdir(parents=True, exist_ok=True)


def get_db_connection(database_url: str):
  return psycopg2.connect(database_url)


def load_dataset(path: Path) -> pd.DataFrame:
  if not path.exists():
    raise FileNotFoundError(
      f"Dataset introuvable ({path}). Lance `pnpm tsx scripts/export-compositions.ts` d'abord."
    )
  df = pd.read_csv(path)
  required_columns = {
    "matchId",
    "teamId",
    "queueId",
    "patch",
    "gameDuration",
    "role",
    "championId",
    "win",
    "ally1",
    "ally2",
    "ally3",
    "ally4",
    "enemy1",
    "enemy2",
    "enemy3",
    "enemy4",
    "enemy5",
  }
  missing = required_columns.difference(df.columns)
  if missing:
    raise ValueError(f"Colonnes manquantes dans le dataset: {', '.join(sorted(missing))}")
  return df


def build_pipeline() -> Pipeline:
  categorical_features = [
    "role",
    "queueId",
    "patch",
    "ally1",
    "ally2",
    "ally3",
    "ally4",
    "enemy1",
    "enemy2",
    "enemy3",
    "enemy4",
    "enemy5",
  ]

  preprocessor = ColumnTransformer(
    transformers=[
      (
        "cat",
        OneHotEncoder(handle_unknown="ignore"),
        categorical_features,
      ),
    ],
    remainder="drop",
  )

  classifier = RandomForestClassifier(
    n_estimators=400,
    max_depth=None,
    min_samples_leaf=4,
    min_samples_split=8,
    random_state=42,
    n_jobs=-1,
  )

  return Pipeline(
    steps=[
      ("preprocess", preprocessor),
      ("clf", classifier),
    ]
  )


def generate_suggestions(df: pd.DataFrame, pipeline: Pipeline) -> list[dict]:
  features = df[
    [
      "role",
      "queueId",
      "patch",
      "ally1",
      "ally2",
      "ally3",
      "ally4",
      "enemy1",
      "enemy2",
      "enemy3",
      "enemy4",
      "enemy5",
    ]
  ]

  probabilities = pipeline.predict_proba(features)
  classes = pipeline.named_steps["clf"].classes_
  class_index = {label: idx for idx, label in enumerate(classes)}

  prob_values = []
  for row, proba in zip(df.itertuples(index=False), probabilities):
    idx = class_index.get(row.championId)
    prob_values.append(float(proba[idx]) if idx is not None else 0.0)

  df = df.assign(predictedProb=prob_values)

  grouped: dict[str, dict] = {}

  for (_match_id, _team_id), team_df in df.groupby(["matchId", "teamId"]):
    if len(team_df) < 5:
      continue

    team_df = team_df.sort_values("predictedProb", ascending=False)
    team_row = team_df.iloc[0]

    role_map: dict[str, str] = {}
    for row in team_df.itertuples(index=False):
      normalized_role = str(row.role).upper()
      if normalized_role not in role_map:
        role_map[normalized_role] = row.championId

    ordered_champions: list[str] = []
    for role in ROLE_PRIORITY:
      champion = role_map.get(role)
      if champion:
        ordered_champions.append(champion)

    for row in team_df.itertuples(index=False):
      if row.championId not in ordered_champions:
        ordered_champions.append(row.championId)

    if len(ordered_champions) != 5:
      continue

    key = "|".join(ordered_champions)

    avg_prob = float(team_df["predictedProb"].mean())
    total_matches = int(len(team_df))
    wins = int(team_df["win"].sum())
    win_rate = wins / max(total_matches, 1)

    enemy_pool: set[str] = set()
    for column in ["enemy1", "enemy2", "enemy3", "enemy4", "enemy5"]:
      enemy_pool.update(team_df[column].astype(str).tolist())
    enemy_champs = sorted(list(enemy_pool))[:5]

    reasoning = (
      f"Basé sur {total_matches} parties similaires · "
      f"{win_rate * 100:.1f}% de victoire observée."
    )

    entry = {
      "teamChampions": ordered_champions,
      "enemyChampions": enemy_champs,
      "role": str(team_row.role).upper(),
      "suggestedChampion": team_row.championId,
      "confidence": avg_prob,
      "reasoning": reasoning,
      "strengths": None,
      "weaknesses": None,
      "playstyle": None,
    }

    existing = grouped.get(key)
    if not existing or existing["confidence"] < entry["confidence"]:
      grouped[key] = entry

  return sorted(grouped.values(), key=lambda item: item["confidence"], reverse=True)[:100]


def persist_suggestions(connection, suggestions: list[dict]) -> None:
  with connection.cursor() as cur:
    cur.execute("DELETE FROM composition_suggestions WHERE userId IS NULL")

    if not suggestions:
      connection.commit()
      return

    insert_sql = """
      INSERT INTO composition_suggestions (
        id,
        userId,
        teamChampions,
        enemyChampions,
        role,
        suggestedChampion,
        confidence,
        reasoning,
        gameMode,
        tier,
        playstyle,
        strengths,
        weaknesses
      ) VALUES %s
    """

    values = [
      (
        uuid.uuid4().hex,
        None,
        json.dumps(entry["teamChampions"]),
        json.dumps(entry["enemyChampions"]),
        entry["role"],
        entry["suggestedChampion"],
        float(entry["confidence"]),
        entry["reasoning"],
        "RANKED_SOLO_5x5",
        None,
        entry["playstyle"],
        entry["strengths"],
        entry["weaknesses"],
      )
      for entry in suggestions
    ]

    execute_values(cur, insert_sql, values, page_size=200)
  connection.commit()


def main(args: argparse.Namespace):
  if not args.database_url:
    raise ValueError("DATABASE_URL manquant pour stocker les suggestions générées.")

  df = load_dataset(args.data_path)
  features = df[
    [
      "role",
      "queueId",
      "patch",
      "ally1",
      "ally2",
      "ally3",
      "ally4",
      "enemy1",
      "enemy2",
      "enemy3",
      "enemy4",
      "enemy5",
    ]
  ]
  target = df["championId"]

  X_train, X_test, y_train, y_test = train_test_split(
    features, target, test_size=0.2, random_state=42, stratify=target
  )

  pipeline = build_pipeline()
  pipeline.fit(X_train, y_train)

  y_pred = pipeline.predict(X_test)
  y_pred_proba = pipeline.predict_proba(X_test)

  top3 = top_k_accuracy_score(y_test, y_pred_proba, k=3, labels=pipeline.classes_)
  acc = accuracy_score(y_test, y_pred)

  print(f"Accuracy@1: {acc:.3f}")
  print(f"Accuracy@3: {top3:.3f}")

  ensure_model_dir()
  joblib.dump(pipeline, MODEL_PATH)
  print(f"Modèle sauvegardé dans {MODEL_PATH}")

  suggestions = generate_suggestions(df, pipeline)
  print(f"{len(suggestions)} suggestions générées.")

  conn = get_db_connection(args.database_url)
  try:
    persist_suggestions(conn, suggestions)
    print("Suggestions mises à jour dans la base.")
  finally:
    conn.close()


if __name__ == "__main__":
  parser = argparse.ArgumentParser(description="Train composition suggestion model")
  parser.add_argument("--data-path", type=Path, default=DATA_PATH)
  parser.add_argument(
    "--database-url",
    type=str,
    default=os.environ.get("DATABASE_URL"),
  )
  main(parser.parse_args())

import argparse
import json
import os
import uuid
from collections import defaultdict
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, top_k_accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

DATA_PATH = Path("ml/data/composition_samples.csv")
MODEL_PATH = Path("ml/models/composition_model.pkl")

ROLE_PRIORITY = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]


def ensure_model_dir() -> None:
  MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)


def get_db_connection(database_url: str):
  return psycopg2.connect(database_url)


def load_dataset(path: Path) -> pd.DataFrame:
  if not path.exists():
    raise FileNotFoundError(
      f"Dataset introuvable ({path}). Lance `pnpm tsx scripts/export-compositions.ts` d'abord."
    )
  df = pd.read_csv(path)
  required_columns = {
    "matchId",
    "teamId",
    "queueId",
    "patch",
    "gameDuration",
    "role",
    "championId",
    "win",
    "ally1",
    "ally2",
    "ally3",
    "ally4",
    "enemy1",
    "enemy2",
    "enemy3",
    "enemy4",
    "enemy5",
  }
  missing = required_columns.difference(df.columns)
  if missing:
    raise ValueError(f"Colonnes manquantes dans le dataset: {', '.join(sorted(missing))}")
  return df


def build_pipeline() -> Pipeline:
  categorical_features = [
    "role",
    "queueId",
    "patch",
    "ally1",
    "ally2",
    "ally3",
    "ally4",
    "enemy1",
    "enemy2",
    "enemy3",
    "enemy4",
    "enemy5",
  ]

  preprocessor = ColumnTransformer(
    transformers=[
      (
        "cat",
        OneHotEncoder(handle_unknown="ignore"),
        categorical_features,
      ),
    ],
    remainder="drop",
  )

  classifier = RandomForestClassifier(
    n_estimators=400,
    max_depth=None,
    min_samples_leaf=4,
    min_samples_split=8,
    random_state=42,
    n_jobs=-1,
  )

  return Pipeline(
    steps=[
      ("preprocess", preprocessor),
      ("clf", classifier),
    ]
  )


def compute_team_key(row: pd.Series) -> str:
  team = sorted([row["championId"], row["ally1"], row["ally2"], row["ally3"], row["ally4"]])
  return "|".join(team)


def store_model(pipeline: Pipeline) -> None:
  ensure_model_dir()
  joblib.dump(pipeline, MODEL_PATH)


def generate_suggestions(
  df: pd.DataFrame,
  pipeline: Pipeline,
) -> list[dict]:
  features = df[
    [
      "role",
      "queueId",
      "patch",
      "ally1",
      "ally2",
      "ally3",
      "ally4",
      "enemy1",
      "enemy2",
      "enemy3",
      "enemy4",
      "enemy5",
    ]
  ]
  probabilities = pipeline.predict_proba(features)
  classes = pipeline.named_steps["clf"].classes_
  class_index = {label: idx for idx, label in enumerate(classes)}

  prob_values = []
  for row, proba in zip(df.itertuples(index=False), probabilities):
    idx = class_index.get(row.championId)
    prob_values.append(float(proba[idx]) if idx is not None else 0.0)

  df = df.assign(predictedProb=prob_values)

  grouped: dict[tuple[str, str], dict] = {}

  for (match_id, team_id), team_df in df.groupby(["matchId", "teamId"]):
    if len(team_df) < 5:
      continue

    team_df = team_df.sort_values("predictedProb", ascending=False)
    team_row = team_df.iloc[0]

    team_champions = sorted(
      {
        team_row.championId,
        *team_df["ally1"].tolist(),
        *team_df["ally2"].tolist(),
        *team_df["ally3"].tolist(),
        *team_df["ally4"].tolist(),
      }
    )

    if len(team_champions) != 5:
      continue

    key = ("|".join(team_champions), team_row.role)

    avg_prob = float(team_df["predictedProb"].mean())
    total_matches = int(len(team_df))
    wins = int(team_df["win"].sum())
    win_rate = wins / max(total_matches, 1)

    enemy_champs = sorted(team_df["enemy1"].tolist() + team_df["enemy2"].tolist() +
                          team_df["enemy3"].tolist() + team_df["enemy4"].tolist() +
                          team_df["enemy5"].tolist())[:5]

    reasoning = (
      f"Basé sur {total_matches} parties similaires · "
      f"{win_rate * 100:.1f}% de victoire observée."
    )

    strengths = (
      f"Synergie observée autour de {team_row.championId} dans le rôle {team_row.role}. "
      "Le modèle prédit une forte probabilité de succès dans ce contexte."
    )

    entry = {
      "teamChampions": team_champions,
      "enemyChampions": enemy_champs,
      "role": team_row.role,
      "suggestedChampion": team_row.championId,
      "confidence": avg_prob,
      "reasoning": reasoning,
      "strengths": strengths,
      "weaknesses": None,
      "playstyle": None,
      "sampleCount": total_matches,
      "winRate": win_rate,
    }

    existing = grouped.get(key)
    if not existing or existing["confidence"] < entry["confidence"]:
      grouped[key] = entry

  suggestions = sorted(
    grouped.values(),
    key=lambda item: item["confidence"],
    reverse=True,
  )

  return suggestions[:100]


def persist_suggestions(
  connection,
  suggestions: list[dict],
) -> None:
  with connection.cursor() as cur:
    cur.execute("DELETE FROM composition_suggestions WHERE userId IS NULL")

    insert_sql = """
      INSERT INTO composition_suggestions (
        id,
        userId,
        teamChampions,
        enemyChampions,
        role,
        suggestedChampion,
        confidence,
        reasoning,
        gameMode,
        tier,
        playstyle,
        strengths,
        weaknesses
      ) VALUES %s
    """

    values = [
      (
        uuid.uuid4().hex,
        None,
        json.dumps(entry["teamChampions"]),
        json.dumps(entry["enemyChampions"]),
        entry["role"],
        entry["suggestedChampion"],
        float(entry["confidence"]),
        entry["reasoning"],
        "RANKED_SOLO_5x5",
        None,
        entry["playstyle"],
        entry["strengths"],
        entry["weaknesses"],
      )
      for entry in suggestions
    ]

    execute_values(cur, insert_sql, values, page_size=200)
  connection.commit()


def main(args: argparse.Namespace):
  if not args.database_url:
    raise ValueError("DATABASE_URL manquant pour stocker les suggestions générées.")

  df = load_dataset(args.data_path)
  features = df[
    [
      "role",
      "queueId",
      "patch",
      "ally1",
      "ally2",
      "ally3",
      "ally4",
      "enemy1",
      "enemy2",
      "enemy3",
      "enemy4",
      "enemy5",
    ]
  ]
  target = df["championId"]

  X_train, X_test, y_train, y_test = train_test_split(
    features, target, test_size=0.2, random_state=42, stratify=target
  )

  pipeline = build_pipeline()
  pipeline.fit(X_train, y_train)

  y_pred = pipeline.predict(X_test)
  y_pred_proba = pipeline.predict_proba(X_test)

  top3 = top_k_accuracy_score(y_test, y_pred_proba, k=3, labels=pipeline.classes_)
  acc = accuracy_score(y_test, y_pred)

  print(f"Accuracy@1: {acc:.3f}")
  print(f"Accuracy@3: {top3:.3f}")

  ensure_model_dir()
  store_model(pipeline)
  print(f"Modèle sauvegardé dans {MODEL_PATH}")

  suggestions = generate_suggestions(df, pipeline)
  print(f"{len(suggestions)} suggestions générées.")

  conn = get_db_connection(args.database_url)
  try:
    persist_suggestions(conn, suggestions)
    print("Suggestions mises à jour dans la base.")
  finally:
    conn.close()


if __name__ == "__main__":
  parser = argparse.ArgumentParser(description="Train composition suggestion model")
  parser.add_argument("--data-path", type=Path, default=DATA_PATH)
  parser.add_argument(
    "--database-url",
    type=str,
    default=os.environ.get("DATABASE_URL"),
  )
  main(parser.parse_args())


