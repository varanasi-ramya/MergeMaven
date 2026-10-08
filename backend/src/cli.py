"""Command-line interface for MergeGuard."""

import json
import os
import sys
from datetime import datetime

import click
from github import Github
from github.GithubException import RateLimitExceededException

from github_client.pr_fetcher import PRFetcher
from api.db import get_engine, init_db, get_session_factory
from api.models import Repository, PullRequest, PRFile, Prediction
from sqlalchemy.orm import Session
from model.bayesian_network import BayesianConflictModel
from planning.merge_order import build_merge_order, merge_order_summary
from report.generator import generate_text_report, generate_json_report
from verification.merge_simulator import MergeSimulator
from features.dataset import build_labeled_dataset, save_dataset


def _is_rate_limit_error(exc: Exception) -> bool:
    """Return True if the exception is a GitHub rate-limit error."""
    if isinstance(exc, RateLimitExceededException):
        return True
    return "rate limit exceeded" in str(exc).lower()


def _parse_datetime(value):
    """Parse an ISO 8601 timestamp into a datetime object, or return None."""
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


@click.group()
def cli():
    """MergeGuard: Predict Pull Request Conflicts Before They Happen."""


def _get_repo_id(session, repo_url):
    repo = session.query(Repository).filter_by(url=repo_url).first()
    if not repo:
        raise click.UsageError(f"No repository found for URL: {repo_url}")
    return repo.id


@cli.command()
@click.option("--repo", required=True, help="GitHub repository URL")
@click.option("--token", envvar="GITHUB_TOKEN", help="GitHub personal access token")
def fetch(repo, token):
    """Fetch open PRs from a repository and store them in the database."""
    engine = get_engine()
    init_db(engine)
    session_factory = get_session_factory(engine)

    fetcher = PRFetcher(token=token)
    try:
        prs = fetcher.fetch(repo)
    except Exception as exc:
        if _is_rate_limit_error(exc):
            click.echo(
                "GitHub API rate limit exceeded. Set a token with --token or "
                "the GITHUB_TOKEN environment variable (create one at "
                "github.com/settings/tokens).", err=True
            )
            sys.exit(1)
        raise

    click.echo(f"Fetched {len(prs)} open PR(s) from {repo}")

    with session_factory() as session:
        repo_record = session.query(Repository).filter_by(url=repo).first()
        if not repo_record:
            repo_record = Repository(url=repo, name=repo)
            session.add(repo_record)
            session.flush()

        for pr_data in prs:
            existing = (
                session.query(PullRequest)
                .filter_by(repo_id=repo_record.id, pr_number=pr_data["pr_number"])
                .first()
            )
            if existing:
                continue
            pr_record = PullRequest(
                repo_id=repo_record.id,
                pr_number=pr_data["pr_number"],
                title=pr_data["title"],
                author=pr_data["author"],
                created_at=_parse_datetime(pr_data["created_at"]),
                lines_added=pr_data["lines_added"],
                lines_deleted=pr_data["lines_deleted"],
                files_changed=pr_data["files_changed"],
            )
            session.add(pr_record)
            session.flush()
            for f in pr_data.get("files", []):
                session.add(
                    PRFile(
                        pr_id=pr_record.id,
                        file_path=f["filename"],
                        lines_added=f["additions"],
                        lines_deleted=f["deletions"],
                        line_ranges=json.dumps([]),
                    )
                )
        session.commit()
        click.echo("PR data stored in database.")

@cli.command()
@click.option("--repo", required=True, help="GitHub repository URL")
def order(repo):
    """Show the recommended merge order for a repository."""
    engine = get_engine()
    init_db(engine)
    session_factory = get_session_factory(engine)

    with session_factory() as session:
        repo_id = _get_repo_id(session, repo)
        order = build_merge_order(session, repo_id)
        click.echo(merge_order_summary(order))

@cli.command()
@click.option("--repo", required=True, help="GitHub repository URL")
def predict(repo):
    """Run conflict predictions on stored PR pairs."""
    engine = get_engine()
    init_db(engine)
    session_factory = get_session_factory(engine)

    with session_factory() as session:
        repo_id = _get_repo_id(session, repo)

        # Try to load an existing model if available
        model_path = os.path.join(os.path.dirname(__file__), "model/model.bif")
        if os.path.exists(model_path):
            model = BayesianConflictModel.load(model_path)
            if not model.trained:
                click.echo("Model file exists but model is not trained.")
                sys.exit(1)
        else:
            click.echo("No trained model found. Run 'build' first.")
            sys.exit(1)

        from model.predict import predict_all_pairs
        predictions = predict_all_pairs(session, repo_id, model)
        click.echo(f"Predicted conflicts for {len(predictions)} PR pairs.")

        pr_by_id = {pr.id: pr for pr in session.query(PullRequest).filter_by(repo_id=repo_id).all()}
        for pred in predictions:
            a = pr_by_id.get(pred.pr_a_id)
            b = pr_by_id.get(pred.pr_b_id)
            if a and b:
                click.echo(
                    f"PR #{a.pr_number} <-> PR #{b.pr_number}: "
                    f"{pred.conflict_probability:.2f} ({pred.risk_level})"
                )

