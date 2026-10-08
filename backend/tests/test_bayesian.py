"""Tests for the Bayesian conflict model."""

import os
import tempfile

import numpy as np
import pandas as pd
import pytest

from model.bayesian_network import (
    BayesianConflictModel,
    discretize_overlap,
    discretize_history_rate,
)


# --- discretization ---

def test_discretize_overlap_boundaries():
    assert discretize_overlap(0.0) == "Low"
    assert discretize_overlap(0.19) == "Low"
    assert discretize_overlap(0.21) == "Medium"
    assert discretize_overlap(0.49) == "Medium"
    assert discretize_overlap(0.51) == "High"
    assert discretize_overlap(1.0) == "High"


def test_discretize_history_rate_boundaries():
    assert discretize_history_rate(0.0) == "Low"
    assert discretize_history_rate(0.32) == "Low"
    assert discretize_history_rate(0.34) == "Medium"
    assert discretize_history_rate(0.65) == "Medium"
    assert discretize_history_rate(0.67) == "High"
    assert discretize_history_rate(1.0) == "High"


# --- model training and inference ---

def _make_separable_data():
    """High-overlap pairs always conflict; low-overlap pairs never do."""
    high = pd.DataFrame(
        {
            "file_overlap": [0.9] * 50,
            "line_overlap": [0.9] * 50,
            "history_conflict_rate": [0.9] * 50,
            "did_conflict": [True] * 50,
        }
    )
    low = pd.DataFrame(
        {
            "file_overlap": [0.0] * 50,
            "line_overlap": [0.0] * 50,
            "history_conflict_rate": [0.0] * 50,
            "did_conflict": [False] * 50,
        }
    )
    return pd.concat([high, low], ignore_index=True)


def test_model_structure():
    model = BayesianConflictModel()
    names = {model.bn.variable(i).name() for i in model.bn.nodes()}
    assert {"file_overlap", "line_overlap", "history_rate", "conflict"} == names
    # All three features point to the conflict node.
    arcs = list(model.bn.arcs())
    conflict_id = model.bn.idFromName("conflict")
    parents = {src for src, dst in arcs if dst == conflict_id}
    parent_names = {model.bn.variable(p).name() for p in parents}
    assert {"file_overlap", "line_overlap", "history_rate"} == parent_names


def test_model_untrained_raises():
    model = BayesianConflictModel()
    with pytest.raises(RuntimeError):
        model.predict_proba({"file_overlap": 0.5, "line_overlap": 0.5, "history_rate": 0.5})


def test_model_trains_and_predicts():
    df = _make_separable_data()
    model = BayesianConflictModel()
    model.fit(df)
    assert model.trained is True

    # High overlap -> higher conflict probability than low overlap.
    high = model.predict_proba(
        {"file_overlap": 0.9, "line_overlap": 0.9, "history_rate": 0.9}
    )
    low = model.predict_proba(
        {"file_overlap": 0.0, "line_overlap": 0.0, "history_rate": 0.0}
    )
    assert high > low
    assert high > 0.5
    assert low < 0.5


def test_model_risk_levels():
    df = _make_separable_data()
    model = BayesianConflictModel()
    model.fit(df)
    assert model.risk_level({"file_overlap": 0.9, "line_overlap": 0.9, "history_rate": 0.9}) == "High"
    assert model.risk_level({"file_overlap": 0.0, "line_overlap": 0.0, "history_rate": 0.0}) == "Low"


def test_model_save_and_load():
    df = _make_separable_data()
    model = BayesianConflictModel()
    model.fit(df)

    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "model.bif")
        model.save(path)
        loaded = BayesianConflictModel.load(path)
        assert loaded.trained is True
        prob = loaded.predict_proba(
            {"file_overlap": 0.9, "line_overlap": 0.9, "history_rate": 0.9}
        )
        assert prob > 0.5