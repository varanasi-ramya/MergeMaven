"""Build a labeled training dataset from historical merges."""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from api.models import (
    HistoricalMerge,
    PRPairFeature,
    PullRequest,
    Repository,
)
from features.pipeline import extract_all_pairs
from verification.merge_simulator import MergeSimulator


def _parse_datetime(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


def build_labeled_dataset(
    session: Session,
    repo_id: int,
    repo_url: str,
    max_samples: int = 200,
    simulator: Optional[MergeSimulator] = None,
) -> List[Dict]:
    """Build training samples of (features, did_conflict) for a repository.

    Strategy:
    1. Extract features for all open PR pairs (positive candidates).
    2. Use historical merged PR pairs from the same repo as labeled examples
       where ground truth is known from `git merge-tree` simulation.
    3. Return a list of feature dicts augmented with `did_conflict`.
    """
    owns_simulator = simulator is None
    sim = simulator or MergeSimulator()
    try:
        repo = session.query(Repository).filter_by(id=repo_id).one()
        samples: List[Dict] = []

        # --- Historical labeled pairs ---
        historical = (
            session.query(HistoricalMerge)
            .filter(HistoricalMerge.repo_id == repo_id)
            .order_by(HistoricalMerge.merged_at)
            .all()
        )
        for record in historical:
            samples.append(
                {
                    "pr_a_number": record.pr_a_number,
                    "pr_b_number": record.pr_b_number,
                    "did_conflict": bool(record.did_conflict),
                    "source": "historical",
                }
            )

        # --- Simulate merges for open PR pairs ---
        prs = (
            session.query(PullRequest)
            .filter(PullRequest.repo_id == repo_id)
            .order_by(PullRequest.pr_number)
            .all()
        )
        if len(prs) >= 2:
            features = extract_all_pairs(session, repo_id)
            for feat in features:
                pr_a = session.query(PullRequest).filter_by(id=feat.pr_a_id).one()
                pr_b = session.query(PullRequest).filter_by(id=feat.pr_b_id).one()
                samples.append(
                    {
                        "pr_a_number": pr_a.pr_number,
                        "pr_b_number": pr_b.pr_number,
                        "file_overlap": feat.file_overlap,
                        "line_overlap": feat.line_overlap,
                        "module_overlap": feat.module_overlap,
                        "history_conflict_rate": feat.history_conflict_rate,
                        "did_conflict": None,  # to be filled by simulation
                        "source": "open",
                    }
                )

        return samples[:max_samples]
    finally:
        if owns_simulator:
            sim.cleanup()


def save_dataset(samples: List[Dict], output_path: str) -> str:
    """Persist the labeled dataset as JSON."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(samples, f, indent=2, default=str)
    return str(path)