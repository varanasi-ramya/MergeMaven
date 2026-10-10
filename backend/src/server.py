"""
Flask REST API server for MergeMaven.

Pipeline per analyze request:
  1. Fetch open PRs from GitHub → store in SQLite
  2. Extract pairwise features (file/line/module overlap, history rate)
  3. Run Bayesian conflict model → store Prediction rows
  4. Return structured JSON to the frontend

Endpoints:
  POST /api/analyze       { repo_url, token? }  →  trigger full pipeline
  GET  /api/conflicts     ?repo_url=…            →  stored predictions
  GET  /api/prs           ?repo_url=…            →  open PRs for a repo
  GET  /api/merge-order   ?repo_url=…            →  recommended merge sequence
  GET  /api/health                               →  liveness probe
"""

import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

# ── make sure src/ is on the path so relative imports work ──────────────────
SRC = Path(__file__).resolve().parent
sys.path.insert(0, str(SRC))

from api.db import get_engine, init_db, get_session_factory
from api.models import Repository, PullRequest, PRFile, Prediction, PRPairFeature
from github_client.pr_fetcher import PRFetcher
from features.pipeline import extract_all_pairs
from model.bayesian_network import BayesianConflictModel
from model.predict import predict_all_pairs
from planning.merge_order import build_merge_order

# ── Flask setup ──────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)

MODEL_PATH = SRC / "model" / "model.bif"

# ── helpers ──────────────────────────────────────────────────────────────────

def _get_engine_and_session():
    engine = get_engine()
    init_db(engine)
    return engine, get_session_factory(engine)


