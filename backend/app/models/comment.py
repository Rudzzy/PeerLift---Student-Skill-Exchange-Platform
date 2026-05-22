"""Comment model for post discussions."""

import uuid
from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db


class Comment(db.Model):
    __tablename__ = "comments"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False
    )
    author_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    content = db.Column(db.Text, nullable=False)
    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    post = db.relationship("Post", back_populates="comments")
    author = db.relationship("User")

    def to_dict(self):
        return {
            "id": str(self.id),
            "post_id": str(self.post_id),
            "author": self.author.to_mini_dict() if self.author else None,
            "content": self.content,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
