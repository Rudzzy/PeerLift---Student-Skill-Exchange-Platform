"""Like model — supports likes on posts and comments."""

import uuid
from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db


class Like(db.Model):
    __tablename__ = "likes"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    post_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("posts.id", ondelete="CASCADE"), nullable=True
    )
    comment_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("comments.id", ondelete="CASCADE"), nullable=True
    )
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        db.UniqueConstraint("user_id", "post_id", name="uq_user_post_like"),
        db.UniqueConstraint("user_id", "comment_id", name="uq_user_comment_like"),
    )

    # Relationships
    user = db.relationship("User")
    post = db.relationship("Post", back_populates="likes")
