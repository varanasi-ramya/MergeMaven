"""Render a PR-to-PR conflict risk heatmap using matplotlib."""

from typing import Dict, List, Optional, Tuple

import matplotlib
matplotlib.use("Agg")  # headless rendering
import matplotlib.pyplot as plt
import numpy as np
from sqlalchemy.orm import Session

from api.models import Prediction, PullRequest


def render_heatmap(
    session: Session,
    repo_id: int,
    output_path: str,
    title: str = "PR Conflict Risk Heatmap",
) -> str:
    """Render an N x N heatmap of conflict probabilities and save it.

    Returns the output path. The file is written as a PNG.
    """
    prs = (
        session.query(PullRequest)
        .filter(PullRequest.repo_id == repo_id)
        .order_by(PullRequest.pr_number)
        .all()
    )
    if len(prs) < 2:
        # Render a minimal placeholder image so the caller always gets a file.
        fig, ax = plt.subplots(figsize=(4, 2))
        ax.text(0.5, 0.5, "Not enough PRs", ha="center", va="center")
        ax.axis("off")
        fig.savefig(output_path, dpi=100, bbox_inches="tight")
        plt.close(fig)
        return output_path

    labels = [f"PR#{pr.pr_number}" for pr in prs]
    index = {pr.id: i for i, pr in enumerate(prs)}
    n = len(prs)
    matrix = np.zeros((n, n))

    predictions = (
        session.query(Prediction)
        .filter(
            Prediction.pr_a_id.in_([pr.id for pr in prs]),
            Prediction.pr_b_id.in_([pr.id for pr in prs]),
        )
        .all()
    )
    for pred in predictions:
        i = index.get(pred.pr_a_id)
        j = index.get(pred.pr_b_id)
        if i is None or j is None:
            continue
        val = float(pred.conflict_probability)
        matrix[i, j] = val
        matrix[j, i] = val

    fig, ax = plt.subplots(figsize=(max(6, n * 0.8), max(6, n * 0.8)))
    im = ax.imshow(matrix, cmap="Reds", vmin=0, vmax=1)

    ax.set_xticks(range(n))
    ax.set_yticks(range(n))
    ax.set_xticklabels(labels, rotation=45, ha="right")
    ax.set_yticklabels(labels)

    # Annotate each cell with the probability.
    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            ax.text(j, i, f"{matrix[i, j]:.2f}", ha="center", va="center", fontsize=8)

    ax.set_title(title)
    fig.colorbar(im, ax=ax, label="Conflict probability")
    fig.tight_layout()
    fig.savefig(output_path, dpi=100, bbox_inches="tight")
    plt.close(fig)
    return output_path