"""Inference engine: predict conflict probability for PR pairs."""

from typing import Dict, List

from sqlalchemy.orm import Session

from api.models import PRPairFeature, Prediction, PullRequest
from model.bayesian_network import BayesianConflictModel


def predict_all_pairs(
    session: Session,
    repo_id: int,
    model: BayesianConflictModel,
) -> List[Prediction]:
    """Run the model over every stored PR pair and persist predictions."""
    features = (
        session.query(PRPairFeature)
        .join(PullRequest, PRPairFeature.pr_a_id == PullRequest.id)
        .filter(PullRequest.repo_id == repo_id)
        .all()
    )

    predictions: List[Prediction] = []
    for feat in features:
        prob = model.predict_proba(
            {
                "file_overlap": feat.file_overlap,
                "line_overlap": feat.line_overlap,
                "history_rate": feat.history_conflict_rate,
            }
        )
        record = Prediction(
            pr_a_id=feat.pr_a_id,
            pr_b_id=feat.pr_b_id,
            conflict_probability=prob,
            risk_level=model.risk_level(
                {
                    "file_overlap": feat.file_overlap,
                    "line_overlap": feat.line_overlap,
                    "history_rate": feat.history_conflict_rate,
                }
            ),
            confidence=abs(prob - 0.5) * 2,  # 0 = unsure, 1 = certain
        )
        session.add(record)
        predictions.append(record)

    session.commit()
    return predictions


def predict_pair(model: BayesianConflictModel, features: Dict[str, float]) -> Dict:
    """Predict for a single feature dict (used by the CLI and tests)."""
    prob = model.predict_proba(features)
    return {
        "conflict_probability": prob,
        "risk_level": model.risk_level(features),
        "confidence": abs(prob - 0.5) * 2,
        "will_conflict": prob >= 0.5,
    }