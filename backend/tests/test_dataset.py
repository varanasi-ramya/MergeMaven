"""Tests for the labeled dataset builder (mocked simulator)."""

from datetime import datetime

import pytest

from api.db import get_engine, init_db, get_session_factory
from api.models import Repository, PullRequest, HistoricalMerge
from features import dataset
from features.dataset import build_labeled_dataset, save_dataset


class FakeSimulator:
    """Stand-in for MergeSimulator that records calls."""

    def __init__(self):
        self.cleaned_up = False

    def cleanup(self):
        self.cleaned_up = True


@pytest.fixture
def session():
    engine = get_engine(":memory:")
    init_db(engine)
    factory = get_session_factory(engine)
    with factory() as s:
        yield s


def test_build_labeled_dataset_uses_historical(session):
    repo = Repository(url="https://github.com/o/r", name="o/r")
    session.add(repo)
    session.flush()
    session.add(HistoricalMerge(repo_id=repo.id, pr_a_number=1, pr_b_number=2, did_conflict=True, merged_at=datetime(2024, 1, 1)))
    session.add(HistoricalMerge(repo_id=repo.id, pr_a_number=3, pr_b_number=4, did_conflict=False, merged_at=datetime(2024, 1, 2)))
    session.commit()

    sim = FakeSimulator()
    samples = build_labeled_dataset(session, repo.id, "https://github.com/o/r", simulator=sim)
    assert len(samples) == 2
    assert samples[0]["did_conflict"] is True
    assert samples[1]["did_conflict"] is False
    assert samples[0]["source"] == "historical"
    # The fake simulator should not be cleaned up since we passed it in.
    assert sim.cleaned_up is False


def test_build_labeled_dataset_no_prs(session):
    repo = Repository(url="https://github.com/o/r", name="o/r")
    session.add(repo)
    session.flush()
    sim = FakeSimulator()
    samples = build_labeled_dataset(session, repo.id, "https://github.com/o/r", simulator=sim)
    assert samples == []


def test_save_dataset_writes_json(tmp_path):
    samples = [{"a": 1}, {"b": 2}]
    path = save_dataset(samples, str(tmp_path / "out" / "data.json"))
    import json
    with open(path) as f:
        loaded = json.load(f)
    assert loaded == samples