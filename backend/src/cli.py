"""Command-line interface for MergeGuard."""

import json
import sys

import click

from github_client.pr_fetcher import PRFetcher
from api.db import get_engine, init_db, get_session_factory
from api.models import Repository, PullRequest, PRFile
from sqlalchemy.orm import Session


@click.group()
def cli():
    """MergeGuard: Predict Pull Request Conflicts Before They Happen."""


@cli.command()
@click.option("--repo", required=True, help="GitHub repository URL")
@click.option("--token", envvar="GITHUB_TOKEN", help="GitHub personal access token")
def fetch(repo, token):
    """Fetch open PRs from a repository and store them in the database."""
    engine = get_engine()
    init_db(engine)
    session_factory = get_session_factory(engine)

    fetcher = PRFetcher(token=token)
    prs = fetcher.fetch(repo)
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
                created_at=pr_data["created_at"],
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