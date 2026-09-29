"""SQLAlchemy models mirroring the SQLite schema."""

from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    Text,
    Boolean,
    ForeignKey,
    DateTime,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True)
    url = Column(Text, unique=True, nullable=False)
    name = Column(Text)
    last_analyzed = Column(DateTime)

    pull_requests = relationship("PullRequest", back_populates="repository")
    historical_merges = relationship("HistoricalMerge", back_populates="repository")


class PullRequest(Base):
    __tablename__ = "pull_requests"

    id = Column(Integer, primary_key=True)
    repo_id = Column(Integer, ForeignKey("repositories.id"))
    pr_number = Column(Integer, nullable=False)
    title = Column(Text)
    author = Column(Text)
    created_at = Column(DateTime)
    lines_added = Column(Integer, default=0)
    lines_deleted = Column(Integer, default=0)
    files_changed = Column(Integer, default=0)

    repository = relationship("Repository", back_populates="pull_requests")
    files = relationship("PRFile", back_populates="pr")
    pair_features_as_a = relationship(
        "PRPairFeature", foreign_keys="PRPairFeature.pr_a_id", back_populates="pr_a"
    )
    pair_features_as_b = relationship(
        "PRPairFeature", foreign_keys="PRPairFeature.pr_b_id", back_populates="pr_b"
    )
    predictions_as_a = relationship(
        "Prediction", foreign_keys="Prediction.pr_a_id", back_populates="pr_a"
    )
    predictions_as_b = relationship(
        "Prediction", foreign_keys="Prediction.pr_b_id", back_populates="pr_b"
    )


class PRFile(Base):
    __tablename__ = "pr_files"

    id = Column(Integer, primary_key=True)
    pr_id = Column(Integer, ForeignKey("pull_requests.id"))
    file_path = Column(Text, nullable=False)
    lines_added = Column(Integer, default=0)
    lines_deleted = Column(Integer, default=0)
    line_ranges = Column(Text)  # JSON: [[45, 67], [120, 140]]

    pr = relationship("PullRequest", back_populates="files")


class PRPairFeature(Base):
    __tablename__ = "pr_pair_features"

    id = Column(Integer, primary_key=True)
    pr_a_id = Column(Integer, ForeignKey("pull_requests.id"))
    pr_b_id = Column(Integer, ForeignKey("pull_requests.id"))
    file_overlap = Column(Float, default=0.0)
    line_overlap = Column(Float, default=0.0)
    module_overlap = Column(Float, default=0.0)
    history_conflict_rate = Column(Float, default=0.0)

    pr_a = relationship("PullRequest", foreign_keys=[pr_a_id], back_populates="pair_features_as_a")
    pr_b = relationship("PullRequest", foreign_keys=[pr_b_id], back_populates="pair_features_as_b")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True)
    pr_a_id = Column(Integer, ForeignKey("pull_requests.id"))
    pr_b_id = Column(Integer, ForeignKey("pull_requests.id"))
    conflict_probability = Column(Float, default=0.0)
    risk_level = Column(String, default="Low")
    confidence = Column(Float, default=0.0)
    predicted_at = Column(DateTime, default=datetime.utcnow)

    pr_a = relationship("PullRequest", foreign_keys=[pr_a_id], back_populates="predictions_as_a")
    pr_b = relationship("PullRequest", foreign_keys=[pr_b_id], back_populates="predictions_as_b")


class HistoricalMerge(Base):
    __tablename__ = "historical_merges"

    id = Column(Integer, primary_key=True)
    repo_id = Column(Integer, ForeignKey("repositories.id"))
    pr_a_number = Column(Integer, nullable=False)
    pr_b_number = Column(Integer, nullable=False)
    did_conflict = Column(Boolean, nullable=False)
    merged_at = Column(DateTime, default=datetime.utcnow)

    repository = relationship("Repository", back_populates="historical_merges")


__all__ = [
    "Base",
    "Repository",
    "PullRequest",
    "PRFile",
    "PRPairFeature",
    "Prediction",
    "HistoricalMerge",
]