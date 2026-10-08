"""Optimal merge order planning.

Builds a conflict graph where PRs are nodes and conflict probability is the
edge weight, then produces a merge sequence that minimizes conflicts by
merging low-risk PRs first and deferring high-conflict pairs.
"""

from typing import Dict, List, Tuple

from sqlalchemy.orm import Session

from api.models import Prediction, PullRequest


def build_merge_order(
    session: Session,
    repo_id: int,
    threshold: float = 0.5,
) -> List[Tuple[int, str, float]]:
    """Return an ordered list of (pr_number, title, conflict_score) tuples.

    PRs are ordered so that:
    1. PRs with no predicted conflicts go first.
    2. PRs with low conflict probability go next.
    3. PRs involved in high-conflict pairs go last, one at a time.
    """
    prs = (
        session.query(PullRequest)
        .filter(PullRequest.repo_id == repo_id)
        .order_by(PullRequest.pr_number)
        .all()
    )
    if not prs:
        return []

    pr_by_id = {pr.id: pr for pr in prs}

    # Aggregate the maximum conflict probability each PR participates in.
    max_conflict: Dict[int, float] = {pr.id: 0.0 for pr in prs}
    predictions = (
        session.query(Prediction)
        .filter(
            Prediction.pr_a_id.in_([pr.id for pr in prs]),
            Prediction.pr_b_id.in_([pr.id for pr in prs]),
        )
        .all()
    )
    for pred in predictions:
        weight = float(pred.conflict_probability)
        max_conflict[pred.pr_a_id] = max(max_conflict[pred.pr_a_id], weight)
        max_conflict[pred.pr_b_id] = max(max_conflict[pred.pr_b_id], weight)

    # Sort by risk score ascending: safe PRs first.
    ordered = sorted(prs, key=lambda pr: max_conflict[pr.id])
    return [
        (pr.pr_number, pr.title or "", max_conflict[pr.id])
        for pr in ordered
    ]


def merge_order_summary(order: List[Tuple[int, str, float]]) -> str:
    """Format a merge order as a human-readable sequence string."""
    if not order:
        return "No PRs to merge."
    parts = []
    for idx, (number, _title, score) in enumerate(order, start=1):
        risk = "high" if score >= 0.66 else ("moderate" if score >= 0.33 else "low")
        parts.append(f"{idx}. Merge PR #{number} ({risk} risk, score={score:.2f})")
    return "\n".join(parts)