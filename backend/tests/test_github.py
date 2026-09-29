"""Tests for the GitHub API client URL parsing."""

import pytest

from github_client.api_client import GitHubAPIClient


class FakeGithub:
    """Minimal stand-in for the github.Github client."""

    def __init__(self, token=None):
        self.token = token

    def get_repo(self, full_name_or_id):
        self.last_repo = full_name_or_id
        return full_name_or_id


def test_parse_https_url(monkeypatch):
    monkeypatch.setattr("github_client.api_client.Github", FakeGithub)
    client = GitHubAPIClient()
    repo = client.get_repository("https://github.com/psf/requests")
    assert repo == "psf/requests"


def test_parse_https_url_with_git_suffix(monkeypatch):
    monkeypatch.setattr("github_client.api_client.Github", FakeGithub)
    client = GitHubAPIClient()
    repo = client.get_repository("https://github.com/psf/requests.git")
    assert repo == "psf/requests"


def test_parse_owner_repo_string(monkeypatch):
    monkeypatch.setattr("github_client.api_client.Github", FakeGithub)
    client = GitHubAPIClient()
    repo = client.get_repository("psf/requests")
    assert repo == "psf/requests"


def test_token_from_env(monkeypatch):
    monkeypatch.setenv("GITHUB_TOKEN", "abc123")
    monkeypatch.setattr("github_client.api_client.Github", FakeGithub)
    client = GitHubAPIClient()
    assert client._github.token == "abc123"