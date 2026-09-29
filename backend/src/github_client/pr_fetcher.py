"""Fetch PR data from a GitHub repository and persist it locally."""

from typing import Any, Dict, List

from .api_client import GitHubAPIClient


class PRFetcher:
    """High-level interface for pulling PR data from GitHub."""

    def __init__(self, token: str | None = None) -> None:
        self.client = GitHubAPIClient(token=token)

    def fetch(self, repo_url: str) -> List[Dict[str, Any]]:
        """Return a list of open PR dictionaries for the given repository."""
        return self.client.fetch_open_prs(repo_url)