"""Feature extraction pipeline for all PR pairs."""

import json
from typing import Dict, List, Tuple

from sqlalchemy.orm import Session

from api.models import PullRequest, PRFile, PRPairFeature
from features.file_overlap import file_overlap
from features.line_overlap import line_overlap
from features.module_overlap import module_overlap
from features.history import historical_conflict_rate


def _pr_files(session: Session, pr: PullRequest) -> Tuple[Dict[str, List], List[str]]:
    """Return (file_path -> line_ranges, list_of_file_paths) for a PR."""
    records = session.query(PRFile).filter(PRFile.pr_id == pr.id).all()
    ranges: Dict[str, List] = {}
    paths: List[str] = []
    for rec in records:
        ranges[rec.file_path] = rec.line_ranges
        paths.append(rec.file_path)
    return ranges, paths


def _pair_key(a: int, b: int) -> Tuple[int, int]:
    """Canonical (smaller, larger) ordering for a PR pair."""
    return (a, b) if a < b else (b, a)


def extract_all_pairs(session: Session, repo_id: int) -> List[PRPairFeature]:
    """Compute overlap features for every unordered pair of open PRs.

    Results are upserted into the `pr_pair_features` table and returned.
    """
    prs = (
        session.query(PullRequest)
        .filter(PullRequest.repo_id == repo_id)
        .order_by(PullRequest.pr_number)
        .all()
    )
    if len(prs) < 2:
        return []

    # Cache file data per PR to avoid repeated queries.
    cache: Dict[int, Tuple[Dict[str, List], List[str]]] = {}
    for pr in prs:
        cache[pr.id] = _pr_files(session, pr)

    features: List[PRPairFeature] = []
    for i, pr_a in enumerate(prs):
        ranges_a, paths_a = cache[pr_a.id]
        for pr_b in prs[i + 1:]:
            ranges_b, paths_b = cache[pr_b.id]

            key = _pair_key(pr_a.id, pr_b.id)
            existing = (
                session.query(PRPairFeature)
                .filter(PRPairFeature.pr_a_id == key[0], PRPairFeature.pr_b_id == key[1])
                .first()
            )
            record = existing or PRPairFeature(
                pr_a_id=key[0], pr_b_id=key[1]
            )

            record.file_overlap = file_overlap(paths_a, paths_b)
            record.line_overlap = line_overlap(ranges_a, ranges_b)
            record.module_overlap = module_overlap(paths_a, paths_b)
            record.history_conflict_rate = historical_conflict_rate(
                session, repo_id, paths_a, paths_b
            )

            if existing is None:
                session.add(record)
            features.append(record)

    session.commit()
    return features