@cli.command()
@click.option("--repo", required=True, help="GitHub repository URL")
@click.option("--output", "output_path", help="Path to save text report")
def report(repo, output_path):
    """Generate a human-readable conflict report."""
    engine = get_engine()
    init_db(engine)
    session_factory = get_session_factory(engine)

    with session_factory() as session:
        repo_id = _get_repo_id(session, repo)
        report_text = generate_text_report(session, repo_id)
        click.echo(report_text)

        if output_path:
            with open(output_path, "w") as f:
                f.write(report_text)
            click.echo(f"Text report saved to {output_path}")

@cli.command()
@click.option("--repo", required=True, help="GitHub repository URL")
@click.option("--build-dir", default=".venv", help="Directory containing the virtual environment")
def build(repo, build_dir):
    """Build the model and extract features from stored PR data."""
    engine = get_engine()
    init_db(engine)
    session_factory = get_session_factory(engine)

    with session_factory() as session:
        repo_id = _get_repo_id(session, repo)

        from features.pipeline import extract_all_pairs
        extract_all_pairs(session, repo_id)
        click.echo("Features extracted for all PR pairs.")

        df = build_labeled_dataset(session, repo_id, repo, limit=200)
        model = BayesianConflictModel()
        model.fit(df)
        model_path = os.path.join(os.path.dirname(__file__), "model/model.bif")
        model.save(model_path)
        click.echo(f"Model trained and saved to {model_path}")

@cli.command()
@click.option("--repo", required=True, help="GitHub repository URL")
@click.option("--base", required=True, help="Base commit hash for merge simulation")
@click.option("--head-a", required=True, help="Head A commit hash")
@click.option("--head-b", required=True, help="Head B commit hash")
@click.option("--sim-dir", default=".venv", help="Directory containing the virtual environment")
def verify(repo, base, head_a, head_b, sim_dir):
    """Simulate a merge using git merge-tree and verify predictions."""
    engine = get_engine()
    init_db(engine)
    session_factory = get_session_factory(engine)

    with session_factory() as session:
        repo_id = _get_repo_id(session, repo)

        repo_record = session.query(Repository).filter_by(id=repo_id).first()
        if not repo_record:
            click.echo(f"Repository {repo} not found in database.")
            sys.exit(1)

        repo_url = repo_record.url

        sim = MergeSimulator()
        sim.prepare_full(repo_url)
        try:
            sim.fetch_ref(head_a)
            sim.fetch_ref(head_b)
            result = sim.merge_tree(base, head_a, head_b)
            click.echo(f"Merge simulation completed.")
            click.echo(f"Did conflict: {result.did_conflict}")
            click.echo(f"Conflicting files: {', '.join(result.conflicting_files)}")
        finally:
            sim.cleanup()

@cli.command()
@click.option("--repo", required=True, help="GitHub repository URL")
@click.option("--output", "output_path", help="Path to save JSON dataset")
def dataset(repo, output_path):
    """Generate a labeled training dataset from historical merges."""
    engine = get_engine()
    init_db(engine)
    session_factory = get_session_factory(engine)

    with session_factory() as session:
        repo_id = _get_repo_id(session, repo)

        samples = build_labeled_dataset(session, repo_id, repo, limit=200)
        click.echo(f"Generated {len(samples)} training samples.")

        if output_path:
            save_dataset(samples, output_path)
            click.echo(f"Dataset saved to {output_path}")

@cli.command()
def list():
    """List previously fetched PRs."""
    engine = get_engine()
    init_db(engine)
    session_factory = get_session_factory(engine)
    with session_factory() as session:
        repos = session.query(Repository).all()
        for repo_record in repos:
            prs = session.query(PullRequest).filter_by(repo_id=repo_record.id).all()
            if prs:
                click.echo(f"\nRepository: {repo_record.url}")
                for pr in prs:
                    click.echo(
                        f"  PR #{pr.pr_number}: {pr.title} by {pr.author} "
                        f"({pr.files_changed} files, +{pr.lines_added} -{pr.lines_deleted})"
                    )