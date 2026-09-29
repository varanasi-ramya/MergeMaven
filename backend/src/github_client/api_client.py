"""GitHub API client wrapper for fetching pull request data."""

import os
from typing import Any, Dict, List, Optional

from github import Github
from github.PullRequest import PullRequest


class GitHubAPIClient:
    """Wraps PyGithub to fetch PR data from a repository."""

    def __init__(self, token: Optional[str] = None) -> None:
        token = token or os.environ.get("GITHUB_TOKEN")
        self._github = Github(token) if token else Github()

    def get_repository(self, repo_url: str):
        """Parse a GitHub URL and return a Repository object.

        Accepts forms like:
            https://github.com/owner/repo
            https://github.com/owner/repo.git
            owner/repo
        """
        path = repo_url.strip()
        if path.startswith("http://") or path.startswith("https://"):
            path = path.split("github.com/", 1)[-1]
        path = path.rstrip("/").removesuffix(".git")
        if not path:
            raise ValueError(f"Could not parse repository from URL: {repo_url}")
        return self._github.get_repo(path)

    def fetch_open_prs(self, repo_url: str) -> List[Dict[str, Any]]:
        """Fetch all open pull requests with their metadata and changed files."""
        repo = self.get_repository(repo_url)
        prs = repo.get_pulls(state="open")
        results: List[Dict[str, Any]] = []
        for pr in prs:
            results.append(self._pr_to_dict(pr))
        return results

    def _pr_to_dict(self, pr: PullRequest) -> Dict[str, Any]:
        """Convert a PullRequest object into a serializable dictionary."""
        files: List[Dict[str, Any]] = []
        for f in pr.get_files():
            files.append(
                {
                    "filename": f.filename,
                    "status": f.status,
                    "additions": f.additions,
                    "deletions": f.deletions,
                    "changes": f.changes,
                    "patch": f.patch or "",
                }
            )
        return {
            "pr_number": pr.number,
            "title": pr.title,
            "author": pr.user.login if pr.user else None,
            "created_at": pr.created_at.isoformat() if pr.created_at else None,
            "updated_at": pr.updated_at.isoformat() if pr.updated_at else None,
            "base_ref": pr.base.ref,
            "head_ref": pr.head.ref,
            "lines_added": sum(f["additions"] for f in files),
            "lines_deleted": sum(f["deletions"] for f in files),
            "files_changed": len(files),
            "files": files,
        }