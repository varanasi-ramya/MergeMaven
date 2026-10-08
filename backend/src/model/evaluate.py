"""Evaluate the Bayesian conflict model against a labeled test set."""

from typing import Dict, List, Tuple

import numpy as np
import pandas as pd

from model.bayesian_network import BayesianConflictModel


def evaluate(
    model: BayesianConflictModel, test_df: pd.DataFrame, threshold: float = 0.5
) -> Dict[str, float]:
    """Compute accuracy, precision, recall, and F1 for the model.

    The test DataFrame must contain raw continuous feature columns plus a
    boolean `did_conflict` column.
    """
    y_true: List[int] = []
    y_pred: List[int] = []
    for _, row in test_df.iterrows():
        features = {
            "file_overlap": float(row["file_overlap"]),
            "line_overlap": float(row["line_overlap"]),
            "history_rate": float(row["history_conflict_rate"]),
        }
        prob = model.predict_proba(features)
        y_true.append(1 if bool(row["did_conflict"]) else 0)
        y_pred.append(1 if prob >= threshold else 0)

    y_true_arr = np.array(y_true)
    y_pred_arr = np.array(y_pred)

    tp = int(((y_true_arr == 1) & (y_pred_arr == 1)).sum())
    tn = int(((y_true_arr == 0) & (y_pred_arr == 0)).sum())
    fp = int(((y_true_arr == 0) & (y_pred_arr == 1)).sum())
    fn = int(((y_true_arr == 1) & (y_pred_arr == 0)).sum())

    accuracy = (tp + tn) / len(y_true_arr) if y_true_arr.size else 0.0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (
        2 * precision * recall / (precision + recall)
        if (precision + recall) > 0
        else 0.0
    )

    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "tp": tp,
        "tn": tn,
        "fp": fp,
        "fn": fn,
    }


def cross_validate(
    df: pd.DataFrame, folds: int = 5, threshold: float = 0.5
) -> Dict[str, float]:
    """Run k-fold cross-validation and return mean metrics."""
    from sklearn.model_selection import KFold

    kf = KFold(n_splits=folds, shuffle=True, random_state=42)
    accuracies = []
    for train_idx, test_idx in kf.split(df):
        train_df = df.iloc[train_idx]
        test_df = df.iloc[test_idx]
        model = BayesianConflictModel()
        model.fit(train_df)
        metrics = evaluate(model, test_df, threshold)
        accuracies.append(metrics["accuracy"])

    return {
        "mean_accuracy": float(np.mean(accuracies)) if accuracies else 0.0,
        "std_accuracy": float(np.std(accuracies)) if accuracies else 0.0,
        "folds": folds,
    }