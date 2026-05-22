"""Message model for match-based conversations."""

import uuid
from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db


class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("matches.id", ondelete="CASCADE"), nullable=False
    )
    sender_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    content = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    match = db.relationship("Match", back_populates="messages")
    sender = db.relationship("User")

    def to_dict(self):
        return {
            "id": str(self.id),
            "match_id": str(self.match_id),
            "sender": self.sender.to_mini_dict() if self.sender else None,
            "content": self.content,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
