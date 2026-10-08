"""Bayesian Network wrapper for conflict prediction.

The network has four nodes:

    file_overlap     -> conflict
    line_overlap     -> conflict
    history_rate     -> conflict

Each feature is discretized into Low / Medium / High labels. The `conflict`
node is binary (No / Yes). Conditional probability tables (CPTs) are learned
from a labeled dataset via pyAgrum.
"""

from typing import Dict, List

import numpy as np
import pandas as pd
import pyagrum as gum


FEATURE_LABELS = ["Low", "Medium", "High"]
CONFLICT_LABELS = ["No", "Yes"]

# Thresholds used to discretize continuous overlap features into labels.
OVERLAP_LOW_MAX = 0.2
OVERLAP_MEDIUM_MAX = 0.5


def discretize_overlap(value: float) -> str:
    """Map a continuous overlap value to Low / Medium / High."""
    if value <= OVERLAP_LOW_MAX:
        return "Low"
    if value <= OVERLAP_MEDIUM_MAX:
        return "Medium"
    return "High"


def discretize_history_rate(value: float) -> str:
    """Map a continuous historical conflict rate to Low / Medium / High."""
    if value <= 0.33:
        return "Low"
    if value <= 0.66:
        return "Medium"
    return "High"


class BayesianConflictModel:
    """A small belief network for predicting merge conflicts."""

    def __init__(self, name: str = "MergeConflict") -> None:
        self.name = name
        self._bn = self._build_structure()
        self._trained = False

    def _build_structure(self) -> gum.BayesNet:
        bn = gum.BayesNet(self.name)
        bn.add(gum.LabelizedVariable("file_overlap", "", FEATURE_LABELS))
        bn.add(gum.LabelizedVariable("line_overlap", "", FEATURE_LABELS))
        bn.add(gum.LabelizedVariable("history_rate", "", FEATURE_LABELS))
        bn.add(gum.LabelizedVariable("conflict", "", CONFLICT_LABELS))
        bn.addArc("file_overlap", "conflict")
        bn.addArc("line_overlap", "conflict")
        bn.addArc("history_rate", "conflict")
        return bn

    @property
    def bn(self) -> gum.BayesNet:
        return self._bn

    @property
    def trained(self) -> bool:
        return self._trained

    def fit(self, df: pd.DataFrame) -> None:
        """Learn CPTs from a labeled DataFrame.

        The DataFrame must contain the raw continuous columns
        (file_overlap, line_overlap, history_conflict_rate) and a boolean
        `did_conflict` column. Discretization happens inside this method.
        """
        data = df.copy()
        data["file_overlap"] = data["file_overlap"].apply(discretize_overlap)
        data["line_overlap"] = data["line_overlap"].apply(discretize_overlap)
        data["history_rate"] = data["history_conflict_rate"].apply(discretize_history_rate)
        data["conflict"] = data["did_conflict"].map({True: "Yes", False: "No"})

        learner = gum.BNLearner(data, self._bn)
        learner.useSmoothingPrior(1.0)  # Laplace smoothing
        learner.fitParameters(self._bn)
        self._trained = True

    def predict_proba(self, features: Dict[str, float]) -> float:
        """Return P(conflict=Yes) for the given raw continuous features."""
        self._check_trained()
        evidence = {
            "file_overlap": discretize_overlap(features["file_overlap"]),
            "line_overlap": discretize_overlap(features["line_overlap"]),
            "history_rate": discretize_history_rate(features["history_rate"]),
        }
        return self.predict_proba_discrete(evidence)

    def predict_proba_discrete(self, evidence: Dict[str, str]) -> float:
        """Return P(conflict=Yes) given already-discretized feature labels."""
        self._check_trained()
        ie = gum.LazyPropagation(self._bn)
        ie.setEvidence(evidence)
        ie.makeInference()
        posterior = ie.posterior(self._bn.idFromName("conflict"))
        # posterior.tolist() returns [P(No), P(Yes)] in CONFLICT_LABELS order.
        return float(posterior.tolist()[1])

    def predict(self, features: Dict[str, float], threshold: float = 0.5) -> bool:
        """Return True if the predicted conflict probability exceeds threshold."""
        return self.predict_proba(features) >= threshold

    def risk_level(self, features: Dict[str, float]) -> str:
        """Categorize a PR pair as High / Moderate / Low risk."""
        prob = self.predict_proba(features)
        if prob >= 0.66:
            return "High"
        if prob >= 0.33:
            return "Moderate"
        return "Low"

    def _check_trained(self) -> None:
        if not self._trained:
            raise RuntimeError("Model is not trained. Call fit() first.")

    def save(self, path: str) -> str:
        """Serialize the network to a .bif file."""
        gum.saveBN(self._bn, path)
        return path

    @classmethod
    def load(cls, path: str) -> "BayesianConflictModel":
        """Load a serialized network from a .bif file."""
        model = cls.__new__(cls)
        model.name = "MergeConflict"
        model._bn = gum.loadBN(path)
        model._trained = True
        return model