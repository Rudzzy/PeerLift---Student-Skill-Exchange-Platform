"""Notification model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    type = db.Column(
        db.Enum(
            "match_request", "match_accepted", "new_message",
            "post_like", "post_comment", "system",
            name="notification_type_enum",
        ),
        nullable=False,
    )
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    related_id = db.Column(UUID(as_uuid=True), nullable=True)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user = db.relationship("User", back_populates="notifications")

    def to_dict(self):
        return {
            "id": str(self.id),
            "type": self.type,
            "message": self.message,
            "is_read": self.is_read,
            "related_id": str(self.related_id) if self.related_id else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
