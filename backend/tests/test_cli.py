"""End-to-end tests for the fetch CLI using a mocked GitHub client."""

from datetime import datetime

import pytest
from click.testing import CliRunner

import cli
from github_client.pr_fetcher import PRFetcher
from github_client.api_client import GitHubAPIClient
from api.db import get_engine, init_db, get_session_factory
from api.models import Repository, PullRequest, PRFile


class FakeFile:
    def __init__(self, filename, additions, deletions, patch=""):
        self.filename = filename
        self.additions = additions
        self.deletions = deletions
        self.changes = additions + deletions
        self.patch = patch
        self.status = "modified"


class FakeUser:
    def __init__(self, login):
        self.login = login


class FakePR:
    def __init__(self, number, title, author, files, created_at):
        self.number = number
        self.title = title
        self.user = FakeUser(author)
        self.created_at = created_at
        self.updated_at = created_at
        self.base = type("obj", (object,), {"ref": "main"})()
        self.head = type("obj", (object,), {"ref": "feature"})()
        self._files = files

    def get_files(self):
        return self._files


class FakeRepo:
    def __init__(self, prs):
        self._prs = prs

    def get_pulls(self, state="open"):
        return iter(self._prs)


class FakeGithub:
    def __init__(self, token=None):
        self.token = token
        self._pr_map = {
            "psf/requests": FakeRepo([
                FakePR(1, "Fix timeout", "alice", [
                    FakeFile("src/timeout.py", 10, 2),
                ], datetime(2024, 1, 1)),
                FakePR(2, "Add retry", "bob", [
                    FakeFile("src/timeout.py", 5, 8),
                    FakeFile("src/retry.py", 20, 0),
                ], datetime(2024, 1, 2)),
            ]),
        }

    def get_repo(self, full_name_or_id):
        return self._pr_map[full_name_or_id]


@pytest.fixture
def isolated_db(monkeypatch, tmp_path):
    """Provide an isolated SQLite database for each test."""
    db_path = tmp_path / "test.db"
    monkeypatch.setattr("cli.get_engine", lambda: get_engine(db_path))
    monkeypatch.setattr("github_client.api_client.Github", FakeGithub)
    engine = get_engine(db_path)
    init_db(engine)
    return db_path


def test_fetch_command_stores_prs(isolated_db):
    runner = CliRunner()
    result = runner.invoke(cli.cli, ["fetch", "--repo", "https://github.com/psf/requests"])
    assert result.exit_code == 0, result.output
    assert "Fetched 2 open PR(s)" in result.output
    assert "PR data stored in database." in result.output

    engine = get_engine(isolated_db)
    session_factory = get_session_factory(engine)
    with session_factory() as session:
        repo = session.query(Repository).filter_by(url="https://github.com/psf/requests").first()
        assert repo is not None
        prs = session.query(PullRequest).filter_by(repo_id=repo.id).all()
        assert len(prs) == 2
        pr1 = session.query(PullRequest).filter_by(pr_number=1).first()
        assert pr1.title == "Fix timeout"
        assert pr1.author == "alice"
        assert pr1.files_changed == 1
        files = session.query(PRFile).filter_by(pr_id=pr1.id).all()
        assert len(files) == 1
        assert files[0].file_path == "src/timeout.py"


def test_list_command_shows_prs(isolated_db):
    # First populate via fetch
    runner = CliRunner()
    runner.invoke(cli.cli, ["fetch", "--repo", "https://github.com/psf/requests"])

    result = runner.invoke(cli.cli, ["list", "--repo", "https://github.com/psf/requests"])
    assert result.exit_code == 0, result.output
    assert "PR #1" in result.output
    assert "PR #2" in result.output
    assert "alice" in result.output
    assert "bob" in result.output


def test_list_command_no_data(isolated_db, tmp_path):
    runner = CliRunner()
    # Use a repo that has never been fetched
    result = runner.invoke(cli.cli, ["list", "--repo", "https://github.com/totally/empty"])
    assert result.exit_code == 0
    assert "No data found" in result.output