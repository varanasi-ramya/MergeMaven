"""Simulate merges locally using git merge-tree to determine conflicts."""

import os
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class MergeResult:
    """Outcome of a simulated merge."""

    did_conflict: bool
    conflicting_files: List[str]
    exit_code: int
    stderr: str


class MergeSimulator:
    """Clones a repository and uses `git merge-tree` to test merge outcomes."""

    def __init__(self, work_dir: Optional[str] = None) -> None:
        self.work_dir = work_dir or tempfile.gettempdir()
        self._repo_path: Optional[str] = None

    def _run(self, args: list, cwd: str) -> subprocess.CompletedProcess:
        return subprocess.run(
            ["git", *args],
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=120,
        )

    def prepare(self, repo_url: str, branch: str = "main") -> str:
        """Clone the repository (shallow) and return the local path."""
        repo_dir = tempfile.mkdtemp(prefix="mergeguard_", dir=self.work_dir)
        self._run(["clone", "--depth", "1", "--branch", branch, repo_url, repo_dir], cwd=self.work_dir)
        self._repo_path = repo_dir
        return repo_dir

    def prepare_full(self, repo_url: str) -> str:
        """Clone the full repository history for merge simulation."""
        repo_dir = tempfile.mkdtemp(prefix="mergeguard_full_", dir=self.work_dir)
        self._run(["clone", repo_url, repo_dir], cwd=self.work_dir)
        self._repo_path = repo_dir
        return repo_dir

    def fetch_ref(self, ref: str) -> None:
        """Fetch a specific ref (e.g. a PR head) into the local clone."""
        if not self._repo_path:
            raise RuntimeError("Repository not prepared; call prepare() first")
        self._run(["fetch", "origin", ref], cwd=self._repo_path)

    def merge_tree(
        self,
        base_sha: str,
        head_a_sha: str,
        head_b_sha: str,
    ) -> MergeResult:
        """Use `git merge-tree` to simulate merging head_b onto head_a from base.

        Returns whether the merge would conflict and which files conflict.

        Note: git < 2.38 exits non-zero on conflict; git >= 2.38 writes conflict
        markers to stdout and exits 0. We detect conflicts by scanning the
        output for conflict markers, which works across both versions.
        """
        if not self._repo_path:
            raise RuntimeError("Repository not prepared; call prepare() first")

        result = self._run(
            ["merge-tree", base_sha, head_a_sha, head_b_sha],
            cwd=self._repo_path,
        )

        combined = (result.stdout or "") + (result.stderr or "")
        conflict_markers = {"<<<<<<<", "=======", ">>>>>>>"}
        did_conflict = any(marker in combined for marker in conflict_markers)

        conflicting_files: List[str] = []
        for line in result.stdout.splitlines():
            stripped = line.strip()
            if stripped.startswith("changed in both") or stripped.startswith("CONFLICT"):
                parts = stripped.split(":", 1)
                if len(parts) == 2:
                    file_part = parts[1].strip()
                    if "in" in file_part:
                        path = file_part.split("in", 1)[1].strip().strip('"').strip("'")
                        conflicting_files.append(path)
                    else:
                        conflicting_files.append(file_part)

        # Fallback: extract file paths from "base/our/their <mode> <sha> <path>" lines
        if not conflicting_files and did_conflict:
            for line in result.stdout.splitlines():
                tokens = line.strip().split()
                if len(tokens) >= 4 and tokens[-1] not in ("", "<<<<<<<", "=======", ">>>>>>>"):
                    conflicting_files.append(tokens[-1])

        if did_conflict and not conflicting_files:
            conflicting_files = ["<unparsed>"]

        return MergeResult(
            did_conflict=did_conflict,
            conflicting_files=conflicting_files,
            exit_code=result.returncode,
            stderr=result.stderr,
        )

    def cleanup(self) -> None:
        """Remove the cloned repository."""
        if self._repo_path and os.path.isdir(self._repo_path):
            shutil.rmtree(self._repo_path, ignore_errors=True)
        self._repo_path = None