import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

DATA_PATH = Path("ml/data/match_participants.csv")
MODEL_PATH = Path("ml/models/champion_win_predictor.joblib")
OUTPUT_PATH = Path("ml/output/predictions.json")


def load_dataset(path: Path) -> pd.DataFrame:
  if not path.exists():
    raise FileNotFoundError(
      f"Dataset introuvable: {path}. Lance `pnpm ml:export` avant la prédiction."
    )

  df = pd.read_csv(path)
  df = df.dropna(subset=["win"])
  df["vision_per_min"] = df["visionScore"] / np.maximum(df["gameDuration"], 1)
  df["damage_per_min"] = df["totalDamageDealtToChampions"] / np.maximum(
    df["gameDuration"], 1
  )
  df["gold_per_min"] = df["goldEarned"] / np.maximum(df["gameDuration"], 1)
  df["kda"] = (df["kills"] + df["assists"]) / np.maximum(df["deaths"], 1)
  return df.fillna(0)


def main(args: argparse.Namespace):
  model = joblib.load(args.model_path)
  df = load_dataset(args.data_path)

  feature_columns = [col for col in df.columns if col not in {"win"}]
  X = df[feature_columns]

  proba = model.predict_proba(X)[:, 1]

  df_output = df[[
    "matchId",
    "participantPUuid",
    "championId",
    "queueId",
    "teamId",
  ]].copy()
  df_output["win_probability"] = proba

  df_summary = (
    df_output.groupby("championId")["win_probability"].agg([
      ("mean", "mean"),
      ("count", "count"),
    ]).reset_index()
  )

  args.output_path.parent.mkdir(parents=True, exist_ok=True)
  payload = {
    "generatedAt": pd.Timestamp.utcnow().isoformat(),
    "byMatch": df_output.to_dict(orient="records"),
    "byChampion": df_summary.to_dict(orient="records"),
  }

  args.output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
  print(f"Prédictions sauvegardées -> {args.output_path}")


if __name__ == "__main__":
  parser = argparse.ArgumentParser(description="Predict match win probabilities")
  parser.add_argument("--data-path", type=Path, default=DATA_PATH)
  parser.add_argument("--model-path", type=Path, default=MODEL_PATH)
  parser.add_argument("--output-path", type=Path, default=OUTPUT_PATH)
  main(parser.parse_args())


