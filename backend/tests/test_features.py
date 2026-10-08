"""Tests for the feature extraction modules."""

import pytest

from features.file_overlap import file_overlap
from features.line_overlap import line_overlap, _parse_ranges, _merge_ranges, _intersection_length
from features.module_overlap import module_overlap


# --- file_overlap ---

def test_file_overlap_partial():
    assert file_overlap(["a.py", "b.py"], ["b.py", "c.py"]) == pytest.approx(1 / 3)


def test_file_overlap_identical():
    assert file_overlap(["a.py", "b.py"], ["a.py", "b.py"]) == pytest.approx(1.0)


def test_file_overlap_no_shared():
    assert file_overlap(["a.py"], ["b.py"]) == pytest.approx(0.0)


def test_file_overlap_empty_inputs():
    assert file_overlap([], []) == 0.0
    assert file_overlap(["a.py"], []) == 0.0


def test_file_overlap_normalizes_paths():
    assert file_overlap(["/a.py", "b.py"], ["a.py", "b.py"]) == pytest.approx(1.0)


# --- line_overlap ---

def test_parse_ranges_from_json_string():
    assert _parse_ranges("[[45, 67], [120, 140]]") == [(45, 67), (120, 140)]


def test_parse_ranges_none_returns_empty():
    assert _parse_ranges(None) == []


def test_parse_ranges_merges_overlapping():
    assert _parse_ranges([[1, 10], [5, 20]]) == [(1, 20)]


def test_parse_ranges_merges_adjacent():
    assert _parse_ranges([[1, 5], [6, 10]]) == [(1, 10)]


def test_intersection_length_partial():
    assert _intersection_length([(1, 10)], [(5, 15)]) == 6


def test_intersection_length_no_overlap():
    assert _intersection_length([(1, 5)], [(10, 15)]) == 0


def test_line_overlap_shared_file():
    a = {"a.py": [[1, 10]]}
    b = {"a.py": [[5, 15]]}
    # overlap = 6, total changed = 10 + 11 = 21
    assert line_overlap(a, b) == pytest.approx(6 / 21)


def test_line_overlap_no_shared_files():
    a = {"a.py": [[1, 10]]}
    b = {"b.py": [[1, 10]]}
    assert line_overlap(a, b) == 0.0


def test_line_overlap_empty():
    assert line_overlap({}, {}) == 0.0


# --- module_overlap ---

def test_module_overlap_same_directory():
    assert module_overlap(["auth/a.py", "auth/b.py"], ["auth/c.py"]) == pytest.approx(1.0)


def test_module_overlap_different_directories():
    assert module_overlap(["auth/a.py"], ["src/b.py"]) == pytest.approx(0.0)


def test_module_overlap_partial():
    # A touches auth/ and src/; B touches auth/ only -> 1 shared / 2 total
    assert module_overlap(["auth/a.py", "src/b.py"], ["auth/c.py"]) == pytest.approx(1 / 2)


def test_module_overlap_root_files():
    # Root-level files all belong to the root module, so they always overlap
    assert module_overlap(["main.py"], ["main.py"]) == pytest.approx(1.0)
    assert module_overlap(["main.py"], ["utils.py"]) == pytest.approx(1.0)