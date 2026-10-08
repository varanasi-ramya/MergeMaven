"""Command-line interface for MergeGuard."""

import json
import sys
from datetime import datetime

import click
from github import Github
from github.GithubException import RateLimitExceededException

from github_client.pr_fetcher import PRFetcher
from api.db import get_engine, init_db, get_session_factory
from api.models import Repository, PullRequest, PRFile
from sqlalchemy.orm import Session


@click.group()
def cli():
    """MergeGuard: Predict Pull Request Conflicts Before They Happen."""


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
def list(repo):
    """List previously fetched PRs for a repository."""
    engine = get_engine()
    init_db(engine)
    session_factory = get_session_factory(engine)
    with session_factory() as session:
        repo_record = session.query(Repository).filter_by(url=repo).first()
        if not repo_record:
            click.echo("No data found for that repository.")
            return
        prs = session.query(PullRequest).filter_by(repo_id=repo_record.id).all()
        for pr in prs:
            click.echo(
                f"PR #{pr.pr_number}: {pr.title} by {pr.author} "
                f"({pr.files_changed} files, +{pr.lines_added} -{pr.lines_deleted})"
            )


if __name__ == "__main__":
    cli()