"""Train the Bayesian conflict model from a labeled dataset."""

import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import pandas as pd

from model.bayesian_network import BayesianConflictModel


def load_training_data(path: str) -> pd.DataFrame:
    """Load a labeled dataset JSON file into a DataFrame."""
    with open(path) as f:
        records = json.load(f)
    return pd.DataFrame(records)


def train_model(
    data_path: str,
    model_path: Optional[str] = None,
) -> Tuple[BayesianConflictModel, pd.DataFrame]:
    """Train the model on the dataset at `data_path`.

    Returns (model, dataframe). If `model_path` is provided the trained
    network is serialized to that path.
    """
    df = load_training_data(data_path)
    model = BayesianConflictModel()
    model.fit(df)
    if model_path:
        model.save(model_path)
    return model, df


def generate_training_data(
    samples: List[Dict], output_path: str
) -> str:
    """Persist a list of feature dicts as a JSON training file."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(samples, f, indent=2, default=str)
    return str(path)