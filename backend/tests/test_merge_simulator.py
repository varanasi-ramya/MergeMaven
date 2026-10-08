"""Tests for the git merge-tree simulator."""

import os
import subprocess
import tempfile

import pytest

from verification.merge_simulator import MergeSimulator


def _git(args, cwd):
    return subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True)


@pytest.fixture
def local_repo():
    """Create a local git repo with two branches that conflict."""
    root = tempfile.mkdtemp(prefix="mg_test_")
    _git(["init", "-b", "main"], root)
    _git(["config", "user.email", "test@example.com"], root)
    _git(["config", "user.name", "Test"], root)

    # Commit a base file on main.
    base_path = os.path.join(root, "shared.py")
    with open(base_path, "w") as f:
        f.write("def greet():\n    return 'hello'\n")
    _git(["add", "."], root)
    _git(["commit", "-m", "base"], root)
    base_sha = _git(["rev-parse", "HEAD"], root).stdout.strip()

    # Create branch A that modifies the function.
    _git(["checkout", "-b", "branchA"], root)
    with open(base_path, "w") as f:
        f.write("def greet():\n    return 'hi'\n")
    _git(["add", "."], root)
    _git(["commit", "-m", "a change"], root)
    head_a = _git(["rev-parse", "HEAD"], root).stdout.strip()

    # Return to main and create branch B that modifies the same lines.
    _git(["checkout", "main"], root)
    _git(["checkout", "-b", "branchB"], root)
    with open(base_path, "w") as f:
        f.write("def greet():\n    return 'hey'\n")
    _git(["add", "."], root)
    _git(["commit", "-m", "b change"], root)
    head_b = _git(["rev-parse", "HEAD"], root).stdout.strip()

    yield {
        "root": root,
        "base_sha": base_sha,
        "head_a": head_a,
        "head_b": head_b,
    }

    import shutil
    shutil.rmtree(root, ignore_errors=True)


def test_merge_tree_detects_conflict(local_repo):
    sim = MergeSimulator(work_dir=local_repo["root"])
    sim._repo_path = local_repo["root"]
    result = sim.merge_tree(
        local_repo["base_sha"],
        local_repo["head_a"],
        local_repo["head_b"],
    )
    assert result.did_conflict is True


def test_merge_tree_clean_when_no_overlap(local_repo):
    sim = MergeSimulator(work_dir=local_repo["root"])
    sim._repo_path = local_repo["root"]
    # Merging branchA onto itself should not conflict.
    result = sim.merge_tree(
        local_repo["base_sha"],
        local_repo["head_a"],
        local_repo["head_a"],
    )
    assert result.did_conflict is False