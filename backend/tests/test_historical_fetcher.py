"""Tests for the historical merge fetcher (mocked GitHub client)."""

from datetime import datetime

import pytest

from github_client import historical_fetcher


class FakeUser:
    def __init__(self, login):
        self.login = login


class FakePR:
    def __init__(self, number, merged, merged_at, sha):
        self.number = number
        self.merged = merged
        self.merged_at = merged_at
        self.merge_commit_sha = sha
        self.user = FakeUser("dev")
        self.title = f"PR #{number}"
        self.base = type("obj", (object,), {"ref": "main"})()
        self.head = type("obj", (object,), {"ref": "feature"})()
        self.base.sha = "base"
        self.head.sha = "head"


class FakeRepo:
    def __init__(self, prs):
        self._prs = prs

    def get_pulls(self, state="open", sort="updated", direction="desc"):
        return iter(self._prs)


def test_fetch_merged_prs_only_returns_merged():
    fetcher = historical_fetcher.HistoricalMergeFetcher.__new__(historical_fetcher.HistoricalMergeFetcher)
    fetcher._github = type("G", (), {"get_repo": lambda self, name: FakeRepo([
        FakePR(1, True, datetime(2024, 1, 1), "abc"),
        FakePR(2, False, None, None),  # closed but not merged
        FakePR(3, True, datetime(2024, 2, 1), "def"),
    ])})()

    prs = fetcher.fetch_merged_prs("https://github.com/psf/requests")
    assert len(prs) == 2
    assert {p["pr_number"] for p in prs} == {1, 3}
    assert prs[0]["merge_commit_sha"] == "abc"
    assert prs[1]["merge_commit_sha"] == "def"
    assert prs[0]["author"] == "dev"


def test_fetch_respects_limit():
    fetcher = historical_fetcher.HistoricalMergeFetcher.__new__(historical_fetcher.HistoricalMergeFetcher)
    fetcher._github = type("G", (), {"get_repo": lambda self, name: FakeRepo([
        FakePR(i, True, datetime(2024, 1, i), f"sha{i}") for i in range(1, 6)
    ])})()

    prs = fetcher.fetch_merged_prs("https://github.com/o/r", limit=3)
    assert len(prs) == 3