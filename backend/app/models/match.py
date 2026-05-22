"""Match model for skill-exchange requests between users."""

import uuid
from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db


class Match(db.Model):
    __tablename__ = "matches"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requester_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    receiver_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    teach_skill_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("skills.id", ondelete="SET NULL")
    )
    learn_skill_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("skills.id", ondelete="SET NULL")
    )
    status = db.Column(
        db.Enum("pending", "accepted", "rejected", "completed", name="match_status_enum"),
        default="pending",
    )
    match_score = db.Column(db.Integer, default=0)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        db.UniqueConstraint(
            "requester_id", "receiver_id", "teach_skill_id", "learn_skill_id",
            name="uq_match_pair"
        ),
    )

    # Relationships
    requester = db.relationship("User", foreign_keys=[requester_id])
    receiver = db.relationship("User", foreign_keys=[receiver_id])
    teach_skill = db.relationship("Skill", foreign_keys=[teach_skill_id])
    learn_skill = db.relationship("Skill", foreign_keys=[learn_skill_id])
    messages = db.relationship("Message", back_populates="match", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": str(self.id),
            "requester": self.requester.to_mini_dict() if self.requester else None,
            "receiver": self.receiver.to_mini_dict() if self.receiver else None,
            "teach_skill": self.teach_skill.to_dict() if self.teach_skill else None,
            "learn_skill": self.learn_skill.to_dict() if self.learn_skill else None,
            "status": self.status,
            "match_score": self.match_score,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
