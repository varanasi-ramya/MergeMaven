"""Tests for the feature extraction pipeline."""

import json
from datetime import datetime

import pytest
from sqlalchemy import inspect

from api.db import get_engine, init_db, get_session_factory
from api.models import Base, Repository, PullRequest, PRFile, PRPairFeature
from features.pipeline import extract_all_pairs


@pytest.fixture
def session():
    engine = get_engine(":memory:")
    init_db(engine)
    factory = get_session_factory(engine)
    with factory() as s:
        yield s


def _add_pr(session, repo_id, number, files):
    pr = PullRequest(
        repo_id=repo_id,
        pr_number=number,
        title=f"PR #{number}",
        author="dev",
        created_at=datetime(2024, 1, number),
        lines_added=0,
        lines_deleted=0,
        files_changed=len(files),
    )
    session.add(pr)
    session.flush()
    for path, ranges in files.items():
        session.add(
            PRFile(
                pr_id=pr.id,
                file_path=path,
                lines_added=10,
                lines_deleted=5,
                line_ranges=json.dumps(ranges),
            )
        )
    session.commit()
    return pr


def test_extract_all_pairs_computes_features(session):
    repo = Repository(url="https://github.com/o/r", name="o/r")
    session.add(repo)
    session.flush()

    _add_pr(session, repo.id, 1, {"src/a.py": [[1, 10]]})
    _add_pr(session, repo.id, 2, {"src/a.py": [[5, 15]], "src/b.py": [[1, 5]]})
    _add_pr(session, repo.id, 3, {"docs/c.py": [[1, 5]]})

    features = extract_all_pairs(session, repo.id)
    assert len(features) == 3  # (1,2), (1,3), (2,3)

    by_pair = {(f.pr_a_id, f.pr_b_id): f for f in features}

    pr1 = session.query(PullRequest).filter_by(pr_number=1).one()
    pr2 = session.query(PullRequest).filter_by(pr_number=2).one()
    pr3 = session.query(PullRequest).filter_by(pr_number=3).one()

    # Pair (1,2): share src/a.py with line overlap
    key12 = tuple(sorted((pr1.id, pr2.id)))
    f12 = by_pair[key12]
    assert f12.file_overlap > 0.0
    assert f12.line_overlap > 0.0
    assert f12.module_overlap == pytest.approx(1.0)

    # Pair (1,3): no shared files
    key13 = tuple(sorted((pr1.id, pr3.id)))
    f13 = by_pair[key13]
    assert f13.file_overlap == 0.0
    assert f13.line_overlap == 0.0
    assert f13.module_overlap == pytest.approx(0.0)


def test_extract_all_pairs_single_pr(session):
    repo = Repository(url="https://github.com/o/r", name="o/r")
    session.add(repo)
    session.flush()
    _add_pr(session, repo.id, 1, {"src/a.py": [[1, 10]]})
    assert extract_all_pairs(session, repo.id) == []


def test_extract_all_pairs_no_prs(session):
    repo = Repository(url="https://github.com/o/r", name="o/r")
    session.add(repo)
    session.flush()
    assert extract_all_pairs(session, repo.id) == []