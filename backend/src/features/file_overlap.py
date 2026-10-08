"""File-level overlap computation between two pull requests."""

from typing import Iterable


def file_overlap(files_a: Iterable[str], files_b: Iterable[str]) -> float:
    """Return the Jaccard similarity of the files touched by two PRs.

    File Overlap = |A ∩ B| / |A ∪ B|

    Returns 0.0 when both PRs touch no files (avoids 0/0).
    """
    set_a = {f.strip("/") for f in files_a if f}
    set_b = {f.strip("/") for f in files_b if f}
    if not set_a and not set_b:
        return 0.0
    union = set_a | set_b
    if not union:
        return 0.0
    return len(set_a & set_b) / len(union)