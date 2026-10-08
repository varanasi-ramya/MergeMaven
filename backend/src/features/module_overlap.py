"""Module-level overlap computation between two pull requests."""

from typing import Iterable


def _module_of(path: str) -> str:
    """Return the module (directory prefix) for a file path.

    Files at the repository root belong to the root module. Otherwise the
    module is the top-level directory containing the file.
    """
    path = path.strip("/")
    if "/" not in path:
        return "/"
    return "/" + path.split("/", 1)[0] + "/"


def module_overlap(files_a: Iterable[str], files_b: Iterable[str]) -> float:
    """Return the Jaccard similarity of the modules touched by two PRs.

    Module Overlap = |Modules(A) ∩ Modules(B)| / |Modules(A) ∪ Modules(B)|
    """
    modules_a = {_module_of(f) for f in files_a if f}
    modules_b = {_module_of(f) for f in files_b if f}
    union = modules_a | modules_b
    if not union:
        return 0.0
    return len(modules_a & modules_b) / len(union)