"""Line-level overlap computation between two pull requests."""

import json
from typing import Iterable, List, Tuple


def _parse_ranges(raw) -> List[Tuple[int, int]]:
    """Parse a JSON string or list into a normalized list of (start, end) ranges.

    Each input range is treated as inclusive on both ends. Ranges are merged
    so that overlapping/adjacent ranges collapse into one.
    """
    if raw is None:
        return []
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except (ValueError, TypeError):
            return []
    if not isinstance(raw, (list, tuple)):
        return []

    ranges: List[Tuple[int, int]] = []
    for item in raw:
        if not isinstance(item, (list, tuple)) or len(item) != 2:
            continue
        try:
            start = int(item[0])
            end = int(item[1])
        except (ValueError, TypeError):
            continue
        if start > end:
            start, end = end, start
        ranges.append((start, end))

    return _merge_ranges(ranges)


def _merge_ranges(ranges: Iterable[Tuple[int, int]]) -> List[Tuple[int, int]]:
    """Merge overlapping or adjacent ranges into a minimal set."""
    sorted_ranges = sorted(ranges, key=lambda r: r[0])
    merged: List[Tuple[int, int]] = []
    for start, end in sorted_ranges:
        if not merged:
            merged.append((start, end))
            continue
        last_start, last_end = merged[-1]
        if start <= last_end + 1:
            merged[-1] = (last_start, max(last_end, end))
        else:
            merged.append((start, end))
    return merged


def _range_length(ranges: Iterable[Tuple[int, int]]) -> int:
    """Total number of lines covered by a set of ranges."""
    return sum(end - start + 1 for start, end in ranges)


def _intersection_length(
    ranges_a: List[Tuple[int, int]], ranges_b: List[Tuple[int, int]]
) -> int:
    """Total number of lines where both range sets overlap."""
    total = 0
    for a_start, a_end in ranges_a:
        for b_start, b_end in ranges_b:
            overlap_start = max(a_start, b_start)
            overlap_end = min(a_end, b_end)
            if overlap_start <= overlap_end:
                total += overlap_end - overlap_start + 1
    return total


def line_overlap(
    files_a: dict, files_b: dict, default: float = 0.0
) -> float:
    """Return the line-level overlap between two PRs.

    files_a / files_b map file path -> list of line ranges (or JSON string).
    For each shared file, the overlapping line count is divided by the total
    lines changed across both PRs for that file. The result is averaged across
    all shared files. If no files are shared, returns `default`.
    """
    shared = set(files_a.keys()) & set(files_b.keys())
    if not shared:
        return default

    total_overlap = 0
    total_changed = 0
    for path in shared:
        ranges_a = _parse_ranges(files_a[path])
        ranges_b = _parse_ranges(files_b[path])
        overlap = _intersection_length(ranges_a, ranges_b)
        changed = _range_length(ranges_a) + _range_length(ranges_b)
        total_overlap += overlap
        total_changed += changed

    if total_changed == 0:
        return default
    return total_overlap / total_changed