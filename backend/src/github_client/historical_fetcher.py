"""Fetch historical merged pull requests for training data."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from github import Github


class HistoricalMergeFetcher:
    """Fetches past merged PRs from a GitHub repository for training."""

    def __init__(self, token: Optional[str] = None) -> None:
        token = token or __import__("os").environ.get("GITHUB_TOKEN")
        self._github = Github(token) if token else Github()

    def fetch_merged_prs(self, repo_url: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Return metadata for the most recently merged PRs.

        Each entry includes pr_number, merged_at, merge_commit_sha, title,
        author, and base/head refs.
        """
        path = repo_url.strip()
        if path.startswith("http://") or path.startswith("https://"):
            path = path.split("github.com/", 1)[-1]
        path = path.rstrip("/").removesuffix(".git")
        repo = self._github.get_repo(path)

        results: List[Dict[str, Any]] = []
        for pr in repo.get_pulls(state="closed", sort="updated", direction="desc"):
            if not pr.merged:
                continue
            results.append(
                {
                    "pr_number": pr.number,
                    "title": pr.title,
                    "author": pr.user.login if pr.user else None,
                    "merged_at": pr.merged_at.isoformat() if pr.merged_at else None,
                    "merge_commit_sha": pr.merge_commit_sha,
                    "base_ref": pr.base.ref,
                    "head_ref": pr.head.ref,
                    "base_sha": pr.base.sha,
                    "head_sha": pr.head.sha,
                }
            )
            if len(results) >= limit:
                break
        return results