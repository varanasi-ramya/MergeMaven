"""Report generation: text and JSON outputs for CI/CD integration."""

import json
from datetime import datetime
from typing import Dict, List

from sqlalchemy.orm import Session

from api.models import Prediction, PullRequest, Repository
from planning.merge_order import build_merge_order, merge_order_summary


def generate_text_report(session: Session, repo_id: int) -> str:
    """Return a human-readable text report for the repository."""
    repo = session.query(Repository).filter_by(id=repo_id).first()
    repo_label = repo.url if repo else f"repo_id={repo_id}"

    prs = (
        session.query(PullRequest)
        .filter(PullRequest.repo_id == repo_id)
        .order_by(PullRequest.pr_number)
        .all()
    )
    predictions = (
        session.query(Prediction)
        .filter(
            Prediction.pr_a_id.in_([pr.id for pr in prs]),
            Prediction.pr_b_id.in_([pr.id for pr in prs]),
        )
        .all()
    )

    lines = []
    lines.append(f"MergeGuard Conflict Report")
    lines.append(f"Repository: {repo_label}")
    lines.append(f"Generated: {datetime.utcnow().isoformat()}Z")
    lines.append(f"Open PRs: {len(prs)}")
    lines.append("")

    if not predictions:
        lines.append("No conflict predictions available.")
        return "\n".join(lines)

    lines.append("Predicted PR Pair Conflicts:")
    lines.append("-" * 40)
    pr_by_id = {pr.id: pr for pr in prs}
    for pred in sorted(predictions, key=lambda p: -p.conflict_probability):
        a = pr_by_id.get(pred.pr_a_id)
        b = pr_by_id.get(pred.pr_b_id)
        if not a or not b:
            continue
        lines.append(
            f"PR #{a.pr_number} <-> PR #{b.pr_number}: "
            f"{pred.conflict_probability:.2f} ({pred.risk_level}) "
            f"confidence={pred.confidence:.2f}"
        )

    lines.append("")
    lines.append("Recommended Merge Order:")
    lines.append("-" * 40)
    order = build_merge_order(session, repo_id)
    lines.append(merge_order_summary(order))
    return "\n".join(lines)


def generate_json_report(session: Session, repo_id: int) -> Dict:
    """Return a machine-readable report dictionary for CI/CD integration."""
    repo = session.query(Repository).filter_by(id=repo_id).first()
    prs = (
        session.query(PullRequest)
        .filter(PullRequest.repo_id == repo_id)
        .order_by(PullRequest.pr_number)
        .all()
    )
    predictions = (
        session.query(Prediction)
        .filter(
            Prediction.pr_a_id.in_([pr.id for pr in prs]),
            Prediction.pr_b_id.in_([pr.id for pr in prs]),
        )
        .all()
    )
    pr_by_id = {pr.id: pr for pr in prs}

    pairs = []
    for pred in predictions:
        a = pr_by_id.get(pred.pr_a_id)
        b = pr_by_id.get(pred.pr_b_id)
        if not a or not b:
            continue
        pairs.append(
            {
                "pr_a": a.pr_number,
                "pr_b": b.pr_number,
                "conflict_probability": pred.conflict_probability,
                "risk_level": pred.risk_level,
                "confidence": pred.confidence,
            }
        )

    order = build_merge_order(session, repo_id)
    return {
        "repository": repo.url if repo else None,
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "open_pr_count": len(prs),
        "predictions": pairs,
        "merge_order": [
            {"pr_number": num, "title": title, "conflict_score": score}
            for num, title, score in order
        ],
    }


def save_json_report(session: Session, repo_id: int, path: str) -> str:
    """Write the JSON report to disk and return the path."""
    import os

    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    report = generate_json_report(session, repo_id)
    with open(path, "w") as f:
        json.dump(report, f, indent=2)
    return path