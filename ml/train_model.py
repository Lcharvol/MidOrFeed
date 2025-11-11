import argparse
import os
import uuid
from pathlib import Path

import numpy as np
import pandas as pd
import psycopg2
from psycopg2 import sql
from psycopg2.extras import execute_values
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

DATA_PATH = Path("ml/data/match_participants.csv")


def get_db_connection(database_url: str):
  return psycopg2.connect(database_url)


def load_data(data_path: Path) -> pd.DataFrame:
  if not data_path.exists():
    raise FileNotFoundError(
      f"Dataset introuvable: {data_path}. Lance `pnpm tsx scripts/export-matches.ts` d'abord."
    )

  df = pd.read_csv(data_path)
  df = df.dropna(subset=["win"])
  df["win"] = df["win"].astype(int)
  df["vision_per_min"] = df["visionScore"] / np.maximum(df["gameDuration"], 1)
  df["damage_per_min"] = df["totalDamageDealtToChampions"] / np.maximum(df["gameDuration"], 1)
  df["gold_per_min"] = df["goldEarned"] / np.maximum(df["gameDuration"], 1)
  df["kda"] = (df["kills"] + df["assists"]) / np.maximum(df["deaths"], 1)
  return df.fillna(0)


def build_pipeline(df: pd.DataFrame) -> Pipeline:
  numeric_features = [
    "kills",
    "deaths",
    "assists",
    "goldEarned",
    "totalDamageDealtToChampions",
    "totalDamageTaken",
    "visionScore",
    "gameDuration",
    "vision_per_min",
    "damage_per_min",
    "gold_per_min",
    "kda",
  ]

  categorical_features = ["championId", "role", "lane", "queueId"]

  preprocessor = ColumnTransformer(
    transformers=[
      ("num", StandardScaler(), numeric_features),
      (
        "cat",
        OneHotEncoder(handle_unknown="ignore", sparse_output=False),
        categorical_features,
      ),
    ],
    remainder="drop",
  )

  classifier = RandomForestClassifier(
    n_estimators=200,
    max_depth=None,
    min_samples_split=10,
    min_samples_leaf=5,
    random_state=42,
    n_jobs=-1,
  )

  return Pipeline(steps=[("preprocess", preprocessor), ("clf", classifier)])


def main(args: argparse.Namespace):
  if not args.database_url:
    raise ValueError("DATABASE_URL manquant pour écrire les prédictions en base")

  df = load_data(args.data_path)
  X = df.drop(columns=["win", "matchId"])
  y = df["win"].astype(int)

  X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
  )

  pipeline = build_pipeline(df)
  pipeline.fit(X_train, y_train)

  y_pred = pipeline.predict(X_test)

  print("\n=== Classification report ===")
  print(classification_report(y_test, y_pred, digits=3))

  conn = get_db_connection(args.database_url)
  conn.autocommit = False
  run_id = None
  try:
    with conn.cursor() as cur:
      cur.execute(
        """
        INSERT INTO ml_training_runs (status, message)
        VALUES (%s, %s)
        RETURNING id
        """,
        ("running", None),
      )
      run_id = cur.fetchone()[0]
 
    proba = pipeline.predict_proba(X)[:, 1]
    summary = (
      pd.DataFrame({"championId": df["championId"], "prob": proba})
      .groupby("championId")
      .agg(mean=("prob", "mean"), count=("prob", "count"))
      .reset_index()
    )
 
    with conn.cursor() as cur:
      cur.execute(
        "DELETE FROM ml_predictions WHERE trainingRunId = %s",
        (run_id,),
      )
 
      insert_sql = """
        INSERT INTO ml_predictions (
          id,
          trainingRunId,
          matchId,
          participantPUuid,
          championId,
          queueId,
          teamId,
          winProbability,
          sampleCount
        ) VALUES %s
      """
 
      execute_values(
        cur,
        insert_sql,
        [
          (
            uuid.uuid4().hex,
            run_id,
            row.matchId,
            row.participantPUuid,
            row.championId,
            row.queueId,
            row.teamId,
            float(prob),
            None,
          )
          for row, prob in zip(df.itertuples(index=False), proba)
        ],
        page_size=1000,
      )

      execute_values(
        cur,
        insert_sql,
        [
          (
            uuid.uuid4().hex,
            run_id,
            None,
            None,
            row.championId,
            None,
            None,
            float(row.mean),
            int(row.count),
          )
          for row in summary.itertuples(index=False)
        ],
        page_size=500,
      )
 
      cur.execute(
        """
        UPDATE ml_training_runs
        SET status = %s, message = %s, finishedAt = NOW()
        WHERE id = %s
        """,
        ("completed", "Training finished", run_id),
      )

    conn.commit()
    print(f"ML_RUN_ID={run_id}")
  except Exception as error:
    conn.rollback()
    if run_id:
      with conn.cursor() as cur:
        cur.execute(
          """
          UPDATE ml_training_runs
          SET status = %s, message = %s, finishedAt = NOW()
          WHERE id = %s
          """,
          ("failed", str(error), run_id),
        )
      conn.commit()
    raise
  finally:
    conn.close()


if __name__ == "__main__":
  parser = argparse.ArgumentParser(description="Train Match Win Predictor")
  parser.add_argument("--data-path", type=Path, default=DATA_PATH)
  parser.add_argument(
    "--database-url",
    type=str,
    default=os.environ.get("DATABASE_URL"),
  )
  main(parser.parse_args())