def _parse_dt(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


def _get_or_create_repo(session, repo_url: str) -> Repository:
    repo = session.query(Repository).filter_by(url=repo_url).first()
    if not repo:
        repo = Repository(url=repo_url, name=repo_url.rstrip("/").split("/")[-1])
        session.add(repo)
        session.flush()
    return repo


def _risk_label(prob: float) -> str:
    if prob >= 0.66:
        return "HIGH"
    if prob >= 0.33:
        return "MODERATE"
    return "LOW"


def _load_model() -> BayesianConflictModel | None:
    if MODEL_PATH.exists():
        try:
            m = BayesianConflictModel.load(str(MODEL_PATH))
            if m.trained:
                return m
        except Exception as exc:
            log.warning("Could not load model: %s", exc)
    return None


def _simple_prob(feat: PRPairFeature) -> float:
    """
    Fallback heuristic when no trained model exists:
    weighted combination of file and line overlap.
    """
    return round(min(1.0, feat.file_overlap * 0.6 + feat.line_overlap * 0.4), 4)


# ── routes ───────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/api/analyze")
def analyze():
    """
    Trigger full pipeline for a repo.
    Body: { "repo_url": "https://github.com/owner/repo", "token": "ghp_..." }
    """
    body = request.get_json(silent=True) or {}
    repo_url = (body.get("repo_url") or "").strip()
    token = body.get("token") or os.environ.get("GITHUB_TOKEN")

    if not repo_url:
        return jsonify({"error": "repo_url is required"}), 400

    log.info("Analyze request for %s", repo_url)

    engine, session_factory = _get_engine_and_session()

    # ── 1. Fetch PRs from GitHub ──────────────────────────────────────────
    try:
        fetcher = PRFetcher(token=token)
        prs_data = fetcher.fetch(repo_url)
    except Exception as exc:
        msg = str(exc)
        if "rate limit" in msg.lower():
            return jsonify({"error": "GitHub rate limit exceeded. Provide a token."}), 429
        if "404" in msg or "Not Found" in msg:
            return jsonify({"error": f"Repository not found: {repo_url}"}), 404
        return jsonify({"error": f"GitHub error: {msg}"}), 502

    if not prs_data:
        return jsonify({
            "repo_url": repo_url,
            "pr_count": 0,
            "conflict_count": 0,
            "conflicts": [],
            "prs": [],
            "merge_order": [],
            "message": "No open PRs found in this repository.",
        })

    with session_factory() as session:
        repo = _get_or_create_repo(session, repo_url)

        # ── 2. Store / upsert PRs ─────────────────────────────────────────
        for pr_data in prs_data:
            existing = (
                session.query(PullRequest)
                .filter_by(repo_id=repo.id, pr_number=pr_data["pr_number"])
                .first()
            )
            if existing:
                pr_record = existing
            else:
                pr_record = PullRequest(
                    repo_id=repo.id,
                    pr_number=pr_data["pr_number"],
                    title=pr_data["title"],
                    author=pr_data["author"],
                    created_at=_parse_dt(pr_data.get("created_at")),
                    lines_added=pr_data.get("lines_added", 0),
                    lines_deleted=pr_data.get("lines_deleted", 0),
                    files_changed=pr_data.get("files_changed", 0),
                )
                session.add(pr_record)
                session.flush()

            # Clear and re-insert files so they stay current
            session.query(PRFile).filter_by(pr_id=pr_record.id).delete()
            for f in pr_data.get("files", []):
                session.add(PRFile(
                    pr_id=pr_record.id,
                    file_path=f["filename"],
                    lines_added=f["additions"],
                    lines_deleted=f["deletions"],
                    line_ranges=json.dumps([]),
                ))
        session.commit()

        # ── 3. Extract pairwise features ──────────────────────────────────
        extract_all_pairs(session, repo.id)

        # ── 4. Run model (or heuristic) to produce predictions ────────────
        # Delete stale predictions for this repo first
        pr_ids = [pr.id for pr in session.query(PullRequest).filter_by(repo_id=repo.id).all()]
        session.query(Prediction).filter(
            Prediction.pr_a_id.in_(pr_ids)
        ).delete(synchronize_session=False)
        session.commit()

        model = _load_model()
        if model:
            predict_all_pairs(session, repo.id, model)
        else:
            # Heuristic fallback
            features = (
                session.query(PRPairFeature)
                .join(PullRequest, PRPairFeature.pr_a_id == PullRequest.id)
                .filter(PullRequest.repo_id == repo.id)
                .all()
            )
            for feat in features:
                prob = _simple_prob(feat)
                session.add(Prediction(
                    pr_a_id=feat.pr_a_id,
                    pr_b_id=feat.pr_b_id,
                    conflict_probability=prob,
                    risk_level=_risk_label(prob),
                    confidence=abs(prob - 0.5) * 2,
                ))
            session.commit()

        # ── 5. Assemble response ──────────────────────────────────────────
        pr_by_id = {
            pr.id: pr
            for pr in session.query(PullRequest).filter_by(repo_id=repo.id).all()
        }
        files_by_pr = {}
        for pr_id, pr in pr_by_id.items():
            files_by_pr[pr_id] = [
                f.file_path
                for f in session.query(PRFile).filter_by(pr_id=pr_id).all()
            ]

        predictions = (
            session.query(Prediction)
            .filter(Prediction.pr_a_id.in_(list(pr_by_id.keys())))
            .all()
        )

        conflicts = []
        for pred in predictions:
            pa = pr_by_id.get(pred.pr_a_id)
            pb = pr_by_id.get(pred.pr_b_id)
            if not pa or not pb:
                continue
            shared = list(set(files_by_pr.get(pa.id, [])) & set(files_by_pr.get(pb.id, [])))
            conflicts.append({
                "id": f"conflict-{pred.id}",
                "prA": {
                    "number": pa.pr_number,
                    "title": pa.title or "",
                    "author": pa.author or "",
                    "filesChanged": pa.files_changed or 0,
                    "branch": "",
                },
                "prB": {
                    "number": pb.pr_number,
                    "title": pb.title or "",
                    "author": pb.author or "",
                    "filesChanged": pb.files_changed or 0,
                    "branch": "",
                },
                "conflictProbability": round(float(pred.conflict_probability), 4),
                "riskLevel": (pred.risk_level or "LOW").upper(),
                "sharedFiles": len(shared),
                "sharedFilesList": shared[:10],
                "sharedLines": 0,
                "confidence": round(float(pred.confidence or 0), 4),
            })

        # Sort by conflict probability descending
        conflicts.sort(key=lambda c: c["conflictProbability"], reverse=True)

        # Merge order
        order_raw = build_merge_order(session, repo.id)
        merge_order = [
            {
                "prNumber": num,
                "title": title,
                "conflictScore": round(score, 4),
                "riskLevel": _risk_label(score),
            }
            for num, title, score in order_raw
        ]

        prs_out = [
            {
                "number": pr.pr_number,
                "title": pr.title or "",
                "author": pr.author or "",
                "filesChanged": pr.files_changed or 0,
                "linesAdded": pr.lines_added or 0,
                "linesDeleted": pr.lines_deleted or 0,
            }
            for pr in pr_by_id.values()
        ]

        return jsonify({
            "repo_url": repo_url,
            "pr_count": len(prs_out),
            "conflict_count": len(conflicts),
            "conflicts": conflicts,
            "prs": prs_out,
            "merge_order": merge_order,
        })


@app.get("/api/conflicts")
def get_conflicts():
    """Return stored conflict predictions for a repo (no re-fetch)."""
    repo_url = request.args.get("repo_url", "").strip()
    if not repo_url:
        return jsonify({"error": "repo_url query param required"}), 400

    engine, session_factory = _get_engine_and_session()
    with session_factory() as session:
        repo = session.query(Repository).filter_by(url=repo_url).first()
        if not repo:
            return jsonify({"conflicts": [], "message": "Repository not analyzed yet."})

        pr_by_id = {pr.id: pr for pr in session.query(PullRequest).filter_by(repo_id=repo.id).all()}
        predictions = session.query(Prediction).filter(
            Prediction.pr_a_id.in_(list(pr_by_id.keys()))
        ).all()

        conflicts = []
        for pred in predictions:
            pa = pr_by_id.get(pred.pr_a_id)
            pb = pr_by_id.get(pred.pr_b_id)
            if pa and pb:
                conflicts.append({
                    "id": f"conflict-{pred.id}",
                    "prA": {"number": pa.pr_number, "title": pa.title or "", "author": pa.author or "", "filesChanged": pa.files_changed or 0},
                    "prB": {"number": pb.pr_number, "title": pb.title or "", "author": pb.author or "", "filesChanged": pb.files_changed or 0},
                    "conflictProbability": round(float(pred.conflict_probability), 4),
                    "riskLevel": (pred.risk_level or "LOW").upper(),
                    "sharedFiles": 0,
                    "sharedLines": 0,
                    "confidence": round(float(pred.confidence or 0), 4),
                })

        conflicts.sort(key=lambda c: c["conflictProbability"], reverse=True)
        return jsonify({"conflicts": conflicts})


@app.get("/api/prs")
def get_prs():
    repo_url = request.args.get("repo_url", "").strip()
    if not repo_url:
        return jsonify({"error": "repo_url required"}), 400

    engine, session_factory = _get_engine_and_session()
    with session_factory() as session:
        repo = session.query(Repository).filter_by(url=repo_url).first()
        if not repo:
            return jsonify({"prs": []})
        prs = session.query(PullRequest).filter_by(repo_id=repo.id).all()
        return jsonify({"prs": [
            {"number": pr.pr_number, "title": pr.title or "", "author": pr.author or "",
             "filesChanged": pr.files_changed or 0}
            for pr in prs
        ]})


@app.get("/api/merge-order")
def get_merge_order():
    repo_url = request.args.get("repo_url", "").strip()
    if not repo_url:
        return jsonify({"error": "repo_url required"}), 400

    engine, session_factory = _get_engine_and_session()
    with session_factory() as session:
        repo = session.query(Repository).filter_by(url=repo_url).first()
        if not repo:
            return jsonify({"merge_order": []})
        order = build_merge_order(session, repo.id)
        return jsonify({"merge_order": [
            {"prNumber": num, "title": title, "conflictScore": round(score, 4), "riskLevel": _risk_label(score)}
            for num, title, score in order
        ]})


# ── entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    log.info("Starting MergeMaven API on http://localhost:%d", port)
    app.run(host="0.0.0.0", port=port, debug=False)
