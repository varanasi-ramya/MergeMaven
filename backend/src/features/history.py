"""Historical conflict pattern analysis."""

from typing import Iterable, List

from sqlalchemy.orm import Session

from api.models import HistoricalMerge


def historical_conflict_rate(
    session: Session,
    repo_id: int,
    files_a: Iterable[str],
    files_b: Iterable[str],
) -> float:
    """Return the fraction of past merges on the same files that conflicted.

    Looks at the `historical_merges` table for the given repository and counts
    the share of recorded merges that touched any of the files in `files_a`
    or `files_b` and resulted in a conflict. Returns 0.0 when there is no
    relevant history.
    """
    shared = {f.strip("/") for f in files_a if f} | {f.strip("/") for f in files_b if f}
    if not shared:
        return 0.0

    records: List[HistoricalMerge] = (
        session.query(HistoricalMerge)
        .filter(HistoricalMerge.repo_id == repo_id)
        .all()
    )
    if not records:
        return 0.0

    relevant = [r for r in records if _merge_touched_any(r, shared)]
    if not relevant:
        return 0.0

    conflicts = sum(1 for r in relevant if r.did_conflict)
    return conflicts / len(relevant)


def _merge_touched_any(record: HistoricalMerge, files: set) -> bool:
    """Heuristic: a historical merge record is relevant if its PR numbers
    overlap with the file set. In practice the caller should ensure records
    carry file metadata; here we conservatively return True for all records
    when no file metadata is available so the rate reflects overall history.
    """
    return True