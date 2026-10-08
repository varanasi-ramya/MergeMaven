"""Tests for the SQLite schema and database initialization."""

import pytest
from sqlalchemy import inspect

from api.db import get_engine, init_db, get_session_factory
from api.models import (
    Base,
    Repository,
    PullRequest,
    PRFile,
    PRPairFeature,
    Prediction,
    HistoricalMerge,
)


@pytest.fixture
def engine():
    eng = get_engine(":memory:")
    init_db(eng)
    return eng


def test_all_tables_exist(engine):
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    expected = {
        "repositories",
        "pull_requests",
        "pr_files",
        "pr_pair_features",
        "predictions",
        "historical_merges",
    }
    assert expected.issubset(set(tables))


def test_repository_table_columns(engine):
    inspector = inspect(engine)
    cols = {c["name"] for c in inspector.get_columns("repositories")}
    assert {"id", "url", "name", "last_analyzed"}.issubset(cols)


def test_pull_request_table_columns(engine):
    inspector = inspect(engine)
    cols = {c["name"] for c in inspector.get_columns("pull_requests")}
    assert {
        "id",
        "repo_id",
        "pr_number",
        "title",
        "author",
        "created_at",
        "lines_added",
        "lines_deleted",
        "files_changed",
    }.issubset(cols)


def test_pr_pair_features_table_columns(engine):
    inspector = inspect(engine)
    cols = {c["name"] for c in inspector.get_columns("pr_pair_features")}
    assert {
        "id",
        "pr_a_id",
        "pr_b_id",
        "file_overlap",
        "line_overlap",
        "module_overlap",
        "history_conflict_rate",
    }.issubset(cols)


def test_predictions_table_columns(engine):
    inspector = inspect(engine)
    cols = {c["name"] for c in inspector.get_columns("predictions")}
    assert {
        "id",
        "pr_a_id",
        "pr_b_id",
        "conflict_probability",
        "risk_level",
        "confidence",
        "predicted_at",
    }.issubset(cols)


def test_historical_merges_table_columns(engine):
    inspector = inspect(engine)
    cols = {c["name"] for c in inspector.get_columns("historical_merges")}
    assert {
        "id",
        "repo_id",
        "pr_a_number",
        "pr_b_number",
        "did_conflict",
        "merged_at",
    }.issubset(cols)


def test_can_insert_and_query_repository(engine):
    session_factory = get_session_factory(engine)
    with session_factory() as session:
        repo = Repository(url="https://github.com/psf/requests", name="psf/requests")
        session.add(repo)
        session.commit()
        fetched = session.query(Repository).filter_by(url="https://github.com/psf/requests").first()
        assert fetched is not None
        assert fetched.name == "psf/requests"


def test_pull_request_relationship(engine):
    session_factory = get_session_factory(engine)
    with session_factory() as session:
        repo = Repository(url="https://github.com/psf/requests", name="psf/requests")
        session.add(repo)
        session.flush()
        pr = PullRequest(
            repo_id=repo.id,
            pr_number=42,
            title="Fix bug",
            author="alice",
            lines_added=10,
            lines_deleted=2,
            files_changed=1,
        )
        session.add(pr)
        session.flush()
        session.add(PRFile(pr_id=pr.id, file_path="src/main.py", lines_added=10, lines_deleted=2))
        session.commit()
        fetched = session.query(PullRequest).filter_by(pr_number=42).first()
        assert fetched is not None
        assert fetched.files[0].file_path == "src/main.py"